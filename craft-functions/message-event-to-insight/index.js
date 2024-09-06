import api from 'api';

const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

async function getEventInfo(data) {
  const values = data.jsonPayload.data.value;
  const fileSettings = values.split(',');
  return fileSettings;
}

async function executeEvent({
  client,
  logger,
  eventName,
  userId,
  campaignId,
  pushType,
  campaignName,
}) {
  try {
    await client.postV2TrackEventWrite({
      keys: { user_id: `${userId}` },
      event: {
        values: { campaignId, pushType, campaignName },
        event_name: eventName,
      },
    });
    logger.log('書き込みに成功しました。');
  } catch (error) {
    logger.error(`書き込みに失敗しました。error: ${error.message}`, error.stack);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const [eventName, userId, campaignId, pushType, campaignName] = await getEventInfo(data);
  await executeEvent({
    client: karteApiClient,
    logger,
    eventName,
    userId,
    campaignId,
    pushType,
    campaignName,
  });
}
