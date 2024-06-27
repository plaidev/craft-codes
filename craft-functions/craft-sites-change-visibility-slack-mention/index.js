import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const EXCLUDED_SITE_NAMES = '<% EXCLUDED_SITE_NAMES %>'; // 通知対象に含めないサイト名のリスト

function extractSiteData(data) {
  const { ret } = data?.jsonPayload?.data ?? {};
  const { isPublic, path, siteName } = ret;
  return { isPublic, path, siteName };
}

function createSlackMessage(siteName, pagePath, isPublic) {
  return `
  以下のサイトの公開ステータスが変更されました！
  ---------------------------------------------------------
  サイト名：${siteName}
  ページパス：${pagePath}
  変更後の公開ステータス：${isPublic ? '公開中' : '非公開'}
  ---------------------------------------------------------
  `;
}

async function sendSlackMessage(slackClient, channelId, message, logger) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });

    logger.debug(`メッセージをチャンネル ${channelId} に送信しました`);
  } catch (error) {
    logger.error(`メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [SLACK_TOKEN_SECRET],
    });

    const slackToken = secrets[SLACK_TOKEN_SECRET];
    const slackClient = new WebClient(slackToken);

    const { isPublic, path, siteName } = extractSiteData(data);

    const excludedSiteNames = EXCLUDED_SITE_NAMES.split(',').map(name => name.trim());
    if (excludedSiteNames.includes(siteName)) {
      logger.log(`サイト名 ${siteName} は除外対象のため処理をスキップします。`);
      return;
    }

    const message = createSlackMessage(siteName, path, isPublic);

    await sendSlackMessage(slackClient, SLACK_CHANNEL_ID, message, logger);
  } catch (error) {
    logger.error(`エラーが発生しました: ${error.message}`);
    throw error;
  }
}
