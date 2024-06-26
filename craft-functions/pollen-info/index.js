import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME% >';
const GOOGLEMAPSAPIKEY = '<% GOOGLEMAPSAPIKEY %>';
const FIELD = '<% FIELD %>';
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

async function fetchPollenInfo(latitude, longitude, logger) {
  try {
    const pollenInfo = await fetch(
      `https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLEMAPSAPIKEY}&location.longitude=${longitude}&location.latitude=${latitude}&days=1`,
      {
        method: 'GET',
      }
    );
    if (!pollenInfo.ok) {
      throw new Error(`Response not OK: ${pollenInfo.statusText}`);
    }
    const pollen = await pollenInfo.json();
    return pollen;
  } catch (err) {
    logger.error('fetchに失敗しました:', err);
    return null;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const body = data.jsonPayload.data.hook_data.body;
  if (!body) {
    logger.error('bodyが存在しません');
    return;
  }

  const visitorId = body.visitor_id;
  if (!visitorId) {
    logger.error('visitor_idが存在しません');
    return;
  }

  const latitude = body.latitude;
  const longitude = body.longitude;
  if (!latitude || !longitude) {
    logger.error('latitudeかlongitudeのいずれかが存在しません');
    return;
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const pollen = await fetchPollenInfo(latitude, longitude, logger);
  if (!pollen) {
    return;
  }
  const values = {};
  values[FIELD] = pollen;

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: visitorId },
      event: {
        event_name: EVENT_NAME,
        values,
      },
    });
    logger.log(`Event sent successfully. event_name: ${EVENT_NAME}`);
  } catch (e) {
    logger.error(`send event failed. event_name: ${EVENT_NAME}, error: ${e}`);
  }
}
