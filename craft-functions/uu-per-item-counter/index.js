import { format, subMinutes } from 'date-fns';

const HOW_MANY_MINUTES_AGO = Number('<% HOW_MANY_MINUTES_AGO %>');
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const TIMEWINDOW_FORMAT = 'yyyyMMddHHmm';

function counterKey({ timewindow, itemId }) {
  return `${COUNTER_KEY_PREFIX}_${timewindow}_${itemId}`;
}

/**
 * 「N分前〜」という指定を元に、取得対象のtimewindowの配列を生成して返す
 * @param {string} HOW_MANY_MINUTES_AGO 「何分前」以降のレコードを取得するか？
 * @returns {string[]} 取得対象のtimewindow ('yyyyMMddHHmm') の配列
 */
function makeTargetTimewindows() {
  const targetTimewindows = [];
  const agoArr = [...Array(HOW_MANY_MINUTES_AGO)].map((_, i) => i);
  agoArr.forEach(ago =>
    targetTimewindows.push(format(subMinutes(new Date(), ago), TIMEWINDOW_FORMAT))
  );
  return targetTimewindows;
}

async function getCount({ counter, logger, itemId, targetTimewindows }) {
  const keys = targetTimewindows.map(timewindow => counterKey({ timewindow, itemId }));

  try {
    logger.debug(
      `getCount start. itemId: ${itemId}, targetTimewindows: ${JSON.stringify(targetTimewindows)}`
    );
    const counts = await counter.get({ keys });
    const count = counts.reduce((sum, cnt) => sum + cnt, 0);

    logger.debug(
      `getCount succeeded. itemId: ${itemId}, targetTimewindows: ${JSON.stringify(
        targetTimewindows
      )}`
    );
    return { statusCode: 200, count };
  } catch (err) {
    return { statusCode: 500, error: `getCount error: ${err}` };
  }
}

async function incrementCount({ counter, logger, itemId, currentTimewindow }) {
  try {
    await counter.increment({
      key: counterKey({ timewindow: currentTimewindow, itemId }),
      secondsToExpire: HOW_MANY_MINUTES_AGO * 60 + 60,
    });
    logger.debug(`incrementCount succeeded. timewindow: ${currentTimewindow}. itemId: ${itemId}.`);
  } catch (err) {
    logger.error(
      `incrementCount error. timewindow: ${currentTimewindow}. itemId: ${itemId}. error: ${err.toString()}`
    );
  }
}

function noRequiredParamErr(param) {
  return {
    statusCode: 400,
    error: `"${param}" is required in the request body.`,
  };
}

export default async function (data, { MODULES }) {
  const { counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const body = req.body;
  if (typeof body !== 'object') {
    res.status(400).send({ error: 'Invalid request body.' });
    return;
  }

  const { itemId, skipIncrement, skipGettingCount } = body;
  if (!itemId) {
    const { statusCode, error } = noRequiredParamErr('itemId');
    res.status(statusCode).send({ error });
    return;
  }

  const currentTimewindow = format(new Date(), TIMEWINDOW_FORMAT);
  const targetTimewindows = makeTargetTimewindows(HOW_MANY_MINUTES_AGO);

  logger.debug(`targetTimewindows: ${JSON.stringify(targetTimewindows)}`);

  if (skipIncrement !== true) {
    await incrementCount({ counter, logger, itemId, currentTimewindow });
  }

  if (skipGettingCount === true) {
    res.status(200).send({ count: null, error: null });
    return;
  }

  const { statusCode, count, error } = await getCount({
    counter,
    logger,
    itemId,
    targetTimewindows,
  });
  res.status(statusCode).send({ count, error });
}