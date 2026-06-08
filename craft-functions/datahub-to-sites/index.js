import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SITE_NAME = '<% SITE_NAME %>';
const SITE_DIR_PATH = '<% SITE_DIR_PATH %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const HEADER_COLUMNS = '<% HEADER_COLUMNS %>'.split(',').map(v => v.trim());
const FILE_NAME_COLUMN = '<% FILE_NAME_COLUMN %>';
const RETRY_TIMEOUT_SEC = Number('<% RETRY_TIMEOUT_SEC %>');

const CRAFT_API_SPEC_ID = '@dev-karte/v1.0#5yj9jf39mp50ef9q';

function sanitizeFileName(fileName) {
  // 危険な文字を安全な文字に変換
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }

  const sanitized = fileName
    .replace(/\0/g, '') // ヌルバイト削除
    .replace(/\.\./g, '_') // .. を _ に変換（ディレクトリトラバーサル防止）
    .replace(/[/\\]/g, '_') // / と \ を _ に変換（パス区切り文字防止）
    .trim() // 前後の空白削除
    .replace(/^\.+/, ''); // 先頭のドット削除（隠しファイル防止）

  // サニタイズ後に空文字列になった場合はnullを返す
  return sanitized || null;
}

function parseDatahubRow(value) {
  const splitData = value.split(',');
  const obj = HEADER_COLUMNS.reduce((acc, colName, j) => {
    acc[colName] = splitData[j];
    return acc;
  }, {});

  return obj;
}

function parseDatahubRowToMarkdown(obj) {
  const markdown = HEADER_COLUMNS.map(colName => `## ${colName}\n${obj[colName] ?? ''}`).join(
    '\n\n'
  );

  return markdown;
}

async function uploadToSites(siteName, path, content, token, logger) {
  try {
    const craft = api(CRAFT_API_SPEC_ID);
    craft.auth(token);

    const base64Content = Buffer.from(content).toString('base64');

    await craft.postV2betaCraftSitesContentUpload({
      kickHookV2: false,
      siteName,
      path,
      content: base64Content,
    });

    logger.debug(`Upload to Craft Sites succeeded. path: ${path}`);
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `Failed to upload to Craft Sites. path: ${path}, error: ${msg}`;
    throw err;
  }
}

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error(new Error('invalid kind'));
    return;
  }

  const { value } = data.jsonPayload.data;

  try {
    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];

    const rowData = parseDatahubRow(value);
    const markdown = parseDatahubRowToMarkdown(rowData);

    const rawFileName = rowData[FILE_NAME_COLUMN];
    if (!rawFileName) {
      logger.error(new Error(`File name column '${FILE_NAME_COLUMN}' is empty or missing`));
      return;
    }

    // サニタイズ
    const fileName = sanitizeFileName(rawFileName);
    if (!fileName) {
      logger.error(
        new Error(
          `File name could not be sanitized (invalid or empty after sanitization): ${rawFileName}`
        )
      );
      return;
    }

    // サニタイズにより変更があった場合はログに記録
    if (fileName !== rawFileName) {
      logger.warn(`File name was sanitized: "${rawFileName}" -> "${fileName}"`);
    }

    // パスの末尾のスラッシュを削除
    const normalizedDirPath = SITE_DIR_PATH.endsWith('/')
      ? SITE_DIR_PATH.slice(0, -1)
      : SITE_DIR_PATH;

    const path = `${normalizedDirPath}/${fileName}.md`;

    await uploadToSites(SITE_NAME, path, markdown, token, logger);

    logger.log(`Processing completed successfully. path: ${path}`);
  } catch (err) {
    throwSuitableError({
      msg: err.message,
      status: err.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }
}
