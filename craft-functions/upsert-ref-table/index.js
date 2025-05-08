import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = '<% RETRY_TIMEOUT_SEC %>';

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload || {};

  if (!isObject(payload)) {
    logger.error('Invalid payload: data.jsonPayload.data is not an object.');
    return;
  }

  const { tableId, rowKey, values } = payload;

  if (!tableId || typeof tableId !== 'string') {
    logger.error('Missing or invalid tableId. It must be a non-empty string.');
    return;
  }

  if (!isObject(rowKey) || Object.keys(rowKey).length === 0) {
    logger.error('Missing or invalid rowKey. Must be a non-empty object.');
    return;
  }

  if (!isObject(values)) {
    logger.error('Missing or invalid values object.');
    return;
  }

  let secrets;
  try {
    secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  } catch (err) {
    throw new RetryableError('[retry] Failed to retrieve secrets.', RETRY_TIMEOUT_SEC);
  }

  const token = secrets[KARTE_APP_TOKEN_SECRET];
  const karteClient = api('@dev-karte/v1.0#emcs633m3nxep4d');
  karteClient.auth(token);

  try {
    await karteClient.postV2betaTrackReftableRowUpsert({
      id: tableId,
      rowKey,
      values,
    });
    logger.debug('Ref table upserted successfully.');
  } catch (err) {
    const msg = `Failed to upsert ref table. caller functionId: ${functionId}, error: ${JSON.stringify(err.data)}, status: ${err.status}.`;

    const isRetryable =
      err.status && ((err.status >= 500 && err.status < 600) || [408, 429].includes(err.status));

    if (isRetryable) {
      throw new RetryableError(`[retry] ${msg}`, RETRY_TIMEOUT_SEC);
    }

    throw new Error(msg);
  }

  logger.debug('Upsert to ref table completed.');
}
