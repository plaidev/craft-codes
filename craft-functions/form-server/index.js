import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const REFTABLE_ID = '<% REFTABLE_ID %>';
const FORM_FIELDS = '<% FORM_FIELDS %>';

const karteApiClient = api('@dev-karte/v1.0#yeekp16lpj2g7af');

function validateData(req, logger) {
  const { body } = req;
  if (!body) {
    logger.warn(`Body is null or undefined`);
    return { status: 400, message: 'Invalid body' };
  }

  const { visitorId } = body;
  if (!visitorId) {
    logger.warn(`visitorId is null or undefined`);
    return { status: 400, message: `"visitorId" is required in the request body.` };
  }
  return null;
}

async function postReftableRowUpsert(logger, { visitorId, values }) {
  try {
    await karteApiClient.postV2betaTrackReftableRowUpsert({
      id: REFTABLE_ID,
      rowKey: { user_id: `vis-${visitorId}` },
      values,
    });
    logger.log(`Reftable write succeeded.`);
    return { status: 200, message: 'Success' };
  } catch (e) {
    logger.error(`Reftable write error: ${e}`);
    return { status: 500, message: 'Internal Error' };
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { body } = req;
  const { visitorId } = body;

  const validationError = validateData(req, logger);
  if (validationError) {
    const { status, message } = validationError;
    res.status(status).send({ message });
    return;
  }

  const values = {};
  const fields = FORM_FIELDS.split(',');
  fields.forEach(field => {
    values[field] = body[field];
  });

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const postReftableRowUpsertRes = await postReftableRowUpsert(logger, { visitorId, values });
  if (postReftableRowUpsertRes) {
    const { status, message } = postReftableRowUpsertRes;
    res.status(status).send({ message });
  }
}