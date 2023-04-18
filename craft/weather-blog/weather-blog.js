import api from 'api';

export default async function (data, { MODULES }) {
    const { logger, secret } = MODULES;
    const { KARTE_API_TOKEN: token } = await secret.get({ keys: ["KARTE_API_TOKEN"] });
    const insight = api('@dev-karte/v1.0#1jvnhd6llgekil84');
    insight.auth(token);
    const OPEN_WEATHER_API_KEY = '{{OPEN_WEATHER_API_KEY}}'; // OpenWeatherMapのAPIキーを指定する。

    let user_id = data.jsonPayload.data.user_id;
    if (!user_id) {
        user_id = data.jsonPayload.data.visitor_id;
    }

    // 緯度(lat) 経度(lon) をもとに OpenWeatherMap から天気情報を取得する
    const lat = data.jsonPayload.data.latitude;
    const lon = data.jsonPayload.data.longtitude;
    const ret = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_API_KEY}`,
    );
    const ret_json = await ret.json();
    logger.log(ret_json);

    const res = await insight.postV2TrackEventWrite({
        keys: { user_id: user_id },
        event: {
            values: {
                weather: ret_json.list[24].weather[0].main,// 3日後の天気を取得
            },
            event_name: 'weather_information'
        }
    });
    logger.log(await res.json());
}