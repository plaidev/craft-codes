import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME% >';
const GOOGLEMAPSAPIKEY = '<% GOOGLEMAPSAPIKEY %>';
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

async function fetchpollenfinfo(latitude, longitude, logger) {
  try {
    const res = await fetch(`https://pollen.googleapis.com/v1/forecast:lookup?key=${GOOGLEMAPSAPIKEY}&location.longitude=${longitude}&location.latitude=${latitude}&days=1`, {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`Response not OK: ${res.statusText}`);
    }
    const pollen = await res.json();
    return pollen;
  } catch (err) {
    logger.error('fetchに失敗しました:', err);
    return null;
  }
}


export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  const body = data.jsonPayload.data.hook_data.body;
  karteApiClient.auth(token);
  if (!body) {
    logger.error('bodyの値が存在しません');
    return;
  }

  const visitorId = body.visitor_id;
  if (!visitorId) {
    logger.error('vistorIdが存在しません');
    return;
  }

  const latitude = body.latitude;
  const longitude = body.longitude;
  if (!latitude || !longitude) {
    logger.error('latitudeかlongitudeのいずれかが存在しません');
    return;
  }

  const pollenInfo = await fetchpollenfinfo(latitude, longitude, logger); 
  if (!pollenInfo) {
    return;
  }

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: visitorId },
      event: {
        event_name:EVENT_NAME,
        values: {
          pollen_data: pollenInfo,
        }
      },
    });
    logger.log(EVENT_NAME + 'Event sent successfully.');
  } catch (e) {
    logger.error(EVENT_NAME + 'was not sent successfully.');
  }
}