const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>'; // KARTEプロジェクトIDを指定
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>'; // 送信先のチャンネルIDを指定
const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

import { WebClient } from '@slack/web-api';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;  
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { value } = data.jsonPayload.data;

  if (data.kind !== 'karte/jobflow') {
    logger.error(new Error('invalid kind'));
    return;
  }

  const secrets = await secret.get({keys: [ SLACK_TOKEN_SECRET ]});
  const token = secrets[SLACK_TOKEN_SECRET];

  // Slack Web APIクライアントの初期化
  const slackClient = new WebClient(token);

  // chat.postMessageのパラメータを設定
  const splitData = value.split(',');
  const eventname = splitData[0];
  const event_cnt_daybefore = splitData[1];
  const event_cnt_yesterday = splitData[2];
  const event_cnt_rate_of_change = splitData[3];

  let msg = `イベント数の急激な変化をキャッチしました。\n`;
      msg += `イベント名：${eventname}\n`;
      msg += `一昨日のイベント数：${event_cnt_daybefore}\n`;
      msg += `昨日のイベント数：${event_cnt_yesterday}\n`;
      msg += `イベントの増減率：${event_cnt_rate_of_change}%\n`;
      msg += `イベントURL： https://admin.karte.io/p/${KARTE_PROJECT_ID}/event_settings/each/${eventname}`;
  
  // Slack APIのchat.postMessageを使ってメッセージを送信
  await slackClient.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: msg,
  });
}