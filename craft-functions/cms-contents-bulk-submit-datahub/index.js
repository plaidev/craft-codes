import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const CMS_FIELD_NAMES = '<% CMS_FIELD_NAMES %>';

function parseDataFromRecordString(valueString, logger) {
  const parts = valueString.split(',');

  if (parts.length < 3) {
    logger.error(`データの形式が不正です。要素数が少なすぎます: ${valueString}`);
    throw new Error(`データの形式が不正です。要素数が少なすぎます: ${valueString}`);
  }

  return parts.map(part => part.trim());
}

function createCmsPayload(valuesArray, cmsFieldNamesString) {
  const fieldNames = cmsFieldNamesString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (fieldNames.length !== valuesArray.length) {
    throw new Error(
      `CMSフィールド定義数とデータ要素数が一致しません。フィールド数: ${fieldNames.length}, データ要素数: ${valuesArray.length}`
    );
  }

  const payloadData = {};
  fieldNames.forEach((fieldName, index) => {
    const value = valuesArray[index];
    if (value !== undefined && value !== null && value !== '') {
      payloadData[fieldName] = value;
    }
  });

  return {
    modelId: CMS_MODEL_ID,
    data: payloadData,
  };
}

async function importContent(cmsApi, payload, logger, RetryableError) {
  const contentTitle = payload.data.title || 'N/A';

  try {
    const response = await cmsApi.postV2betaCmsContentCreate(payload);
    return response;
  } catch (e) {
    const status = e.status || (e.data && e.data.status);

    if (status >= 500 || status === 429) {
      throw new RetryableError(
        `コンテンツ「${contentTitle}」の入稿に失敗しました：APIがリトライ可能なエラー（ステータス: ${status}）を返しました。再試行します...`
      );
    }
    throw new Error(
      `コンテンツ「${contentTitle}」の入稿に失敗しました：APIが永続的なエラー（ステータス: ${status}）を返しました。詳細: ${e.message}`
    );
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const token = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const karteApiToken = token[KARTE_APP_TOKEN_SECRET];

    const valueStringData = data.jsonPayload.data.value;
    if (!valueStringData) {
      return;
    }

    const cmsApi = api('@dev-karte/v1.0#1g9n3z10mdh7d91y');
    cmsApi.auth(karteApiToken);

    const values = parseDataFromRecordString(valueStringData, logger);
    const payload = createCmsPayload(values, CMS_FIELD_NAMES);

    await importContent(cmsApi, payload, logger, RetryableError);

    logger.log(`CMS入稿が正常に完了しました。コンテンツタイトル: ${payload.data.title || 'N/A'}`);
  } catch (e) {
    if (e instanceof RetryableError) {
      logger.warn(e.message);
      throw e;
    }

    logger.error('コンテンツ入稿中に予期せぬエラーが発生しました。', { error: e.message });
    throw e;
  }
}
