import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_APP_USER_ID = '<% SLACK_APP_USER_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_BOT_ID = '<% KARTE_BOT_ID %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';

const SLACK_KARTE_ACCOUNT_ID_MAP = {
  default: KARTE_BOT_ID,
  // SlackのメンバーID: 'KARTE TalkのオペレーターID' の組を登録すると、対応するオペレーターからの返信としてメッセージを送信できる
  // Uxxxxx: 'xxxxxxxxx',
};

function kvsKeyForUserId(thread) {
  return `${SOLUTION_ID}-slack_threadid_${thread}`;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

async function handleSlackHook(data, { secret, kvs, logger }) {
  const { req, res } = data;
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const karteAppToken = secrets[KARTE_APP_TOKEN_SECRET];

  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(karteAppToken);

  const { event } = req.body;
  const { text, channel, thread_ts: thread, user: slackUserId } = event;

  if (channel !== SLACK_CHANNEL_ID) {
    res.status(400).json({ message: 'Channel does not match' });
    return;
  }

  if (!thread) {
    res.status(400).json({ message: 'No thread' });
    return;
  }
  if (slackUserId === SLACK_APP_USER_ID) {
    res.status(200).json({ message: 'Ignore Slack Bot message' });
    return;
  }

  const userIdKey = kvsKeyForUserId(thread);
  const v = await kvs.get({ key: userIdKey });
  if (isEmpty(v)) {
    logger.warn(`[Slack to KARTE] cannot find user_id in kvs. thread: ${thread}`);
    res.status(404).json({ message: 'User ID not found in KVS' });
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
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    logger.error(`[Slack to KARTE] send talk message error: ${e}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
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

  await handleSlackHook(data, { secret, kvs, logger });
}
