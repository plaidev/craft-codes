import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const IGNORE_TALK_ACCOUNTS = '<% IGNORE_TALK_ACCOUNTS %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';
const KVS_EXPIRE_MINUTES = Number('<% KVS_EXPIRE_MINUTES %>');

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

// KARTE to Slack
async function handleTalkHook(data, { secret, kvs, logger }) {
  const eventType = data.jsonPayload.event_type;

  if (!['talk/message/sendFromOperator', 'talk/message/sendFromUser'].includes(eventType)) {
    logger.warn(`invalid event_type: ${eventType}`);
    return;
  }

  const d = data.jsonPayload.data;
  const { content, user_id: userId, visitor_id: visitorId, account_id: accountId } = d;
  const isIgnored = IGNORE_TALK_ACCOUNTS.split(',').some(a => a === accountId);
  if (isIgnored) return;

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
}

export default async function (data, { MODULES }) {
  const { secret, kvs, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind === 'karte/apiv2-hook') {
    await handleTalkHook(data, { secret, kvs, logger });
  } else {
    logger.warn(`invalid trigger. kind: ${data.kind}`);
  }
}
