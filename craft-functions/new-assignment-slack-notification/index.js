import { WebClient } from "@slack/web-api";

const KARTE_PROJECT_ID = "<% KARTE_PROJECT_ID %>"; // KARTEプロジェクトIDを指定
const SLACK_CHANNEL_ID = "<% SLACK_CHANNEL_ID %>"; // 送信先のチャンネルIDを指定
const SLACK_TOKEN_SECRET = "<% SLACK_TOKEN_SECRET %>";
const LOG_LEVEL = "<% LOG_LEVEL %>";

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== "karte/apiv2-hook") {
    logger.log("Invalid trigger. This function only supports karte/hook trigger.");
    return;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];

  // Slack Web APIクライアントの初期化
  const slackClient = new WebClient(token);

  // talk.operator.getのパラメータを設定
  const operatorId = data.jsonPayload.data.operator.id;
  let operatorName = data.jsonPayload.data.operator.profile_name;
  const assignedUser = data.jsonPayload.data.operator.open_assigned_users;

  if (operatorId === "") {
    operatorName = "未担当";
  }

  let msg;
  if (operatorName === "未担当") {
    msg = `KARTE Talkのチャットでアサインが「未担当」になりました。\n`;
    msg += `Talk画面はこちらです。https://admin.karte.io/communication/v2/workspace/?project=${KARTE_PROJECT_ID}`;
  } else {
    msg = `KARTE Talkのチャットでアサインが${operatorName}さんになりました。\n`;
    msg += `${operatorName}さん担当のuser_idは${assignedUser}です。\n`;
    msg += `Talk画面はこちらです。https://admin.karte.io/communication/v2/workspace/?project=${KARTE_PROJECT_ID}`;
  }

  // Slack APIのchat.postMessageを使ってメッセージを送信
  await slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: msg,
  });
}
