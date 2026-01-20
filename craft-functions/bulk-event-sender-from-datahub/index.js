import api from 'api';

const sdk = api('@dev-karte/v1.0#kjw1z02imccje964');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_THRESHOLD_AGE = 3600;
function parseValue(value) {
  const firstCommaIndex = value.indexOf(',');
  if (firstCommaIndex === -1) {
    throw new Error('Invalid format: userId not found');
  }
  const userId = value.substring(0, firstCommaIndex).trim();
  const remaining = value.substring(firstCommaIndex + 1);
  const secondCommaIndex = remaining.indexOf(',');
  if (secondCommaIndex === -1) {
    throw new Error('Invalid format: eventName not found');
  }
  const eventName = remaining.substring(0, secondCommaIndex).trim();
  const base64EncodedData = remaining.substring(secondCommaIndex + 1).trim();
  const jsonString = Buffer.from(base64EncodedData, 'base64').toString('utf-8');
  const eventData = JSON.parse(jsonString);
  return { userId, eventName, eventData };
}
async function sendEventToKarte(userId, eventName, eventData, logger) {
  const requestPayload = {
    keys: { user_id: userId },
    event: {
      event_name: eventName,
      values: eventData,
    },
  };
  logger.debug('KARTE API request payload:', JSON.stringify(requestPayload, null, 2));
  const result = await sdk.postV2TrackEventWrite(requestPayload);
  return result;
}
export default async function (data, context) {
  const { MODULES } = context;
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  if (data.kind !== 'karte/jobflow') {
    logger.error(`[${data.id}] Invalid kind: ${data.kind}`);
    return {
      success: false,
      reason: 'Invalid kind.',
    };
  }
  const { jsonPayload } = data;
  const value = jsonPayload.data?.value;
  if (!value || typeof value !== 'string') {
    logger.error(`[${data.id}] Invalid value: ${value}`);
    return { success: false, reason: 'Invalid value.' };
  }
  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET],
  });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];
  sdk.auth(appToken);
  let userId;
  let eventName;
  let eventData;
  try {
    const parsed = parseValue(value);
    userId = parsed.userId;
    eventName = parsed.eventName;
    eventData = parsed.eventData;
    logger.debug(`userId: ${userId}, eventName: ${eventName}`);
  } catch (error) {
    logger.error(`[${data.id}] Parse error (no retry):`, error);
    return {
      success: false,
      reason: error.message,
    };
  }
  try {
    const result = await sendEventToKarte(userId, eventName, eventData, logger);
    return {
      success: true,
      result,
    };
  } catch (error) {
    logger.error(`[${data.id}] Error sending event to KARTE:`, error);
    if (error && typeof error === 'object' && typeof error.status === 'number') {
      const statusCode = error.status;
      if ((statusCode >= 500 && statusCode < 600) || [408, 429].includes(statusCode)) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new RetryableError(
          `Failed to send event to KARTE (status: ${statusCode}): ${errorMessage}`,
          RETRY_THRESHOLD_AGE
        );
      }
      return {
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
