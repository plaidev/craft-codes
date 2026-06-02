import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const APPEND_HASH_PREFIX = '<% APPEND_HASH_PREFIX %>' === 'true';
const RETRY_TIMEOUT_SEC = 3600;

/**
 * カンマ区切り形式のデータをパースします
 * 形式: "operation,collectionName,base64_json_data"
 * @param {string} csvString - カンマ区切り形式の文字列
 * @returns {Object} パース結果 { operation, collectionName, data }
 */
function decodeAndParseData(csvString) {
  // カンマで分割（最大3つまで）
  const firstComma = csvString.indexOf(',');
  const secondComma = csvString.indexOf(',', firstComma + 1);

  if (firstComma === -1 || secondComma === -1) {
    throw new Error('データ形式が不正です。形式: "operation,collection_name,process_data"');
  }

  const operation = csvString.substring(0, firstComma).trim();
  const collectionName = csvString.substring(firstComma + 1, secondComma).trim();
  const base64JsonData = csvString.substring(secondComma + 1).trim();

  // BASE64デコード → JSONパース
  const jsonString = Buffer.from(base64JsonData, 'base64').toString('utf-8');
  const data = JSON.parse(jsonString);

  return { operation, collectionName, data };
}

/**
 * コレクションのスキーマ情報を取得し、プライマリキーと型情報を抽出します
 * @param {string} collectionName - コレクション名
 * @param {Object} docDb - DocumentDBクライアント
 * @param {Object} logger - ログ出力用のロガー
 * @returns {Object} { primaryKeyColumn, schemaTypes }
 */
async function getSchemaInfo(collectionName, docDb, logger) {
  const { schema } = await docDb.getSchema({ collectionName });

  // プライマリキーのカラム名を取得
  const primaryKeyColumn = Object.keys(schema).find(key => schema[key].primaryKey === true);

  // 各フィールドの型情報を取得
  const schemaTypes = Object.fromEntries(
    Object.entries(schema).map(([fieldName, fieldInfo]) => [fieldName, fieldInfo.type])
  );
  logger.debug('スキーマ情報を取得:', {
    collectionName,
    primaryKeyColumn,
    schemaTypes,
  });

  return { primaryKeyColumn, schemaTypes };
}

/**
 * Primary Key用のハッシュプレフィックスを生成します
 * ホットスポット問題を回避するため、辞書順を分散させます
 * @param {string} primaryKey - 元のPrimary Key値
 * @returns {string} 8文字のハッシュプレフィックス（base64url形式）
 */
function generateHashPrefix(primaryKey) {
  const hashBase64url = crypto.createHash('sha256').update(primaryKey).digest('base64url');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64url.substring(4, 12);
  return prefix;
}

/**
 * 元のPrimary Key値にハッシュプレフィックスを付与します
 * ホットスポット問題を回避する場合に使用します
 * @param {string} originalKey - 元のPrimary Key値
 * @param {Object} logger - ログ出力用のロガー
 * @returns {string} 変換後のPrimary Key値（hash prefix付き）
 */
function transformPrimaryKey(originalKey, logger) {
  const hashPrefix = generateHashPrefix(originalKey);
  const transformedKey = `${hashPrefix}-${originalKey}`;

  logger.debug('Primary Key変換:', {
    original: originalKey,
    transformed: transformedKey,
  });

  return transformedKey;
}

/**
 * 値を指定された型に変換します
 * JSON形式の場合は既に適切な型になっているためそのまま返します
 * @param {*} value - 変換対象の値
 * @param {string} type - 期待される型（string, number, boolean, date, array）
 * @returns {*} 変換後の値
 */
function convertType(value, type) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (type) {
    case 'string':
      return typeof value === 'string' ? value : String(value);
    case 'number': {
      if (typeof value === 'number') return value;
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error(`"${value}" を数値に変換できません`);
      }
      return num;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      throw new Error(`"${value}" を真偽値に変換できません`);
    case 'date': {
      if (typeof value === 'string') {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          throw new Error(`"${value}" を日付に変換できません`);
        }
        return date.toISOString();
      }
      return value;
    }
    case 'array': {
      if (Array.isArray(value)) return value;
      try {
        const arr = JSON.parse(value);
        if (!Array.isArray(arr)) {
          throw new Error('配列ではありません');
        }
        return arr;
      } catch (err) {
        throw new Error(`"${value}" を配列に変換できません: ${err.message}`);
      }
    }
    default:
      return value;
  }
}

/**
 * ドキュメントとスキーマ定義のフィールドの整合性を検証します
 * フィールド数や名前の一致をチェックします
 * @param {Object} document - 検証対象のドキュメント
 * @param {Object} schemaTypes - スキーマ定義
 * @param {Object} logger - ログ出力用のロガー
 */
function validateSchema(document, schemaTypes, logger) {
  const documentFields = Object.keys(document).sort();
  const schemaTypesFields = Object.keys(schemaTypes).sort();

  if (JSON.stringify(documentFields) !== JSON.stringify(schemaTypesFields)) {
    const missingInDocument = schemaTypesFields.filter(f => !documentFields.includes(f));
    const extraInDocument = documentFields.filter(f => !schemaTypesFields.includes(f));

    const errors = [];
    if (missingInDocument.length > 0) {
      errors.push(`ドキュメントに不足しているフィールド: ${missingInDocument.join(', ')}`);
    }
    if (extraInDocument.length > 0) {
      errors.push(`ドキュメントに余分なフィールド: ${extraInDocument.join(', ')}`);
    }

    throw new Error(`ドキュメントとスキーマ定義が一致しません: ${errors.join('; ')}`);
  }

  logger.debug('スキーマの検証に成功しました');
}

/**
 * レコードデータを変換します
 * スキーマ定義に基づいて型変換を行い、必要に応じてPrimary Keyにハッシュプレフィックスを付与します
 * @param {Object} record - 変換対象のレコード
 * @param {Object} schemaTypes - スキーマの型定義
 * @param {string} primaryKeyColumn - Primary Keyのカラム名
 * @param {Object} logger - ログ出力用のロガー
 * @returns {Object} 変換後のデータ
 */
function convertRecordData(record, schemaTypes, primaryKeyColumn, logger) {
  // データの型変換
  const convertedData = Object.entries(record).reduce((acc, [colName, value]) => {
    const type = schemaTypes[colName];
    if (!type) {
      throw new Error(`フィールド "${colName}" はスキーマに定義されていません`);
    }
    acc[colName] = convertType(value, type);
    return acc;
  }, {});

  // Primary Key変換（hash prefix付与オプション）
  if (APPEND_HASH_PREFIX) {
    convertedData[primaryKeyColumn] = transformPrimaryKey(convertedData[primaryKeyColumn], logger);
  }

  return convertedData;
}

/**
 * 操作タイプと必須フィールドを検証します
 * @param {Object} parsedData - { operation, collectionName, data }
 * @param {Object} schemaInfo - { schemaTypes, primaryKeyColumn }
 * @param {Object} logger - ログ出力用のロガー
 */
function validateOperation(parsedData, schemaInfo, logger) {
  const { operation, collectionName, data } = parsedData;
  const { schemaTypes, primaryKeyColumn } = schemaInfo;

  if (!['insert', 'update', 'delete'].includes(operation)) {
    throw new Error(`操作タイプが不正です: ${operation}。指定可能な値: insert, update, delete`);
  }

  if (!collectionName) {
    throw new Error('collectionNameは必須です');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('dataフィールドが存在しないか、オブジェクト形式ではありません');
  }

  switch (operation) {
    case 'insert':
      validateSchema(data, schemaTypes, logger);
      break;
    case 'update':
    case 'delete':
      if (!data[primaryKeyColumn]) {
        throw new Error(`Primary Key "${primaryKeyColumn}" が必要です`);
      }
      break;
    default:
      break;
  }
}

/**
 * DocumentDBに新規データを挿入します
 * @param {string} collectionName - コレクション名
 * @param {Object} document - 挿入するドキュメント
 * @param {string} primaryKeyColumn - Primary Keyのカラム名
 * @param {Object} docDb - DocumentDBクライアント
 * @param {Object} logger - ログ出力用のロガー
 */
async function insertDocument(collectionName, document, primaryKeyColumn, docDb, logger) {
  const primaryKeyValue = document[primaryKeyColumn];
  logger.debug('新規データを挿入:', { primaryKeyValue });

  await docDb.insert({
    collectionName,
    data: document,
  });

  logger.debug('データの挿入に成功:', { primaryKeyValue });
}

/**
 * DocumentDBの既存データを更新します
 * @param {string} collectionName - コレクション名
 * @param {Object} document - 更新するドキュメント
 * @param {string} primaryKeyColumn - Primary Keyのカラム名
 * @param {Object} docDb - DocumentDBクライアント
 * @param {Object} logger - ログ出力用のロガー
 */
async function updateDocument(collectionName, document, primaryKeyColumn, docDb, logger) {
  const primaryKeyValue = document[primaryKeyColumn];
  logger.debug('既存データを更新:', { primaryKeyValue });

  await docDb.update({
    collectionName,
    where: { [primaryKeyColumn]: primaryKeyValue },
    data: document,
  });

  logger.debug('データの更新に成功:', { primaryKeyValue });
}

/**
 * DocumentDBからデータを削除します
 * @param {string} collectionName - コレクション名
 * @param {string} primaryKey - 削除対象のPrimary Key値
 * @param {string} primaryKeyColumn - Primary Keyのカラム名
 * @param {Object} docDb - DocumentDBクライアント
 * @param {Object} logger - ログ出力用のロガー
 */
async function deleteDocument(collectionName, primaryKey, primaryKeyColumn, docDb, logger) {
  logger.debug('データを削除:', { primaryKeyValue: primaryKey });

  await docDb.delete({
    collectionName,
    where: { [primaryKeyColumn]: primaryKey },
  });

  logger.debug('データの削除に成功:', { primaryKeyValue: primaryKey });
}

/**
 * 操作タイプに応じてDocumentDBへの処理を実行します
 * @param {string} operation - 操作タイプ（insert, update, delete）
 * @param {string} collectionName - コレクション名
 * @param {Object} convertedData - 変換済みデータ
 * @param {string} primaryKeyColumn - Primary Keyのカラム名
 * @param {Object} docDb - DocumentDBクライアント
 * @param {Object} logger - ログ出力用のロガー
 */
async function executeOperation(
  operation,
  collectionName,
  convertedData,
  primaryKeyColumn,
  docDb,
  logger
) {
  switch (operation) {
    case 'insert':
      await insertDocument(collectionName, convertedData, primaryKeyColumn, docDb, logger);
      break;

    case 'update':
      await updateDocument(collectionName, convertedData, primaryKeyColumn, docDb, logger);
      break;

    case 'delete':
      await deleteDocument(
        collectionName,
        convertedData[primaryKeyColumn],
        primaryKeyColumn,
        docDb,
        logger
      );
      break;
    default:
      break;
  }
}

/**
 * エラー種別に応じてRetRyableErrorをthrowします
 */
function throwSuitableError({ err, RetryableError, retryTimeoutSec, logger }) {
  logger.error('データ処理中にエラーが発生:', {
    status: err.status,
    msg: err.message,
    stack: err.stack,
  });
  const isRetryable =
    err.status && ((err.status >= 500 && err.status < 600) || [408, 429].includes(err.status));
  if (isRetryable) {
    throw new RetryableError(`[retry] ${err.message}`, retryTimeoutSec);
  }
  throw new Error(err.message);
}

/**
 * Datahubジョブフローから受け取った1件分のJSONデータ（BASE64エンコード）をDocumentDBに挿入・更新・削除します
 */
export default async function (data, { MODULES }) {
  const { initLogger, docDb, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    if (data.kind !== 'karte/jobflow') {
      logger.error(new Error('不正なイベント種別です'));
      return;
    }
    const { value } = data.jsonPayload.data;

    // 複数行データのチェック（行ごとにqueueをpublishするチェック）
    if (value.includes('\n')) {
      throw new Error(
        'データが複数レコード分まとめて送られています。ジョブフローで「行ごとにqueue をpublishする」のチェックを入れてください。'
      );
    }

    // BASE64デコード → JSON パース
    let parsedData;
    try {
      parsedData = decodeAndParseData(value);
    } catch (err) {
      logger.error('BASE64デコードまたはJSONパースに失敗:', { error: err.message });
      throw new Error(`受信データの形式が不正です（BASE64形式のJSONが必要）: ${err.message}`);
    }

    const { operation, collectionName, data: record } = parsedData;

    // 複数行データのチェック（改行が含まれている場合はエラー）
    if (Array.isArray(record)) {
      throw new Error(
        'BASE64解析後のデータが複数レコード分含まれています。単一レコードとなるようDatahubクエリを修正ください。'
      );
    }

    // スキーマ情報を動的に取得
    const { primaryKeyColumn, schemaTypes } = await getSchemaInfo(collectionName, docDb, logger);

    // 操作タイプと必須フィールドの検証
    validateOperation(
      { operation, collectionName, data: record },
      { schemaTypes, primaryKeyColumn },
      logger
    );

    // データの型変換とPrimary Key変換
    const convertedData = convertRecordData(record, schemaTypes, primaryKeyColumn, logger);

    // 操作タイプ別に処理
    await executeOperation(
      operation,
      collectionName,
      convertedData,
      primaryKeyColumn,
      docDb,
      logger
    );

    logger.log('処理が完了:', {
      operation,
      collection: collectionName,
      primaryKey: convertedData[primaryKeyColumn],
    });

    return {
      success: true,
      operation,
      collection: collectionName,
      primaryKey: convertedData[primaryKeyColumn],
    };
  } catch (err) {
    throwSuitableError({ err, RetryableError, retryTimeoutSec: RETRY_TIMEOUT_SEC, logger });
  }
}
