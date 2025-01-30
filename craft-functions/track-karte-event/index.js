import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = '<% RETRY_TIMEOUT_SEC %>';

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && typeof v !== 'function';
}

async function trackEvent({ userId, visitorId, eventName, values, karteClient }) {
  const keys = {};
  if (userId) keys.user_id = userId;
  if (visitorId) keys.visitor_id = visitorId;
  await karteClient.postV2TrackEventWrite({
    keys,
    event: {
      event_name: eventName,
      values: isObject(values) ? values : {},
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload;

  if (!isObject(payload)) {
    logger.error(`data.jsonPayload.data is not object.`);
    return;
  }
  const { user_id: userId, visitor_id: visitorId, event_name: eventName, values } = payload;

  logger.debug(`function invoked from functionId: ${functionId}`);

  if (!userId && !visitorId) {
    logger.error(`Either user_id or visitor_id is required.`);
    return;
  }
  if (!eventName) {
    logger.error(`event_name is required.`);
    return;
  }

  let secrets;
  try {
    secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  } catch (err) {
    throw new RetryableError(`[retry] secret.get() failed.`, RETRY_TIMEOUT_SEC);
  }
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const karteClient = api('@dev-karte/v1.0#emcs633m3nxep4d');
  karteClient.auth(token);

  try {
    await trackEvent({ userId, visitorId, eventName, values, karteClient });
  } catch (err) {
    const msg = `trackEvent failed. caller functionId: ${functionId}, event_name: ${eventName}, error: ${JSON.stringify(err.data)}, status: ${err.status}.`;
    if (
      err.status &&
      ((err.status >= 500 && err.status < 600) || [408, 429].includes(err.status))
    ) {
      throw new RetryableError(`[retry] ${msg}`, RETRY_TIMEOUT_SEC);
    }
    throw new Error(msg);
  }
  logger.debug(`Event tracked successfully. event_name: ${eventName}`);
}
