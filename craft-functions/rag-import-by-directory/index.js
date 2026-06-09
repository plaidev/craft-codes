import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = Number('<% RETRY_TIMEOUT_SEC %>');

const CRAFT_API_SPEC_ID = '@dev-karte/v1.0#5yj9jf39mp50ef9q';

async function importByDirectory(siteName, path, corpusId, token, logger) {
  try {
    const craft = api(CRAFT_API_SPEC_ID);
    craft.auth(token);

    await craft.postV2betaCraftRagImportbydirectory({
      siteName,
      path,
      corpusId,
    });

    logger.debug(`RAG import by directory succeeded. path: ${path}`);
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `Failed to import by directory to Craft RAG. path: ${path}, error: ${msg}`;
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
  const splitData = value.split(',');

  if (splitData.length !== 3) {
    logger.error(new Error(`Invalid data format. Expected 3 values but got ${splitData.length}`));
    return;
  }

  try {
    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];

    const SITE_NAME = splitData[0];
    const DIRECTORY_PATH = splitData[1];
    const RAG_CORPUS_ID = splitData[2];

    // パスがスラッシュで始まりスラッシュで終わることを確認
    let normalizedPath = DIRECTORY_PATH;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    if (!normalizedPath.endsWith('/')) {
      normalizedPath = `${normalizedPath}/`;
    }

    await importByDirectory(SITE_NAME, normalizedPath, RAG_CORPUS_ID, token, logger);

    logger.log(`Processing completed successfully. path: ${normalizedPath}`);
  } catch (err) {
    throwSuitableError({
      msg: err.message,
      status: err.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }
}
