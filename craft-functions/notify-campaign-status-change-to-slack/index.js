import { WebClient } from '@slack/web-api';

const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>'; // KARTEプロジェクトIDを指定
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>'; // 送信先のチャンネルIDを指定
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.log('Invalid trigger. This function only supports karte/hook trigger.');
    return;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];

  // Slack Web APIクライアントの初期化
  const slackClient = new WebClient(token);

  // chat.postMessageのパラメータを設定
  const title = data.jsonPayload.data.ret.title;
  const campaignId = data.jsonPayload.data.ret.id;
  const status = data.jsonPayload.data.ret.enabled;
  let statusText = '';
  if (status === true) {
    statusText = '公開';
  } else {
    statusText = '非公開';
  }

  let msg = `接客のステータスが変わりました。\n`;
  msg += `接客名：${title}\n`;
  msg += `ステータス：${statusText}\n`;
  msg += `接客URL： https://admin.karte.io/p/${KARTE_PROJECT_ID}/service/${campaignId}`;

  // Slack APIのchat.postMessageを使ってメッセージを送信
  await slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: msg,
  });
}
