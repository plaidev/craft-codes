import { WebClient } from '@slack/web-api';

const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

// メールアドレスからSlackユーザーIDを取得する関数
async function getUserIdByEmail(slackClient, email, logger) {
  try {
    const response = await slackClient.users.lookupByEmail({ email });

    const userId = response.user.id;
    logger.debug(`取得したユーザーID: ${userId}`);

    return userId;
  } catch (error) {
    logger.error(`ユーザーID取得エラー: ${error}`);
    throw error;
  }
}

// Slackにメッセージを送信する関数
async function sendSlackMessage(slackClient, channelId, message, logger) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });

    logger.debug(`Message sent to channel ${channelId}`);
  } catch (error) {
    logger.error(`メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];

  const slackClient = new WebClient(token);

  const payloadData = data.jsonPayload.data;
  const slackChannelId = payloadData.slack_channel_id;
  const notificationText = payloadData.notification_text;
  const salesMemberEmail = payloadData.sales_member_email;

  const userId = await getUserIdByEmail(slackClient, salesMemberEmail, logger);

  const message = `<@${userId}>\n\n${notificationText}`;

  await sendSlackMessage(slackClient, slackChannelId, message, logger);
}
