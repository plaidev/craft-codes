import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const REFTABLE_ID = '<% REFTABLE_ID %>';

const karteApiClient = api('@dev-karte/v1.0#4013y24lvyu582u');

async function postReftableRowUpsert(logger, { visitorId, fcmToken }) {
  try {
    await karteApiClient.postV2betaTrackReftableRowUpsert({
      id: REFTABLE_ID,
      rowKey: { user_id: `vis-${visitorId}` },
      values: { fcm_token: fcmToken },
    });
    logger.log(`紐付けテーブルへの書き込みに成功しました。`);
    return { status: 200, message: 'Success' };
  } catch (e) {
    logger.error(`紐付けテーブルへの書き込みに失敗しました。 visitorId ${visitorId}: ${e}`);
    return { status: 500, message: 'Internal Error' };
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { body } = req;
  const { visitorId, fcmToken } = body;

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const postReftableRowUpsertRes = await postReftableRowUpsert(logger, { visitorId, fcmToken });
  const { status, message } = postReftableRowUpsertRes;
  res.status(status).json({ message });
}
