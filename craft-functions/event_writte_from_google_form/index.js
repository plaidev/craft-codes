import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>'; // ログのレベルを定義
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>'; // 作成したシークレットの名前を定義
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const { req, res } = data;
  const eventName = req.body.event_name; // フォームに入力されたイベント名を取得
  const userId = req.body.user_id; // イベントを送信するユーザーのIDを指定する
  const valuesString = req.body.values; // イベントの中で送信したいvaluesを定義
  const values = JSON.parse(valuesString); // イベントの文字列をObjectにParse

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { user_id: userId },
      event: {
        event_name: eventName,
        values,
      },
    });
    logger.log(`Event sent successfully.`);
    res.status(200).send({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).send({ error: e.message });
  }
}