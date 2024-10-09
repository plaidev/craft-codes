const KVS_KEY_SUFFIX = '<% KVS_KEY_SUFFIX %>';

// ユーザー毎の接客サービスIDを格納した配列をkvsから取得
async function getNotificationsFromKvs(kvs, userId) {
  const key = `${userId}_${KVS_KEY_SUFFIX}`;
  const obj = await kvs.get({ key });
  return obj[key]?.value.notifications || [];
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

// 表示期限が過ぎていないかバリデーション通した配列を返す関数
function removeExpiredNotifications(notifications) {
  const now = new Date();
  return notifications.filter(notification => {
    const expiredAt = new Date(notification.expired_at);
    return expiredAt > now;
  });
}

// Inboxに通知を表示するために通知取得のリクエストがエンドポイントに送られた時に処理される関数
async function handleGetNotifsEvent(userId, { kvs }) {
  const notifications = await getNotificationsFromKvs(kvs, userId);

  const validatedNotifications = removeExpiredNotifications(notifications);
  if (notifications.length !== validatedNotifications.length) {
    const key = `${userId}_${KVS_KEY_SUFFIX}`;
    await kvs.write({ key, value: { notifications: validatedNotifications } });
  }
  const campaignIds = validatedNotifications.map(notification => notification.campaign_id);
  return campaignIds;
}

// 通知をクリックしたときに処理される関数
async function handleClickedNotifEvent(req, userId, { kvs }) {
  const clickedCampaignId = req.body.clicked_campaign_id;
  if (!clickedCampaignId) {
    return { status: 400, error: 'Invalid request. clicked_campaign_id does not exist' };
  }
  await updateNotificationsOnClick(kvs, userId, clickedCampaignId);
  return {
    status: 200,
    message: `clicked_campaign_id removed successfully. campaign_id: ${clickedCampaignId} `,
  };
}

export default async function (data, { MODULES }) {
  const { kvs } = MODULES;
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Invalid request. POST request only.' });
    return;
  }

  const userId = req.body.user_id;
  if (!userId) {
    res.status(400).json({ error: 'Invalid request. user_id does not exist' });
    return;
  }

  const event = req.body.event;
  if (!['get_notifications', 'clicked_notification'].includes(event)) {
    res.status(400).json({ error: `Invalid request. event: ${event}` });
    return;
  }

  if (event === 'get_notifications') {
    const notifications = await handleGetNotifsEvent(userId, { kvs });
    res.status(200).json(notifications);
  } else if (event === 'clicked_notification') {
    const clickedNotifEventResponse = await handleClickedNotifEvent(req, userId, { kvs });
    res
      .status(clickedNotifEventResponse.status)
      .json({ message: clickedNotifEventResponse.message });
  }
}
