import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = '<% RETRY_TIMEOUT_SEC %>';
const METHOD = {
  UPSERT: 'upsert',
  DELETE: 'delete',
};

async function upsertRecord({ table, fields, karteClient }) {
  await karteClient.postV2betaActionActiontableRecordsUpsert({
    table,
    data: fields,
  });
}

async function deleteRecords({ table, keys, karteClient }) {
  await karteClient.postV2betaActionActiontableRecordsDelete({
    table,
    keys,
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload;

  if (!(payload instanceof Object)) {
    logger.error(`data.jsonPayload.data is not object.`);
    return;
  }
  const { method, table, fields, keys } = payload;

  logger.debug(`function invoked from functionId: ${functionId}`);

  if (![METHOD.UPSERT, METHOD.DELETE].includes(method)) {
    logger.error(`invalid method name: ${method}`);
    return;
  }
  if (!table) {
    logger.error(`'table' is required.`);
    return;
  }

  let secrets;
  try {
    secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  } catch (err) {
    throw new RetryableError(`[retry] secret.get() failed.`, RETRY_TIMEOUT_SEC);
  }
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const karteClient = api('@dev-karte/v1.0#2ee6y1cm1g4jswa');
  karteClient.auth(token);

  try {
    if (method === METHOD.UPSERT) {
      if (!fields || !(fields instanceof Object)) {
        logger.error(`'fields' does not exist or is not an object.`);
        return;
      }
      await upsertRecord({ table, fields, karteClient });
    } else {
      if (!keys || !Array.isArray(keys)) {
        logger.error(`'keys' does not exist or is not an array.`);
        return;
      }
      await deleteRecords({ table, keys, karteClient });
    }
  } catch (err) {
    const msg = `${method} failed. caller functionId: ${functionId}, table: ${table}, error: ${JSON.stringify(err.data)}, status: ${err.status}.`;
    if (
      err.status &&
      ((err.status >= 500 && err.status < 600) || [408, 429].includes(err.status))
    ) {
      throw new RetryableError(`[retry] ${msg}`, RETRY_TIMEOUT_SEC);
    }
    throw new Error(msg);
  }
  logger.debug(`${method} succeeded. table: ${table}, `);
}
