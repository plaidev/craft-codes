import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

async function sendSlackMessage(slackClient, channelId, message, logger) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });

    logger.debug(`Slackの該当チャンネルにメッセージを送信しました： ${channelId}`);
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

  const message = data.jsonPayload.data.slack_text;

  await sendSlackMessage(slackClient, SLACK_CHANNEL_ID, message, logger);
}
