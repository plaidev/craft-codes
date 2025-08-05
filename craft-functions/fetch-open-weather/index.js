import api from 'api';

const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const OPEN_WEATHER_API_KEY_SECRET = '<% OPEN_WEATHER_API_KEY_SECRET %>';
const KARTE_EVENT_NAME = '<% KARTE_EVENT_NAME %>';

export default async function (data, { MODULES }) {
  const { logger, secret } = MODULES;

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET, OPEN_WEATHER_API_KEY_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  const openWeatherApiKey = secrets[OPEN_WEATHER_API_KEY_SECRET];

  const insight = api('@dev-karte/v1.0#1jvnhd6llgekil84');
  insight.auth(token);

  const userId = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;

  // 緯度(lat) 経度(lon) をもとに OpenWeatherMap から天気情報を取得する
  const lat = data.jsonPayload.data.latitude;
  const lon = data.jsonPayload.data.longtitude;
  const result = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`
  );
  const resultJson = await result.json();

  const res = await insight.postV2betaTrackEventWriteandexecaction({
    keys: { user_id: userId },
    event: {
      values: {
        weather: resultJson.list[24].weather[0].main, // 3日後の天気を取得
      },
      event_name: KARTE_EVENT_NAME,
    },
  });
  logger.debug(res);
}
