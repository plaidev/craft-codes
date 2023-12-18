import api from "api";

const LOG_LEVEL = "<% LOG_LEVEL %>"; // ログのレベルを定義
const SECRET_NAME = "<% SECRET_NAME %>"; // 作成したシークレットの名前を定義
const karteApiClient = api("@dev-karte/v1.0#1jvnhd6llgekil84");

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [SECRET_NAME] });
  const token = secrets[SECRET_NAME];
  karteApiClient.auth(token);

  const eventName = data.jsonPayload.data.hook_data.body.event_name; // フォームに入力されたイベント名を取得
  const userId = data.jsonPayload.data.hook_data.body.user_id; // イベントを送信するユーザーのIDを指定する
  const valuesString = data.jsonPayload.data.hook_data.body.values; // イベントの中で送信したいvaluesを定義
  const values = JSON.parse(valuesString); // イベントの文字列をObjectにParse
  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { user_id: userId },
      event: {
        event_name: eventName,
        values,
      },
    });
    logger.log(`Event sent successfully.`);
  } catch (e) {
    logger.error(e);
  }
}
