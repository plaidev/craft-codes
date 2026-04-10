const LOG_LEVEL = '<% LOG_LEVEL %>';
const CHANNEL_ACCESS_TOKEN_SECRET = '<% CHANNEL_ACCESS_TOKEN_SECRET %>';
const KVS_PREFIX = 'line-push-msg';
const LINE_API_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

async function isDuplicateRequest(requestId, kvs) {
  const key = `${KVS_PREFIX}_${requestId}`;
  const result = await kvs.get({ keys: [key] });

  if (result[key] != null) {
    return true;
  }

  try {
    const unixtimeMs = new Date().getTime();
    await kvs.checkAndWrite({
      key,
      value: { id: requestId },
      operator: '<',
      unixtimeMs,
    });
    return false;
  } catch (e) {
    if (e.status === 409) {
      return true;
    }
    throw e;
  }
}

function formatMessages(message) {
  return [
    {
      type: 'text',
      text: message,
    },
  ];
}

async function sendLineMessage(lineUserId, message, channelAccessToken) {
  const response = await fetch(LINE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: formatMessages(message),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`LINE API error: ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { kvs, secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const requestId = data.id;
  if (!requestId) {
    logger.error('requestId is empty or null. Skipping.', {
      data: data.jsonPayload.data,
    });
    return;
  }
  const isDuplicate = await isDuplicateRequest(requestId, kvs);
  if (isDuplicate) {
    logger.warn('Duplicate request detected. Skipping.', { requestId });
    return;
  }

  const { line_user_id: lineUserId, message } = data.jsonPayload.data ?? {};

  if (!lineUserId) {
    logger.error('line_user_id is empty or null. Skipping.', {
      data: data.jsonPayload.data,
    });
    return;
  }
  if (!message) {
    logger.error('message is empty or null. Skipping.', {
      data: data.jsonPayload.data,
    });
    return;
  }
  let channelAccessToken;
  try {
    const secrets = await secret.get({ keys: [CHANNEL_ACCESS_TOKEN_SECRET] });
    channelAccessToken = secrets[CHANNEL_ACCESS_TOKEN_SECRET];
  } catch (e) {
    logger.error('Failed to get CHANNEL_ACCESS_TOKEN from secret manager.', {
      error: e.message,
    });
    return;
  }

  try {
    await sendLineMessage(lineUserId, message, channelAccessToken);
    logger.info('LINE message sent successfully.');
  } catch (e) {
    logger.error('Failed to send LINE message.', {
      status: e.status,
      body: e.body,
    });
  }
}