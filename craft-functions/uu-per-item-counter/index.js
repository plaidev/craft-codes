import { format, subMinutes } from 'date-fns';

const HOW_MANY_MINUTES_AGO = Number('<% HOW_MANY_MINUTES_AGO %>'); // 「最大何分前から現在まで」のUU数を集計するか？
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
  const agoArr = [...Array(HOW_MANY_MINUTES_AGO)].map((_, i) => i); // 3 -> [0, 1, 2]
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
      secondsToExpire: HOW_MANY_MINUTES_AGO * 60 + 60, // 参照されえないレコードは自動削除。60秒だけ余裕を持たせておく
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
    craft_status_code: 400,
    error: `"${param}" is required in the request body.`,
  };
}

export default async function (data, { MODULES }) {
  const { counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/track-hook') {
    logger.error(new Error('invalid kind. expected: karte/track-hook'));
    return;
  }

  const body = data.jsonPayload.data.hook_data.body;
  if (typeof body !== 'object') {
    return { craft_status_code: 400, error: 'Invalid request body.' };
  }

  const { itemId, skipIncrement, skipGettingCount } = body;
  if (!itemId) return noRequiredParamErr('itemId');

  const currentTimewindow = format(new Date(), TIMEWINDOW_FORMAT);
  const targetTimewindows = makeTargetTimewindows(HOW_MANY_MINUTES_AGO);

  logger.debug(`targetTimewindows: ${JSON.stringify(targetTimewindows)}`);

  if (skipIncrement !== true) {
    // getだけしたい場合はスキップ
    await incrementCount({ counter, logger, itemId, currentTimewindow });
  }

  if (skipGettingCount === true) {
    // incrementだけしたい場合はスキップ
    return { craft_status_code: 200, count: null, error: null };
  }
  const { statusCode, count, error } = await getCount({
    counter,
    logger,
    itemId,
    targetTimewindows,
  });
  return { craft_status_code: statusCode, count, error };
}
