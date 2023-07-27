import api from 'api';
const LOG_LEVEL = 'WARN';
const EVENT_NAME = ''; // 送信するイベント名を指定する
const SECRET_NAME = ''; // シークレット名を指定する
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/action') {
    logger.log(`invalid kind ${data.kind}`);
    return;
  }

  const secrets = await secret.get({ keys: [ SECRET_NAME ] });
  const token = secrets[ SECRET_NAME ];
  karteApiClient.auth(token);

  const userId = data.jsonPayload.data.related_user_id; // イベントを送信するユーザーのIDを指定する

  if (!userId) {
    logger.log('User ID not found');
    return;
  }

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { user_id: userId },
      event: {
        event_name: EVENT_NAME,
      },
    });
    logger.log(`Event sent successfully.`);
  } catch (e) {
    logger.error(e);
  }
}