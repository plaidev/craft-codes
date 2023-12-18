import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>'; // ログのレベルを定義
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>'; // KARTEプロジェクトIDを指定
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>'; // 送信先のチャンネルIDを指定
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;  
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== "karte/apiv2-hook") { 
    logger.log("Invalid trigger. This function only supports karte/hook trigger.");
    return; 
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] }); // SlackアプリのOAuthトークンを登録したCraft Secret Managerの名前を書いておく
  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token); // Slack Web APIクライアントの初期化
  const jobflowName = data.jsonPayload.data.name; // chat.postMessageのパラメータを設定
  const jobflowId = data.jsonPayload.data.id;
  const status = data.jsonPayload.data.status;
 
  if (status !== 'ERROR') { // jobflowがエラーかどうかを検知・エラーだった場合のみ実行
    return;
  }
  let msg = `ジョブフローでエラーが発生しました\n`; // 投稿するmessageの内容を定義
    msg += `ジョブフロー名：${jobflowName}\n`;
    msg += `ジョブフローURL： https://admin.karte.io/datahub/jobflow/each/${jobflowId}?project=${KARTE_PROJECT_ID}`;

  await slackClient.chat.postMessage({ // Slack APIのchat.postMessageを使ってメッセージを送信
    channel: SLACK_CHANNEL_ID,
    text: msg,
  });
}
