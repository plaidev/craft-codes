import api from 'api';
import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_APP_USER_ID = '<% SLACK_APP_USER_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_BOT_ID = '<% KARTE_BOT_ID %>';
const IGNORE_TALK_ACCOUNTS = '<% IGNORE_TALK_ACCOUNTS %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';
const KVS_EXPIRE_MINUTES = Number('<% KVS_EXPIRE_MINUTES %>');

const SLACK_KARTE_ACCOUNT_ID_MAP = {
  default: KARTE_BOT_ID,
  // SlackのメンバーID: 'KARTE TalkのオペレーターID' の組を登録すると、対応するオペレーターからの返信としてメッセージを送信できる
  // Uxxxxx: 'xxxxxxxxx',
};

function kvsKeyForUserId(thread) {
  return `${SOLUTION_ID}-slack_threadid_${thread}`;
}
function kvsKeyForThread(userId) {
  return `${SOLUTION_ID}-talk_userid_${userId}`;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

async function sendToSlack(userId, text, { kvs, slack, logger }) {
  const postParam = {
    channel: SLACK_CHANNEL_ID,
    text,
  };
  const threadKey = kvsKeyForThread(userId);
  const v = await kvs.get({ key: threadKey });

  let thread = null;

  if (!isEmpty(v)) {
    thread = v[threadKey].value.thread;
    postParam.thread_ts = thread;
  }
  let result;

  try {
    result = await slack.chat.postMessage(postParam);
    logger.debug(
      `[KARTE to Slack] post succeeded. channel: ${SLACK_CHANNEL_ID}, thread: ${thread}`
    );
  } catch (e) {
    logger.error(`[KARTE to Slack] send slack message error: ${e}`);
  }

  const { message } = result;

  if (thread == null) {
    thread = message.ts;
  }

  await Promise.all([
    kvs.write({ key: threadKey, value: { thread }, minutesToExpire: KVS_EXPIRE_MINUTES }),
    kvs.write({
      key: kvsKeyForUserId(thread),
      value: { userId },
      minutesToExpire: KVS_EXPIRE_MINUTES,
    }),
  ]);
}

// Slack to KARTE
async function handleSlackHook(data, { secret, kvs, logger }) {
  const { req, res } = data;
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const karteAppToken = secrets[KARTE_APP_TOKEN_SECRET];

  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(karteAppToken);

  const { event } = req.body;
  const { text, channel, thread_ts: thread, user: slackUserId } = event;

  if (channel !== SLACK_CHANNEL_ID) {
    res.status(200).send({ message: 'Channel does not match' });
    return;
  }

  if (!thread) {
    res.status(200).send({ message: 'No thread' });
    return;
  }
  if (slackUserId === SLACK_APP_USER_ID) {
    res.status(200).send({ message: 'Ignore Slack Bot message' });
    return;
  }

  const userIdKey = kvsKeyForUserId(thread);
  const v = await kvs.get({ key: userIdKey });
  if (isEmpty(v)) {
    logger.warn(`[Slack to KARTE] cannot find user_id in kvs. thread: ${thread}`);
    res.status(404).send({ message: 'User ID not found in KVS' });
    return;
  }
  const { userId } = v[userIdKey].value;

  let senderId = SLACK_KARTE_ACCOUNT_ID_MAP.default;
  // Slack IDに対応するアカウントIDがあればセットする
  if (SLACK_KARTE_ACCOUNT_ID_MAP[slackUserId]) {
    senderId = SLACK_KARTE_ACCOUNT_ID_MAP[slackUserId];
  }

  const payload = {
    content: { text },
    sender_id: senderId,
    user_id: userId,
  };
  try {
    await talk.postV2TalkMessageSendfromoperator(payload);
    logger.debug(`[Slack to KARTE] succeeded. user_id: ${userId}, sender_id: ${senderId}`);
    res.status(200).send({ message: 'Success' });
  } catch (e) {
    logger.error(`[Slack to KARTE] send talk message error: ${e}`);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

// KARTE to Slack
async function handleTalkHook(data, { secret, kvs, logger }) {
  const { req, res } = data;
  const eventType = req.body.event_type;

  if (!['talk/message/sendFromOperator', 'talk/message/sendFromUser'].includes(eventType)) {
    logger.warn(`invalid event_type: ${eventType}`);
    res.status(400).send({ message: 'Invalid event type' });
    return;
  }

  const d = req.body.data;
  const { content, user_id: userId, visitor_id: visitorId, account_id: accountId } = d;
  const isIgnored = IGNORE_TALK_ACCOUNTS.split(',').some(a => a === accountId);
  if (isIgnored) {
    res.status(200).send({ message: 'Ignored account' });
    return;
  }

  const _userId = userId || visitorId;

  let text;
  if (eventType === 'talk/message/sendFromOperator') {
    text = `[オペレーター ${accountId} が ユーザー ${_userId} に返信] \n ${content.text}`;
  } else {
    text = `[ユーザー ${_userId} からのメッセージ] \n ${content.text}`;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const slackToken = secrets[SLACK_TOKEN_SECRET];
  const slack = new WebClient(slackToken);
  await sendToSlack(_userId, text, { kvs, slack, logger });
  res.status(200).send({ message: 'Success' });
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { secret, kvs, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { kind } = req.body;

  if (kind === 'karte/apiv2-hook') {
    await handleTalkHook(data, { secret, kvs, logger });
  } else if (kind === 'karte/track-hook') {
    await handleSlackHook(data, { secret, kvs, logger });
  } else {
    logger.warn(`invalid trigger. kind: ${kind}`);
    res.status(400).send({ message: 'Invalid trigger' });
  }
}