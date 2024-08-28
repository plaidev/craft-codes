import crypto from 'crypto';
import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_APP_ID = '<% SLACK_APP_ID %>';
const SLACK_APP_MEMBER_ID = '<% SLACK_APP_MEMBER_ID %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const ACCEPT_MESSAGE = '...';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const KVS_EXPIRE_MINUTES = '<% KVS_EXPIRE_MINUTES %>';

async function postToSlack({ slackClient, channel, threadTs, text }) {
  return slackClient.chat.postMessage({
    text,
    channel,
    thread_ts: threadTs,
  });
}

function generateHashedPrefix(key) {
  return crypto.createHash('sha256').update(key).digest('base64').substring(4, 12);
}

function hashUserId(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex');
}

async function upsertData(key, row, kvs, logger, RetryableError) {
  const hash = generateHashedPrefix(key);
  const kvsKey = `${hash}_${key}`;

  try {
    await kvs.write({ key: kvsKey, value: row, minutesToExpire: KVS_EXPIRE_MINUTES });
  } catch (err) {
    logger.warn(`KVSへの書き込みが失敗しました。 key: ${kvsKey}`);
    throw new RetryableError(`KVSへの書き込みが失敗しました。 err: ${err.message}`);
  }
}

function extractUserId(text) {
  const patterns = [/ユーザーID： (\w+) の/, /ユーザーID (\w+) の/];
  const match = patterns.find(pattern => text.match(pattern));
  return match ? text.match(match)[1] : null;
}

function convertNewlinesToBr(text) {
  return text.replace(/\n/g, '<br>');
}

async function sendAcceptMessage(slackClient, channel, threadTs) {
  return postToSlack({
    slackClient,
    text: ACCEPT_MESSAGE,
    channel,
    threadTs,
  });
}

async function processSlackThread(slackClient, channel, threadTs, logger) {
  const replies = await slackClient.conversations.replies({
    channel,
    ts: threadTs,
    limit: 20,
  });

  const initialMessage = replies.messages.find(msg => msg.ts === threadTs);
  if (!initialMessage) {
    logger.warn('スレッド内での最初の返信が見つかりません。');
    return null;
  }

  return { initialMessage, replies };
}

async function saveUserMessage({ initialMessage, replies, kvs, logger, RetryableError }) {
  const initialUserId = extractUserId(initialMessage.text);
  if (!initialUserId) {
    logger.warn('メッセージ内にユーザーIDが見つかりません。:', initialMessage.text);
    throw new Error('メッセージ内にユーザーIDが見つかりません。');
  }

  const hashedUserId = hashUserId(initialUserId);
  const lastMentionedReply = replies.messages.find(
    msg => msg.ts !== initialMessage.ts && msg.text.includes(`<@${SLACK_APP_MEMBER_ID}>`)
  );

  if (!lastMentionedReply) {
    logger.warn('メンション付きの返信が見つかりません。');
    throw new Error('メンション付きの返信が見つかりません。');
  }

  const replyText = lastMentionedReply.text;
  const cleanReplyMessage = convertNewlinesToBr(
    replyText.replace(new RegExp(`<@${SLACK_APP_MEMBER_ID}>?`, 'g'), '').trim()
  );

  await upsertData(
    hashedUserId,
    { user_id: hashedUserId, message: cleanReplyMessage },
    kvs,
    logger,
    RetryableError
  );
}

async function deleteAndConfirmMessage(slackClient, channel, acceptRes, eventTs) {
  await slackClient.chat.delete({
    channel,
    ts: acceptRes.ts,
  });

  await postToSlack({
    slackClient,
    text: 'メッセージを送ったよ💙',
    channel,
    threadTs: eventTs,
  });
}

async function handleSlackRequest({ req, res, kvs, logger, slackClient, RetryableError }) {
  const { event } = req.body;
  const { channel, thread_ts: threadTs, user, event_ts: eventTs } = event;

  if (channel !== SLACK_CHANNEL_ID) {
    res.status(200).send('OK');
    return;
  }

  try {
    const acceptRes = await sendAcceptMessage(slackClient, channel, threadTs);

    if (user === SLACK_APP_ID) {
      res.status(200).send('OK');
      return;
    }

    const { initialMessage, replies } = await processSlackThread(
      slackClient,
      channel,
      threadTs,
      logger
    );
    if (!initialMessage) {
      res.status(400).send('スレッド内での最初の返信が見つかりません。');
      return;
    }

    await saveUserMessage({ initialMessage, replies, kvs, logger, RetryableError });
    await deleteAndConfirmMessage(slackClient, channel, acceptRes, eventTs);

    res.status(200).send('OK');
  } catch (e) {
    await postToSlack({
      slackClient,
      text: `エラーが発生しました。別スレッドなどでもう一度お試しください。 ${e.message}`,
      channel,
      threadTs: eventTs,
    });
    logger.error(e);
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function handleKVSRequest(req, res, kvs, logger) {
  try {
    const userId = req.body.userId.replace(/"/g, '');
    const hashedUserId = hashUserId(userId);
    const key = `${generateHashedPrefix(hashedUserId)}_${hashedUserId}`;
    const kvsData = await kvs.get({ key });
    const message = kvsData[key]?.value?.message || '';

    if (message) {
      await kvs.delete({ key });
    }

    res.status(200).json({ user_id: userId, message });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ user_id: req.body.userId || 'unknown', message: '' });
  }
}

export default async function (data, { MODULES } = {}) {
  const { req, res } = data;
  const { kvs, initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.body && req.body.challenge) {
    res.status(200).send(req.body.challenge);
    return;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token);

  if (req.body && req.body.event && req.body.event.type === 'app_mention') {
    await handleSlackRequest({ req, res, kvs, logger, slackClient, RetryableError });
  } else {
    await handleKVSRequest(req, res, kvs, logger);
  }
}
