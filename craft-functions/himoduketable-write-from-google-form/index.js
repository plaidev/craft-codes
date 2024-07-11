import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>'; // ログのレベルを定義
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>'; // 作成したシークレットの値を定義
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');
const REF_TABLE_ID = '<% REF_TABLE_ID %>'; // 今回更新したい紐付けテーブルIDを登録

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const { req, res } = data;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const userId = req.body.user_id; // 紐付けテーブルの値を更新したいユーザーのuser_idを指定
  const rank = req.body.rank; // 会員の新しいrankを指定
  try {
    await karteApiClient.postV2betaTrackReftableRowUpsert({
      id: REF_TABLE_ID,
      rowKey: { user_id: userId },
      values: { rank },
    });
    logger.log(`${REF_TABLE_ID} is updated`);
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
}