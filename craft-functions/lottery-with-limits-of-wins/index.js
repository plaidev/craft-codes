import crypto from 'crypto';
import api from 'api';

// Constants
const SOLUTION_ID = '<% SOLUTION_ID %>';
const PRIZE_COUNT_EXPIRE_SECONDS = Number('<% PRIZE_COUNT_EXPIRE_SECONDS %>');
const USER_PARTICIPATION_INTERVAL_MINUTES = Number('<% USER_PARTICIPATION_INTERVAL_MINUTES %>');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const PRIZES = '<% PRIZES %>'.split(',').map(v => v.trim());
const LIMITS = '<% LIMITS %>'.split(',').map(v => v.trim());
const LOSE_PROBABILITY = '<% LOSE_PROBABILITY %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

const karteApiClient = api('@dev-karte/v1.0#1bkcoiglscz8c35');

/**
 * Generates a hash prefix from a given key.
 * @param {string} key - The key to generate the hash prefix from.
 * @returns {string} The hash prefix.
 */
function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  return hashBase64.substring(4, 12);
}

/**
 * Generates a kvs key based on the provided parameters.
 * @param {string} lotteryKey - The lucky draw key.
 * @param {string} userId - User ID for which participation status is to be checked.
 * @returns {string} The generated kvs key.
 */
function generateKvsKey(lotteryKey, userId) {
  const recordName = `${lotteryKey}_${userId}`;
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${recordName}`);
  return `${hash}-${solutionId}-${recordName}`;
}

/**
 * Generates a counter key based on the provided parameters.
 * @param {string} lotteryKey - The lucky draw key.
 * @param {string} prize - The prize that the user won.
 * @returns {string} The generated counter key.
 */
function generateCounterKey(lotteryKey, prize) {
  const recordName = `${lotteryKey}_${prize}`;
  return `${SOLUTION_ID}-${recordName}`;
}

/**
 * Increments and fetches the count for a given identifier.
 * @param {object} params - The function parameters.
 * @param {string} params.lotteryKey - The lucky draw key.
 * @param {string} params.prize - The identifier.
 * @param {object} params.counter - The counter object.
 * @param {object} params.logger - The logger object.
 * @returns {Promise<{count: number}>} The count object.
 */
async function incrementAndFetchCount({ lotteryKey, prize, counter, logger }) {
  const key = generateCounterKey(lotteryKey, prize);
  try {
    const count = await counter.increment({
      key,
      secondsToExpire: PRIZE_COUNT_EXPIRE_SECONDS,
    });
    logger.debug(`Increment and fetch count succeeded for key: ${key}, count: ${count}`);
    return { count };
  } catch (err) {
    const errorStr = `Error in incrementAndFetchCount for key: ${key}, error: ${err.toString()}`;
    logger.error(errorStr);
    throw new Error(errorStr);
  }
}

/**
 * Checks if a user has participated recently.
 * @param {object} params - The function parameters.
 * @param {string} params.lotteryKey - The lucky draw key.
 * @param {string} params.userId - The user ID.
 * @param {object} params.kvs - The key-value store object.
 * @param {object} params.logger - The logger object.
 * @returns {Promise<boolean>} Whether the user has participated recently.
 */
async function hasParticipatedRecently({ lotteryKey, userId, kvs, logger }) {
  if (USER_PARTICIPATION_INTERVAL_MINUTES === 0) {
    return false;
  }

  const key = generateKvsKey(lotteryKey, userId);
  try {
    const participation = await kvs.get({ key });
    const lastParticipationTime = participation[key]?.value?.lastParticipationTime;
    if (!lastParticipationTime) {
      return false;
    }
    const currentTime = Date.now();
    return currentTime - lastParticipationTime < USER_PARTICIPATION_INTERVAL_MINUTES * 60 * 1000;
  } catch (err) {
    logger.error(`Error checking participation for key: ${key}, error: ${err.toString()}`);
    return false;
  }
}

/**
 * Sets the user participation time.
 * @param {object} params - The function parameters.
 * @param {string} params.lotteryKey - The lucky draw key.
 * @param {string} params.userId - The user ID.
 * @param {object} params.kvs - The key-value store object.
 * @param {object} params.logger - The logger object.
 * @returns {Promise<void>}
 */
async function setParticipationTime({ lotteryKey, userId, kvs, logger }) {
  if (USER_PARTICIPATION_INTERVAL_MINUTES === 0) {
    return;
  }

  const key = generateKvsKey(lotteryKey, userId);
  try {
    await kvs.write({
      key,
      value: { lastParticipationTime: Date.now() },
      minutesToExpire: USER_PARTICIPATION_INTERVAL_MINUTES,
    });
    logger.debug(`Participation time set successfully for key: ${key}`);
  } catch (err) {
    const errorStr = `Error setting participation time for key: ${key}, error: ${err.toString()}`;
    logger.error(errorStr);
    throw new Error(errorStr);
  }
}

/**
 * Sends a Karte event.
 * @param {object} params - The function parameters.
 * @param {string} params.userId - The user ID.
 * @param {string} params.lotteryKey - The lucky draw key.
 * @param {string} params.prize - The prize.
 * @param {string} params.message - The message.
 * @param {string} params.token - The authentication token.
 * @param {object} params.logger - The logger object.
 * @returns {Promise<void>}
 */
async function sendKarteEvent({ userId, lotteryKey, prize, message, token, logger }) {
  try {
    karteApiClient.auth(token);
    await karteApiClient.postV2TrackEventWrite({
      keys: { user_id: userId },
      event: {
        values: { lotteryKey, prize, message },
        event_name: 'lucky_draws',
      },
    });
    logger.debug(`Karte event sent successfully for user: ${userId}`);
  } catch (err) {
    logger.error(`Error sending Karte event for user: ${userId}, error: ${err.toString()}`);
  }
}

/**
 * Calculates the probabilities for each prize.
 * @param {object} params - The function parameters.
 * @param {string} params.lotteryKey - The lucky draw key.
 * @param {object} params.logger - The logger object.
 * @param {object} params.counter - The counter object.
 * @returns {Promise<number[]>} The probabilities for each prize.
 * @example
 * // If PRIZES = ['prize1', 'prize2', 'prize3'], LIMITS = [10, 20, 30], and LOSE_PROBABILITY = 0.7,
 * // and the current counts for each prize are [5, 15, 25],
 * // then the inventories will be [5, 5, 5] (remaining counts for each prize),
 * // and the probabilities will be [0.1, 0.1, 0.1] (probability of winning each prize).
 * // The remaining probability (0.7) is the probability of not winning any prize.
 */
async function calcProbabilities({ lotteryKey, logger, counter }) {
  const keys = PRIZES.map(prize => generateCounterKey(lotteryKey, prize));
  try {
    const totalWinningCount = await counter.get({ keys });
    const inventories = LIMITS.map((limit, index) => Math.max(0, limit - totalWinningCount[index]));
    const totalInventory = inventories.reduce((prev, curr) => prev + curr, 0);

    const probabilities = inventories.map(inventory =>
      totalInventory > 0 ? (1 - LOSE_PROBABILITY) * (inventory / totalInventory) : 0
    );
    return probabilities;
  } catch (err) {
    const errorStr = `Error calculating probabilities, error: ${err.toString()}`;
    logger.error(errorStr);
    throw new Error(errorStr);
  }
}

/**
 * Determines the prize based on the probabilities.
 * @param {number} rand - The random number.
 * @param {number[]} probabilities - The probabilities for each prize.
 * @returns {{prize: string, index: number} | null} The prize object containing
 *          the prize name and index, or null if no prize is won.
 * @example
 * // If probabilities = [0.1, 0.1, 0.1] and rand = 0.15,
 * // then the cumulative probabilities will be [0.1, 0.2, 0.3],
 * // and the function will return {prize: 'prize2', index: 1} because 0.15 < 0.2.
 * // If rand = 0.35, the function will return null because 0.35 > 0.3 (the total probability of winning any prize).
 */
async function determinePrize(rand, probabilities) {
  let cumulativeProbability = 0;

  for (let i = 0; i < PRIZES.length; i++) {
    cumulativeProbability += probabilities[i];
    if (rand < cumulativeProbability) {
      return { prize: PRIZES[i], index: i };
    }
  }

  return null;
}

/**
 * Main function to handle the lucky draw process.
 * @param {object} data - The input data.
 * @param {object} MODULES - The modules object.
 * @returns {Promise<{craft_status_code: number, result: string} |
 *                   {craft_status_code: number, error: string}>}
 *          The result object containing the status code and either the prize
 *          name or an error message.
 */
export default async function (data, { MODULES }) {
  const { kvs, counter, initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  try {
    logger.debug('Starting the lucky draw process.');

    if (PRIZES.length !== LIMITS.length) {
      const errorMessage = 'PRIZES and LIMITS must have the same length.';
      logger.error(errorMessage);
      return { craft_status_code: 500, error: errorMessage };
    }

    if (data.kind !== 'karte/track-hook') {
      logger.error('Invalid request type. Expected "karte/track-hook".');
      return { craft_status_code: 400, error: 'Invalid request type' };
    }

    const { jsonPayload } = data;
    if (!jsonPayload?.data?.hook_data?.body) {
      logger.error('Invalid payload: Missing required data');
      return { craft_status_code: 400, error: 'Invalid payload' };
    }

    const {
      body: { lotteryKey, userId },
    } = jsonPayload.data.hook_data;
    if (!lotteryKey || !userId) {
      const missingKeyError = `Missing ${!lotteryKey ? 'lotteryKey' : 'userId'}`;
      logger.warn(missingKeyError);
      return {
        craft_status_code: 400,
        error: `${missingKeyError} is required.`,
      };
    }

    const hasParticipated = await hasParticipatedRecently({ lotteryKey, userId, kvs, logger });
    if (hasParticipated) {
      logger.debug(`User ${userId} has participated recently.`);
      return {
        craft_status_code: 400,
        error: 'User has participated recently.',
      };
    }

    const rand = Math.random();
    const probabilities = await calcProbabilities({
      lotteryKey,
      logger,
      counter,
    });
    const prizeResult = await determinePrize(rand, probabilities);

    if (!prizeResult) {
      await sendKarteEvent({
        userId,
        lotteryKey,
        prize: '',
        message: `User ${userId} did not win any prize.`,
        token,
        logger,
      });
      await setParticipationTime({ lotteryKey, userId, kvs, logger });
      logger.debug(`User ${userId} did not win any prize.`);
      return { craft_status_code: 200, result: 'No prize won' };
    }

    const { prize, index } = prizeResult;
    const { count } = await incrementAndFetchCount({
      lotteryKey,
      prize,
      counter,
      logger,
    });

    if (count > LIMITS[index]) {
      await sendKarteEvent({
        userId,
        lotteryKey,
        prize: '',
        message: `Prize ${prize} has reached its limit.`,
        token,
        logger,
      });
      logger.debug(`Prize ${prize} has reached its limit.`);
      return { craft_status_code: 200, result: 'No prize won' };
    }

    await sendKarteEvent({ userId, lotteryKey, prize, message: '', token, logger });
    await setParticipationTime({ lotteryKey, userId, kvs, logger });
    logger.debug(`User ${userId} won prize: ${prize}. ${LIMITS[index] - count} left.`);
    return { craft_status_code: 200, result: prize };
  } catch (error) {
    logger.error(`Error in the lucky draw process: ${error.toString()}`);
    return { craft_status_code: 500, error: `Internal Server Error: ${error.message}` };
  }
}
