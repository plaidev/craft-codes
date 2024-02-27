import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME% >';
const GOOGLEMAPSAPIKEY = '<% GOOGLEMAPSAPIKEY %>';
const FIELD = '<% FIELD %>';
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

async function fetchPrefInfo(latitude, longitude, logger) {
  const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLEMAPSAPIKEY}`;
  try {
    const response = await fetch(geocodingUrl);
    const geocodingResponse = await response.json();
    const cityComponent = geocodingResponse.results[0].address_components.find(component =>
      component.types.includes('administrative_area_level_1')
    );
    const city = cityComponent ? cityComponent.long_name : 'City not found';
    return city;
  } catch (err) {
    logger.error(`[fetchPrefInfo] fetch error: ${err}`);
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

  const city = await fetchPrefInfo(latitude, longitude, logger);
  if (!city) {
    return;
  }
  const values = {};
  values[FIELD] = city;

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: visitorId },
      event: {
        event_name: EVENT_NAME,
        values,
      },
    });
    logger.log(`${EVENT_NAME}Event sent successfully.`);
  } catch (e) {
    logger.error(`send event failed. event_name: ${EVENT_NAME}, error: ${e}`);
  }
}
