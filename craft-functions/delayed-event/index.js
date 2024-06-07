import api from 'api';
import { format, subMinutes } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME %>';
const DELAY_MIN = Number('<% DELAY_MIN %>');
const KVS_KEY_PREFIX = '<% KVS_KEY_PREFIX %>';
const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

function formatTimeWindow(date) {
  return format(date, 'yyyy-MM-dd HH:mm');
}

function getJSTFormattedDate() {
  const currentJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
  const formattedDate = formatTimeWindow(currentJst);
  return formattedDate;
}

function get30minBefore() {
  const currentJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
  const thirtyMinutesAgo = subMinutes(currentJst, DELAY_MIN);
  const thirtyMinBofore = formatTimeWindow(thirtyMinutesAgo);
  return thirtyMinBofore;
}

function generateHashedPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

async function registerTargetVisitor(visitorId, kvs) {
  const currentTime = getJSTFormattedDate();
  const keyInfo = `${KVS_KEY_PREFIX}-${currentTime}`;
  const hash = generateHashedPrefix(keyInfo);
  const key = `${hash}_${keyInfo}`;
  const userIds = [];

  const result = await kvs.get({ key });

  if (!result?.[key]?.value?.uniqueUserIds) {
    return;
  }
  const values = result[key].value.uniqueUserIds;
  userIds.push(...values);
  userIds.push(visitorId);
  const uniqueUserIds = Array.from(new Set(userIds));
  await kvs.write({ key, value: { uniqueUserIds }, minutesToExpire: 10080 });
}

async function sendEventToTargets(logger, kvs, secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);
  const thirtyMinutesAgo = get30minBefore();
  const keyInfo = `${KVS_KEY_PREFIX}-${thirtyMinutesAgo}`;
  const hash = generateHashedPrefix(keyInfo);
  const key = `${hash}_${keyInfo}`;
  const response = await kvs.get({ key });
  const targetIds = response[key].value.uniqueUserIds;
  if (!targetIds) {
    return;
  }

  const promises = targetIds.map(id =>
    karteApiClient
      .postV2betaTrackEventWriteandexecaction({
        keys: { visitor_id: id },
        event: {
          event_name: EVENT_NAME,
        },
      })
      .then(() => {
        logger.debug(`Event sent successfully for id: ${id}`);
      })
      .catch(e => {
        logger.error(`Event sending failed. error: ${e}`);
      })
  );

  await Promise.all(promises);
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const trigger = data.kind;

  if (trigger === 'karte/craft-scheduler') {
    try {
      await sendEventToTargets(logger, kvs, secret);
      logger.log('sendEventToTargets 関数が正常に実行されました。');
    } catch (error) {
      logger.error(`sendEventToTargets 関数の実行中にエラーが発生しました. error: ${error}`);
    }
  } else if (trigger === 'karte/action') {
    const contentData = data.jsonPayload.data;
    const visitorId = contentData.visitor_id;
    if (!visitorId) {
      logger.error('visitor_id is undefined or null');
      return;
    }
    try {
      await registerTargetVisitor(visitorId, kvs);
      logger.log('registerTargetVisitor 関数が正常に実行されました。');
    } catch (error) {
      logger.error(`registerTargetVisitor 関数の実行中にエラーが発生しました. error: ${error}`);
    }
  } else {
    logger.log(`ファンクションのトリガーが不正です. data.kind: ${trigger}`);
  }
}
