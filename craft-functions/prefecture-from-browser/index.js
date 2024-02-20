import api from "api";

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = "<% KARTE_APP_TOKEN_SECRET %>"; // 作成したシークレットの名前を定義
const GOOGLEMAPSAPIKEY = '<% GOOGLEMAPSAPIKEY %>'; //AIzaSyD5vG02yztqnAsIJELHyJxFRVKf22o4glY
const EVENT_NAME = '<EVENT_NAME>'; //current_pref
const karteApiClient = api("@dev-karte/v1.0#1jvnhd6llgekil84");

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  const body = data.jsonPayload.data.hook_data.body;
  karteApiClient.auth(token);

  try {
    const latitude = body.latitude;
    const longitude = body.longitude;
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLEMAPSAPIKEY}`;
    const response = await fetch(geocodingUrl);

    if (response.ok) {
      const geocodingResponse = await response.json();
      const cityComponent = geocodingResponse.results[0].address_components.find(
        component => component.types.includes('administrative_area_level_1')
      );

      const city = cityComponent ? cityComponent.long_name : 'City not found';
      const vistor_id = body.vistor_id.replace(/"/g, ''); // バックスラッシュを削除

      try {
        await karteApiClient.postV2betaTrackEventWriteandexecaction({
          keys: { visitor_id: 'vis' + '-' + vistor_id },
          event: {
            event_name: EVENT_NAME,
            values: {
              pref: city,
            },
          },
        });
        logger.log(EVENT_NAME + 'Event sent successfully.');
      } catch (e) {
        logger.error(EVENT_NAME + 'was not sent successfully.');
      }
    } else {
      logger.log('Error: Failed to fetch geocoding data');
    }
  } catch (error) {
    logger.log('Error:', error.message);
  }
}