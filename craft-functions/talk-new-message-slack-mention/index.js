import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.log('Invalid trigger. This function only supports karte/hook trigger.');
    return;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token);

  // talk.message.getのパラメータを設定
  const userId = data.jsonPayload.data.user_id;
  const contentText = data.jsonPayload.data.content.text;
  const accessUrl = data.jsonPayload.extra.access_uri.url;

  let msg = '';
  msg += `新規チャット問い合わせが来ました！\n`;
  msg += `問い合わせをしたユーザーのID：${userId}\n`;
  msg += `問い合わせ内容：${contentText}\n`;
  msg += `問い合わせが発生したURL：${accessUrl}\n`;
  msg += `Talk一覧はこちら：https://admin.karte.io/communication/v2/workspace/`;

  // Slack APIのchat.postMessageを使ってメッセージを送信
  await slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: msg,
  });
}
