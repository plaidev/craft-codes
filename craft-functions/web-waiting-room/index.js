import { format, addMinutes, parse } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const COUNTER_EXPIRE_SECONDS = Number('<% COUNTER_EXPIRE_SECONDS %>');
const KVS_EXPIRE_MINUTES = Number('<% KVS_EXPIRE_MINUTES %>');
const CAPACITY = Number('<% CAPACITY %>');
const SOLUTION_ID = '<% SOLUTION_ID %>';

function kvsKey() {
  const RECORD_NAME = 'target_timewindow';
  return `${SOLUTION_ID}-${RECORD_NAME}`;
}
function counterKey(timeWindow) {
  return `${SOLUTION_ID}-${timeWindow}`;
}

function formatTimeWindow(date) {
  return format(date, 'yyyy-MM-dd_HH:mm');
}
function parseTimeWindow(timeWindow) {
  return parse(timeWindow, 'yyyy-MM-dd_HH:mm', new Date());
}

async function fetchTargetTimeWindow({ logger, kvs }) {
  try {
    const key = kvsKey();
    const r = await kvs.get({ key });
    return r?.[key]?.value?.targetTimeWindow;
  } catch (e) {
    logger.error(`[fetchTargetTimeWindow] error: ${e}`);
  }
}

async function incrementCounter({ logger, counter, timeWindow }) {
  try {
    const c = await counter.increment({
      key: counterKey(timeWindow),
      secondsToExpire: COUNTER_EXPIRE_SECONDS,
    });
    logger.debug(`[incrementCounter] succeeded. timeWindow: ${timeWindow}. count: ${c}`);
  } catch (e) {
    logger.error(`[incrementCounter] error: ${e}`);
  }
}

async function updateKvsTimeWindow({ logger, kvs, timeWindow }) {
  try {
    const key = kvsKey();
    await kvs.write({
      key,
      value: {
        targetTimeWindow: timeWindow,
      },
      minutesToExpire: KVS_EXPIRE_MINUTES,
    });
    logger.log(`[updateKvsTimeWindow] succeeded. new timeWindow: ${timeWindow}`);
  } catch (e) {
    logger.error(`[updateKvsTimeWindow] error: ${e}`);
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { kvs, counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // JSTで、現在の時:分の始まる時刻を取得
  const currentJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
  const currentTimeWindow = formatTimeWindow(currentJst);

  // kvsから、いま割り振っている時間枠を取得
  const targetTimeWindow = await fetchTargetTimeWindow({ logger, kvs });

  // 初回アクセス -> 通過させる
  if (!targetTimeWindow) {
    await updateKvsTimeWindow({ logger, kvs, timeWindow: currentTimeWindow });
    await incrementCounter({ logger, counter, timeWindow: currentTimeWindow });
    res.status(200).send({ isThrough: true, timeWindow: currentTimeWindow });
    return;
  }

  const targetJst = parseTimeWindow(targetTimeWindow);
  const isTargetPast = targetTimeWindow < currentTimeWindow;

  logger.debug(
    `currentTimeWindow: ${currentTimeWindow}, targetTimeWindow: ${targetTimeWindow}, isTargetPast: ${isTargetPast}`
  );

  // kvs上のtargetWindowが過去日 -> 通過させる
  if (isTargetPast) {
    await updateKvsTimeWindow({ logger, kvs, timeWindow: currentTimeWindow });
    await incrementCounter({ logger, counter, timeWindow: currentTimeWindow });
    res.status(200).send({ isThrough: true, timeWindow: currentTimeWindow });
    return;
  }

  const nOfPeople = await counter.get({ keys: [counterKey(targetTimeWindow)] });

  // 対象の時間枠に空きがある -> 対象の時間枠を返して待たせる
  if (nOfPeople < CAPACITY) {
    await incrementCounter({ logger, counter, timeWindow: targetTimeWindow });
    res.status(200).send({ isThrough: false, timeWindow: targetTimeWindow });
    return;
  }

  // 対象の時間枠に空きがない -> 対象の次の時間枠を返して待たせる
  if (nOfPeople >= CAPACITY) {
    const nextTimeWindow = formatTimeWindow(addMinutes(targetJst, 1));
    await updateKvsTimeWindow({ logger, kvs, timeWindow: nextTimeWindow });
    await incrementCounter({ logger, counter, timeWindow: nextTimeWindow });
    res.status(200).send({ isThrough: false, timeWindow: nextTimeWindow });
  }
}