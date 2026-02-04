import api from 'api';
import { WebClient } from '@slack/web-api';

const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_MODEL_IDS = '<% TARGET_MODEL_IDS %>';
const DISPLAY_MESSAGE_FIELDS = '<% DISPLAY_MESSAGE_FIELDS %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const CMS_COLLECTION_ID = '<% CMS_COLLECTION_ID %>';
const TARGET_CMS_EVENTS = [
  'cms/content/publish',
  'cms/content/unpublish',
  'cms/content/update',
  'cms/content/create',
  'cms/content/delete',
];

async function fetchCmsContent(modelId, contentId, token, logger) {
  // KARTEのAPIクライアントを初期化
  const cmsClient = api('@dev-karte/v1.0#jj0g1jm98bme78');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentGet({
      modelId,
      contentId,
    });
    return contentResponse.data;
  } catch (error) {
    logger.error(`Error in fetchCmsContent: ${error.message}`);
  }
}

function convertEventTypeToMessage(eventType) {
  switch (eventType) {
    case 'cms/content/publish':
      return { emoji: '📢', action: '公開', color: 'good' };
    case 'cms/content/unpublish':
      return { emoji: '🔒', action: '非公開に', color: 'warning' };
    case 'cms/content/update':
      return { emoji: '✏️', action: '更新', color: 'good' };
    case 'cms/content/create':
      return { emoji: '✨', action: '作成', color: 'good' };
    case 'cms/content/delete':
      return { emoji: '🗑️', action: '削除', color: 'danger' };
    default:
      return { emoji: '📝', action: '', color: 'good' };
  }
}

async function postSlackMessage(channelId, msg, token, logger) {
  // Slack Web APIクライアントの初期化
  const slackClient = new WebClient(token);
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: msg,
    });
  } catch (error) {
    logger.error(`Error sending Slack message: ${error.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET, KARTE_APP_TOKEN_SECRET] });

  // karte hookトリガーであることのバリデーションを行う
  if (data.kind !== 'karte/apiv2-hook') {
    logger.log('Invalid trigger. This function only supports karte/hook trigger.');
    return;
  }

  // イベントタイプを確認
  const eventType = data.jsonPayload.event_type;
  // 対象イベントかどうかを確認
  const supportedEvents = TARGET_CMS_EVENTS;
  if (!supportedEvents.includes(eventType)) {
    logger.debug(`Skipping event: ${eventType} (not a supported CMS event)`);
    return;
  }

  const payloadData = data.jsonPayload.data;
  const modelId = payloadData.sys.modelId;
  if (
    !TARGET_MODEL_IDS.split(',')
      .map(id => id.trim())
      .includes(modelId)
  ) {
    return;
  }

  // 送信メッセージを設定する
  const actionInfo = convertEventTypeToMessage(eventType);
  let msg = `${actionInfo.emoji} CMSコンテンツが${actionInfo.action}されました！\n\n📋 modelId: ${modelId}`;
  if (eventType !== 'cms/content/delete') {
    // CMSコンテンツの情報を抽出
    const contentId = payloadData.id;

    const karteAppToken = secrets[KARTE_APP_TOKEN_SECRET];
    const contentData = await fetchCmsContent(modelId, contentId, karteAppToken, logger);
    logger.debug(`Fetched Content data: ${JSON.stringify(contentData)}`);

    const msgItemsArray = DISPLAY_MESSAGE_FIELDS.split(',')
      .map(item => item.trim());

    msg += msgItemsArray
      .map(item => `\n${item}: ${JSON.stringify(contentData?.[item] ?? '未設定')}`)
      .join('');
  }

  // メッセージにコンテンツ一覧のリンクを埋め込む
  const url = `\n\nhttps://admin.karte.io/cms/${CMS_COLLECTION_ID}?tabId=${modelId}&project=${KARTE_PROJECT_ID}`;
  msg += url;

  const slackToken = secrets[SLACK_TOKEN_SECRET];
  await postSlackMessage(SLACK_CHANNEL_ID, msg, slackToken, logger);
}
