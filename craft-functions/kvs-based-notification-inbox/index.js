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
    logger.debug(`New notification added to Action Table. campaign_id: ${notification.campaign_id}`);
  } catch (error) {
    logger.error(`upsert action table error: ${error}`);
  }
}

// クリック時にkvsの通知ID配列を更新
async function updateNotificationsOnClick(kvs, userId, clickedCampaignId) {
  const notifications = await getNotificationsFromKvs(kvs, userId);
  const filteredNotifications = notifications.filter(
    notification => notification.campaign_id !== clickedCampaignId
  );
  const key = `${userId}_${KVS_KEY_SUFFIX}`;
  await kvs.write({ key, value: { notifications: filteredNotifications } });
}

// 通知の表示期限を生成
function generateExpiredDate(day) {
  const createdAt = new Date();
  const expiredDate = new Date(createdAt.getTime() + day * 24 * 60 * 60 * 1000);

  return expiredDate;
}

// 表示期限が過ぎていないかバリデーション通した配列を返す関数
function removeExpiredNotifications(notifications) {
  const now = new Date();
  return notifications.filter(notification => {
    const expiredAt = new Date(notification.expired_at);
    return expiredAt > now;
  });
}

// Craft接客アクションが発生した時に処理される関数
async function handleAddNotificatonReq(data, userId, { secret, kvs, logger }){
    const secrets = await secret.get({keys: [KARTE_API_TOKEN_SECRET]});
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

// Inboxに通知を表示するために通知取得のリクエストがエンドポイントに送られた時に処理される関数
async function handleGetNotifsEvent(data, userId, {kvs}){
    const notifications = await getNotificationsFromKvs(kvs, userId);

    const validatedNotifications = removeExpiredNotifications(notifications);
    if (notifications.length !== validatedNotifications.length) {
      const key =`${userId}_${KVS_KEY_SUFFIX}`;
      await kvs.write({ key, value: { notifications: validatedNotifications } });
    }
    const campaignIds = validatedNotifications.map(notification => notification.campaign_id);
    return campaignIds;
}

// 通知をクリックしたときに処理される関数
async function handleClickedNotifEvent(data, userId, {kvs}){
    
    const clickedCampaignId = data.jsonPayload.data.hook_data.body.clicked_campaign_id;
    if (!clickedCampaignId) {
      return {craft_status_code: 400, error: 'Invalid request. clicked_campaign_id does not exist'};
    }
    await updateNotificationsOnClick(kvs, userId, clickedCampaignId);
    return {craft_status_code: 200, message: `clicked_campaign_id removed successfully. campaign_id: ${clickedCampaignId} `};
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind === 'karte/action') {
    const userId = data.jsonPayload.data.user_id;
      if (!userId){
      return { craft_status_code: 400, error: 'Invalid request. user_id does not exist' };
    }
    await handleAddNotificatonReq(data, userId, {secret, kvs, logger});
  } else if (data.kind === 'karte/track-hook') {
    const userId = data.jsonPayload.data.hook_data.body.user_id;
    if (!userId) {
      return { craft_status_code: 400, error: 'Invalid request. user_id does not exist' };
    }
    const event = data.jsonPayload.data.hook_data.body.event;
    if (!['get_notifications', 'clicked_notification'].includes(event)){
      return { craft_status_code: 400, error: `Invalid request. event: ${event}` };
    }

    if (event === 'get_notifications'){
      const notifications = await handleGetNotifsEvent(data, userId,  {kvs});
      return notifications;
    } if (event === 'clicked_notification'){
      const clickedNotifEventResponse = await handleClickedNotifEvent(data, userId, {kvs});
      return clickedNotifEventResponse;
    }
  } else {
    logger.warn(`invalid trigger. kind: ${data.kind}, jsonPayload.name: ${data.jsonPayload.name}`);
  }
}
