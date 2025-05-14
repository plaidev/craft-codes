import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = '<% RETRY_TIMEOUT_SEC %>';

async function sendChatMessage({ userId, content, senderId, karteClient }) {
  await karteClient.postV2TalkMessageSendfromoperator({
    content,
    user_id: userId,
    sender_id: senderId,
  });
}

function validatePayload(payload, logger) {
  if (!payload || typeof payload !== 'object') {
    logger.error('data.jsonPayload.data is not object.');
    return false;
  }

  const { user_id: userId, content, sender_id: senderId } = payload;

  if (!userId) {
    logger.error('user_id is required.');
    return false;
  }

  if (!content || !content.text) {
    logger.error('content.text is required.');
    return false;
  }

  if (!senderId) {
    logger.error('sender_id is required.');
    return false;
  }

  return true;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload;

  logger.debug(`function invoked from functionId: ${functionId}`);

  const isValid = validatePayload(payload, logger);
  if (!isValid) {
    return;
  }

  const { user_id: userId, content, sender_id: senderId } = payload;

  let secrets;
  try {
    secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  } catch (err) {
    throw new RetryableError(`[retry] secret.get() failed.`, RETRY_TIMEOUT_SEC);
  }
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const karteClient = api('@dev-karte/v1.0#4icqh2km1g4jym8');
  karteClient.auth(token);

  try {
    await sendChatMessage({ userId, content, senderId, karteClient });
  } catch (err) {
    const msg = `sendChatMessage failed. caller functionId: ${functionId}, error: ${JSON.stringify(err)}, status: ${err.status}.`;
    if (
      err.status &&
      ((err.status >= 500 && err.status < 600) || [408, 429].includes(err.status))
    ) {
      throw new RetryableError(`[retry] ${msg}`, RETRY_TIMEOUT_SEC);
    }
    throw new Error(msg);
  }

  logger.debug('Chat message sent successfully.');
}
