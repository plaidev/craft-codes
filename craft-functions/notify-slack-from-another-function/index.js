import { WebClient, ErrorCode } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validatePayload(payload, functionId, logger) {
  if (!isObject(payload)) {
    logger.error(`Invalid payload: data is not an object. caller functionId: ${functionId}`);
    return false;
  }

  const {
    channel,
    text,
    blocks,
    thread_ts: threadTs,
    reply_broadcast: replyBroadcast,
    username,
    icon_emoji: iconEmoji,
    icon_url: iconUrl,
    retryTimeoutSec = 3600,
  } = payload;

  if (!channel || typeof channel !== 'string' || channel.trim() === '') {
    logger.error(
      `Missing or invalid channel. It must be a non-empty string. caller functionId: ${functionId}`
    );
    return false;
  }

  if (!text && !blocks) {
    logger.error(`Either text or blocks must be provided. caller functionId: ${functionId}`);
    return false;
  }

  if (text && typeof text !== 'string') {
    logger.error(`Invalid text. It must be a string. caller functionId: ${functionId}`);
    return false;
  }

  if (blocks && !Array.isArray(blocks)) {
    logger.error(`Invalid blocks. It must be an array. caller functionId: ${functionId}`);
    return false;
  }

  if (threadTs !== undefined && typeof threadTs !== 'string') {
    logger.error(`Invalid thread_ts. It must be a string. caller functionId: ${functionId}`);
    return false;
  }

  if (replyBroadcast !== undefined && typeof replyBroadcast !== 'boolean') {
    logger.error(`Invalid reply_broadcast. It must be a boolean. caller functionId: ${functionId}`);
    return false;
  }

  if (username !== undefined && typeof username !== 'string') {
    logger.error(`Invalid username. It must be a string. caller functionId: ${functionId}`);
    return false;
  }

  if (iconEmoji !== undefined && typeof iconEmoji !== 'string') {
    logger.error(`Invalid icon_emoji. It must be a string. caller functionId: ${functionId}`);
    return false;
  }

  if (iconUrl !== undefined && typeof iconUrl !== 'string') {
    logger.error(`Invalid icon_url. It must be a string. caller functionId: ${functionId}`);
    return false;
  }

  if (typeof retryTimeoutSec !== 'number' || retryTimeoutSec <= 0) {
    logger.error(
      `Invalid retryTimeoutSec. It must be a positive number. caller functionId: ${functionId}`
    );
    return false;
  }

  if (replyBroadcast === true && !threadTs) {
    logger.error(
      `Invalid parameters: reply_broadcast is true but thread_ts is not provided. reply_broadcast can only be used with thread replies. caller functionId: ${functionId}`
    );
    return false;
  }

  return true;
}

function throwSuitableError({ msg, error, RetryableError, retryTimeoutSec }) {
  // Slack APIのエラーコードに基づいてリトライ可能かを判定
  let isRetryable = false;

  if (error?.code) {
    switch (error.code) {
      case ErrorCode.RateLimitedError:
        // レート制限エラーは常にリトライ可能
        isRetryable = true;
        break;
      case ErrorCode.RequestError:
        // ネットワークエラー、タイムアウトはリトライ可能
        isRetryable = true;
        break;
      case ErrorCode.HTTPError:
        // HTTPエラーは5xxステータスコードの場合のみリトライ可能
        isRetryable = error.statusCode >= 500 && error.statusCode < 600;
        break;
      case ErrorCode.PlatformError: {
        // Slack APIのビジネスロジックエラー（channel_not_found等）は基本的にリトライ不可
        // ただし、internal_errorやfatal_errorは例外的にリトライ可能
        const platformError = error.data?.error;
        isRetryable = platformError === 'internal_error' || platformError === 'fatal_error';
        break;
      }
      default:
        // その他のエラーコードはリトライ不可
        isRetryable = false;
    }
  } else if (error?.status) {
    // error.codeがない場合はHTTPステータスコードで判定（後方互換性）
    isRetryable = (error.status >= 500 && error.status < 600) || [408, 429].includes(error.status);
  }

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

async function getSlackToken(secret, logger, RetryableError, retryTimeoutSec) {
  try {
    const secrets = await secret.get({
      keys: [SLACK_TOKEN_SECRET],
    });
    return secrets[SLACK_TOKEN_SECRET];
  } catch (error) {
    const msg = `Failed to retrieve Slack token from secret. message: ${error.message}, status: ${error.status}`;
    logger.error(msg);
    throwSuitableError({ msg, error, RetryableError, retryTimeoutSec });
  }
}

async function postMessageToSlack({
  slackClient,
  channel,
  text,
  blocks,
  threadTs,
  replyBroadcast,
  username,
  iconEmoji,
  iconUrl,
  logger,
  RetryableError,
  retryTimeoutSec,
}) {
  try {
    await slackClient.chat.postMessage({
      channel,
      text,
      blocks,
      thread_ts: threadTs,
      reply_broadcast: replyBroadcast,
      username,
      icon_emoji: iconEmoji,
      icon_url: iconUrl,
    });
    logger.log(`Message posted to Slack channel: ${channel}`);
  } catch (error) {
    const msg = `Failed to post message to Slack. channel: ${channel}, error: ${error.message}, slackError: ${error.data?.error || 'unknown'}`;
    logger.error(msg);
    throwSuitableError({ msg, error, RetryableError, retryTimeoutSec });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload || {};

  if (!validatePayload(payload, functionId, logger)) {
    return;
  }

  const {
    channel,
    text,
    blocks,
    thread_ts: threadTs,
    reply_broadcast: replyBroadcast,
    username,
    icon_emoji: iconEmoji,
    icon_url: iconUrl,
    retryTimeoutSec = 3600,
  } = payload;

  const token = await getSlackToken(secret, logger, RetryableError, retryTimeoutSec);
  if (!token) {
    logger.error('Slack token is empty');
    return;
  }

  const slackClient = new WebClient(token);

  await postMessageToSlack({
    slackClient,
    channel,
    text,
    blocks,
    threadTs,
    replyBroadcast,
    username,
    iconEmoji,
    iconUrl,
    logger,
    RetryableError,
    retryTimeoutSec,
  });

  logger.log('Craft Function finished successfully.');
}
