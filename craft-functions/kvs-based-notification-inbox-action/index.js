import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_API_TOKEN_SECRET = '<% KARTE_API_TOKEN_SECRET %>';
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>';
const KVS_KEY_SUFFIX = '<% KVS_KEY_SUFFIX %>';
const NOTIFICATION_EXPIRES_DAYS = '<% NOTIFICATION_EXPIRES_DAYS %>';

const karteApiClient = api('@dev-karte/v1.0#3kd0mlqov5qlf');

// ユーザー毎の接客サービスIDを格納した配列をkvsから取得
async function getNotificationsFromKvs(kvs, userId) {
  const key = `${userId}_${KVS_KEY_SUFFIX}`;
  const obj = await kvs.get({ key });
  return obj[key]?.value.notifications || [];
}

// 接客サービス情報をアクションテーブルにレコード追加
async function upsertRecordToActionTable(logger, tableId, notification) {
  try {
    await karteApiClient.postV2betaActionActiontableRecordsUpsert({
      table: tableId,
      data: notification,
    });
    logger.debug(
      `New notification added to Action Table. campaign_id: ${notification.campaign_id}`
    );
  } catch (error) {
    logger.error(`upsert action table error: ${error}`);
  }
}

// 通知の表示期限を生成
function generateExpiredDate(day) {
  const createdAt = new Date();
  const expiredDate = new Date(createdAt.getTime() + day * 24 * 60 * 60 * 1000);

  return expiredDate;
}

// Craft接客アクションが発生した時に処理される関数
async function handleAddNotificatonReq(data, userId, { secret, kvs, logger }) {
  const secrets = await secret.get({ keys: [KARTE_API_TOKEN_SECRET] });
  const token = secrets[KARTE_API_TOKEN_SECRET];
  karteApiClient.auth(token);

  const d = data.jsonPayload.data;

  const notifInfo = {
    campaign_id: d.campaign_id,
    sender_name: d.sender_name,
    sender_image: d.sender_image,
    title: d.title,
    link_title: d.link_title,
    link_url: d.link_url,
  };

  // 30日を期限に指定してexpireを取得
  const expiredAt = generateExpiredDate(NOTIFICATION_EXPIRES_DAYS);

  const newNotification = {
    campaign_id: d.campaign_id,
    expired_at: expiredAt,
  };

  const notifications = await getNotificationsFromKvs(kvs, userId);
  notifications.push(newNotification);

  const key = `${userId}_${KVS_KEY_SUFFIX}`;
  await kvs.write({ key, value: { notifications } });
  logger.debug("updated user's notifications in kvs");

  await upsertRecordToActionTable(logger, ACTION_TABLE_ID, notifInfo);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/action') {
    logger.warn(`invalid trigger. kind: ${data.kind}, jsonPayload.name: ${data.jsonPayload.name}`);
    return { craft_status_code: 400, error: 'Invalid request type' };
  }

  const userId = data.jsonPayload.data.user_id;
  if (!userId) {
    return { craft_status_code: 400, error: 'Invalid request. user_id does not exist' };
  }

  await handleAddNotificatonReq(data, userId, { secret, kvs, logger });
  return { craft_status_code: 200, message: 'Notification added successfully' };
}
