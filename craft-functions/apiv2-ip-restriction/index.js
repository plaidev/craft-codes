// curl -X POST 'https://t.karte.io/hook/{{ Craft Endpoint Path }}' \
// -H 'Content-Type: application/json' \
// -d '{
//     "access_token": "{{ API v2 Access Token }}",
//     "request_body": {
//       "keys": {
//         "user_id": "user01"
//       },
//       "event": {
//         "event_name": "test_event",
//         "values": {
//           "key01": "value01"
//         }
//       }
//     }
//   }'

// ログレベルを設定する。デバッグ時は DEBUG に設定する。
const LOG_LEVEL = '<% LOG_LEVEL %>';

// 許可対象のIPを配列形式で設定する
const ALLOWED_IPS = '<% ALLOWED_IPS %>'.split(',').map(v => v.trim());

// api に渡す spec uri
// developers portal のリファレンスから確認する。
// https://developers.karte.io/reference/post_v2-track-event-write
const SPEC_URI = '@dev-karte/v1.0#e00ojitlkrqw8qf';

export default async function (data, { MODULES }) {
  const { initLogger, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  logger.debug(data);

  // validation 
  const { kind, jsonPayload } = data;
  if (kind !== "karte/track-hook") {
    logger.warn("not track-hook");
    return { craft_status_code: 400, message: "invalid request" };
  }

  const { hook_data, plugin_name } = jsonPayload.data;
  if (plugin_name !== "craft") {
    logger.warn("not craft");
    return { craft_status_code: 400, message: "invalid request" };
  }

  const { ip, body } = hook_data;
  if (!ALLOWED_IPS.includes(ip)) {
    logger.warn(`not allowedIP. ip: ${ip}`);
    return { craft_status_code: 401, message: "unauthorized" };
  }
  if (!body) {
    logger.warn(`body is null or undefined`);
    return { craft_status_code: 400, message: "invalid body" };
  }

  const { access_token, request_body } = body;
  if (!access_token || !request_body) {
    logger.warn(`invalid body.`);
    return { craft_status_code: 400, message: "invalid body" };
  }

  // api client を初期化
  const track = karteApiClientForCraftTypeApp({
    token: access_token,
    specUri: SPEC_URI
  });

  // track event write API を実行
  try {
    const res = await track.postV2TrackEventWrite(request_body);
    return res.data
  } catch(err) {
    logger.error(err);
    if (err.status >= 400 && err.status < 500) {
        return { craft_status_code: err.status, message: err.message };
    }
    return { craft_status_code: 500, message: "internal server error" };
  }
}
