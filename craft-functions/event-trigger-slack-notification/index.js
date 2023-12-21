import { WebClient } from '@slack/web-api';

const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% DEBUG %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // KARTEからのデータを元に、通知メッセージを取得
  const slackChannelId = data.jsonPayload.data.slack_channel_id; // 通知先のSlackチャンネルID
  const notificationText = data.jsonPayload.data.notification_text; // 通知文面

  // Slackトークンの取得
  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];

  // Slack Web APIクライアントの初期化
  const slackClient = new WebClient(token);

  // Slack APIのchat.postMessageを使ってメッセージを送信
  await slackClient.chat.postMessage({
    channel: slackChannelId, // JSONオブジェクトから取得したチャンネルIDを使用
    text: notificationText, // JSONオブジェクトから取得した通知文面を使用
  });

  // 成功した場合のログ
  logger.log(`Message sent to channel ${slackChannelId}`);
}
