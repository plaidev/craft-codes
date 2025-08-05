import api from 'api';
import crypto from 'crypto';
import { format, subMinutes } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const DELAY_MIN = Number('<% DELAY_MIN %>');
const SOLUTION_ID = '<% SOLUTION_ID %>';
const karteApiClient = api('@dev-karte/v1.0#ja8rb1jlswsjoo1');

function formatTimeWindow(date) {
  return format(date, 'yyyy-MM-dd HH:mm');
}

function getJSTFormattedDate() {
  const currentJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
  const formattedDate = formatTimeWindow(currentJst);
  return formattedDate;
}

function getTimeBefore() {
  const currentJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
  const someMinutesBefore = subMinutes(currentJst, DELAY_MIN);
  const formattedSomeMinutesBefore = formatTimeWindow(someMinutesBefore);
  return formattedSomeMinutesBefore;
}

function generateHashedPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

function kvsKey(time) {
  const recordName = `users_${time}`;
  const solutionId = SOLUTION_ID;
  const hash = generateHashedPrefix(`${solutionId}-${recordName}`);
  return `${hash}-${solutionId}-${recordName}`; // 例: `7aYO2FVx-delayed_event_user-2024-06-28 12:34`
}

async function registerTargetUser(logger, userId, kvs) {
  const currentTime = getJSTFormattedDate();
  const key = kvsKey(currentTime);
  const userIds = [];

  try {
    const result = await kvs.get({ key });
    if (result?.[key]?.value?.uniqueUserIds) {
      const values = result[key].value.uniqueUserIds;
      userIds.push(...values);
    }

    userIds.push(userId);
    const uniqueUserIds = Array.from(new Set(userIds));
    await kvs.write({ key, value: { uniqueUserIds }, minutesToExpire: 10080 });
  } catch (error) {
    logger.error(`Error in registerTargetUser: ${error}`);
  }
}

async function checkMessages(logger, targetIds) {
  const replyAfterRequestUserIds = [];
  const timeUserSentMessage = getTimeBefore();
  const timeUserSentMessageDateJST = new Date(timeUserSentMessage);
  const timeUserSentMessageDateUTC = new Date(
    timeUserSentMessageDateJST.getTime() - 9 * 60 * 60 * 1000
  );
  const now = new Date();

  const promises = targetIds.map(async id => {
    try {
      const talkHistoryResponse = await karteApiClient.postV2TalkMessageGet({
        options: { limit: 10 },
        user_id: id,
      });
      const messages = talkHistoryResponse.data.messages;
      messages.some(message => {
        const messageDate = new Date(message.date);
        if (
          message.account_id === null &&
          messageDate >= timeUserSentMessageDateUTC &&
          messageDate <= now
        ) {
          replyAfterRequestUserIds.push(message.visitor_id);
          return true;
        }
        return false;
      });
    } catch (err) {
      logger.error(`Error fetching messages for user_id ${id}:`, err.message);
      if (err.response && err.response.data) {
        logger.error(`Response data: ${JSON.stringify(err.response.data)}`);
      }
    }
  });

  await Promise.all(promises);
  return replyAfterRequestUserIds;
}

async function autoChatClose(logger, kvs, secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);
  const timeUserSentMessage = getTimeBefore();
  const key = kvsKey(timeUserSentMessage);
  const kvsResponse = await kvs.get({ key });
  const targetIds = kvsResponse[key]?.value?.uniqueUserIds;
  if (!targetIds) {
    return;
  }

  const replyAfterRequestUserIds = await checkMessages(logger, targetIds);

  const filteredChatCloseIds = targetIds.filter(id => !replyAfterRequestUserIds.includes(id));

  if (filteredChatCloseIds.length > 0) {
    const promises = filteredChatCloseIds.map(id =>
      karteApiClient
        .postV2betaTalkStatusChange({ chat_status: 'closed', user_id: id })
        .then(({ data }) => logger.log(data))
        .catch(error => logger.error(`Error in autoChatClose: ${error}`))
    );

    await Promise.all(promises);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const trigger = data.kind;

  if (trigger === 'karte/craft-scheduler') {
    try {
      await autoChatClose(logger, kvs, secret);
      logger.log('autoChatClose 関数が正常に実行されました。');
    } catch (error) {
      logger.error(`autoChatClose 関数の実行中にエラーが発生しました. error: ${error}`);
    }
  } else if (trigger === 'karte/action') {
    const userId = data.jsonPayload.data.user_id;
    if (!userId) {
      logger.error('user_id is undefined or null');
      return;
    }
    try {
      await registerTargetUser(logger, userId, kvs);
      logger.log('registerTargetUser 関数が正常に実行されました。');
    } catch (error) {
      logger.error(`registerTargetUser 関数の実行中にエラーが発生しました. error: ${error}`);
    }
  } else {
    logger.log(`ファンクションのトリガーが不正です. data.kind: ${trigger}`);
  }
}
