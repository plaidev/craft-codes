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
const LOG_LEVEL = "<% LOG_LEVEL %>";

// 許可対象のIPを配列形式で設定する
const ALLOWED_IPS = "<% ALLOWED_IPS %>".split(",").map((v) => v.trim());

// api に渡す spec uri
// developers portal のリファレンスから確認する。
// https://developers.karte.io/reference/post_v2-track-event-write
const SPEC_URI = "@dev-karte/v1.0#4013y24lvyu582u";

export default async function (data, { MODULES }) {
  const { initLogger, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;
  logger.debug(req);

  const { headers, body } = req;
  const ip = req.ip;

  if (!ALLOWED_IPS.includes(ip)) {
    logger.warn(`not allowedIP. ip: ${ip}`);
    res.status(401).json({ message: "unauthorized" });
    return;
  }
  if (!body) {
    logger.warn(`body is null or undefined`);
    res.status(400).json({ message: "invalid body" });
    return;
  }

  const token = headers.authorization?.split(" ")[1];
  const { request_body: requestBody } = body;
  if (!token || !requestBody) {
    logger.warn(`invalid body.`);
    res.status(400).json({ message: "invalid body" });
    return;
  }

  const track = karteApiClientForCraftTypeApp({
    token,
    specUri: SPEC_URI,
  });

  try {
    const result = await track.postV2TrackEventWrite(requestBody);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    res.status(200).json(result.data);
  } catch (err) {
    logger.error(err);
    if (err.status >= 400 && err.status < 500) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "internal server error" });
    }
  }
}
