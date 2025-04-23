import { WebClient } from '@slack/web-api';
import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KEY_PREFIX = '<% KEY_PREFIX %>';
const GOOGLE_SERVICE_ACCOUNT_JSON_KEY = '<% GOOGLE_SERVICE_ACCOUNT_JSON_KEY %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const GOOGLE_SHEET_ID = '<% GOOGLE_SHEET_ID %>';
const KVS_DATA_VALIDITY_MINUTE = Number('<% KVS_DATA_VALIDITY_MINUTE %>');

function extractInfoFromMessage(hookData) {
  return {
    accessUrl: hookData.extra?.access_uri?.url,
    text: hookData.data.content?.text,
    userId: hookData.data.user_id,
    visitorId: hookData.data.visitor_id,
    profileName: hookData.data.profile_name,
    eventType: hookData.event_type,
  };
}

async function removeOutdatedKvsData(value, key, kvs) {
  const lastUpdatedAt = value?.[key]?.created_at;
  const kvsDataValidityMilliseconds = KVS_DATA_VALIDITY_MINUTE * 60 * 1000;
  let isOutdated = false;

  // データが存在し、かつ有効期間が過ぎている場合はデータを削除する
  if (
    lastUpdatedAt &&
    new Date(lastUpdatedAt).getTime() < Date.now() - kvsDataValidityMilliseconds
  ) {
    await kvs.delete({ key });
    isOutdated = true;
  }
  return isOutdated;
}

async function getSheetData(secret) {
  const saKeyJson = await secret.get({
    keys: [GOOGLE_SERVICE_ACCOUNT_JSON_KEY],
  });
  const credentials = JSON.parse(saKeyJson[GOOGLE_SERVICE_ACCOUNT_JSON_KEY]);
  const client = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({
    version: 'v4',
    auth: client,
  });
  const sheetsData = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: '1:1001',
  });
  return sheetsData.data.values;
}

async function getSlackClient(secret) {
  const slackToken = await secret.get({
    keys: [SLACK_TOKEN_SECRET],
  });
  const slackClient = new WebClient(slackToken[SLACK_TOKEN_SECRET]);
  return slackClient;
}

async function notifyUserMessageToSlack({ user, text, threadId, accessUrl, secret, slackClient }) {
  const sheetData = await getSheetData(secret);
  const row = sheetData.find(r => accessUrl.startsWith(r[0]));
  if (!row) throw new Error('sheetData is undefined');

  let msg = '';
  msg += `[ユーザーID: ${user}からのメッセージ]\n`;
  msg += `${text}\n`;

  // 初回メッセージの場合はURLとTalk一覧を表示する
  if (!threadId) {
    msg += `[問い合わせが発生したURL]\n${accessUrl}\n`;
    msg += `[Talk一覧はこちら]\nhttps://admin.karte.io/communication/v2/workspace/`;
  }

  const slackChannelId = row[1];
  const params = {
    text: msg,
    channel: slackChannelId,
  };
  if (threadId) params.thread_ts = threadId;
  const data = await slackClient.chat.postMessage(params);
  return data;
}

async function notifyOperatorMessageToSlack({
  profileName,
  text,
  threadId,
  slackClient,
  slackChannelId,
}) {
  let msg = '';
  msg += `[オペレーター ${profileName}からの回答]\n`;
  msg += `${text}`;

  const params = {
    text: msg,
    thread_ts: threadId,
    channel: slackChannelId,
  };
  await slackClient.chat.postMessage(params);
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const hookData = data.jsonPayload;

    const { accessUrl, text, userId, visitorId, profileName, eventType } =
      extractInfoFromMessage(hookData);

    const user = userId || visitorId;

    const key = `${KEY_PREFIX}_${user}`;

    let threadId = '';

    const value = await kvs.get({ key });

    if (value && Object.keys(value).length > 0) {
      threadId = value[key].value.threadId;
    }

    const isOutdated = await removeOutdatedKvsData(value, key, kvs);
    if (isOutdated) {
      threadId = '';
    }

    const slackClient = await getSlackClient(secret);

    if (eventType === 'talk/message/sendFromUser') {
      const slackResponse = await notifyUserMessageToSlack({
        user,
        profileName,
        text,
        threadId,
        accessUrl,
        secret,
        slackClient,
      });

      if (!threadId) {
        threadId = slackResponse.message.ts;
        const slackChannelId = slackResponse.channel;
        await kvs.write({
          key,
          value: {
            threadId,
            slackChannelId,
          },
          minutesToExpire: KVS_DATA_VALIDITY_MINUTE,
        });
      }
    } else if (eventType === 'talk/message/sendFromOperator') {
      if (value && Object.keys(value).length > 0) {
        const slackChannelId = value[key].value.slackChannelId;
        await notifyOperatorMessageToSlack({
          profileName,
          text,
          threadId,
          slackClient,
          slackChannelId,
        });
      }
    } else {
      throw new Error(`Unhandled eventType received: ${eventType}`);
    }
  } catch (error) {
    logger.error('Unexpected error 500:', error);
  }
}
