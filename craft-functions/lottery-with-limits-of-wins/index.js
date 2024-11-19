import crypto from 'crypto';
import api from 'api';

// Constants
const LOG_LEVEL = 'DEBUG';
const SOLUTION_ID = '<% SOLUTION_ID %>';
const PRIZES = '<% PRIZES %>'.split(',').map(v => v.trim());
const LIMITS = '<% LIMITS %>'.split(',').map(v => v.trim());
const CAMPAIGN_START_DATE = new Date('<% CAMPAIGN_START_DATE %>');
const CAMPAIGN_END_DATE = new Date('<% CAMPAIGN_END_DATE %>');
const MIN_WIN_PROBABILITY = Number('<% MIN_WIN_PROBABILITY %>');
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_CAMPAIGN_ID = '<% KARTE_CAMPAIGN_ID %>';
const PRIZE_COUNT_EXPIRE_SECONDS = Number('<% PRIZE_COUNT_EXPIRE_SECONDS %>');
const USER_PARTICIPATION_INTERVAL_MINUTES = Number('<% USER_PARTICIPATION_INTERVAL_MINUTES %>');

const karteEventClient = api('@dev-karte/v1.0#2ee6yim1g4jq6m');
const karteActionClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');

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
    karteEventClient.auth(token);
    await karteEventClient.postV2TrackEventWrite({
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
 * Calculates the base winning probability based on remaining time and total inventory
 * @param {object} params - The function parameters
 * @param {Array<number>} params.currentCounts - Current inventory counts
 * @param {object} params.logger - Logger object
 * @returns {number} The base winning probability
 */
function calculateBaseWinProbability({ currentCounts, logger }) {
  try {
    const now = new Date();
    const totalCampaignTime = CAMPAIGN_END_DATE - CAMPAIGN_START_DATE;
    const remainingTime = CAMPAIGN_END_DATE - now;
    const timeRatio = Math.max(0, Math.min(1, remainingTime / totalCampaignTime)) * 0.5;

    const totalLimit = LIMITS.reduce((sum, limit) => sum + Number(limit), 0);
    const totalUsed = currentCounts.reduce((sum, count) => sum + (count || 0), 0);
    const inventoryRatio = Math.max(0, (totalLimit - totalUsed) / totalLimit);

    const baseProb = (1 - timeRatio) * inventoryRatio;
    return Math.max(MIN_WIN_PROBABILITY, Math.min(1, baseProb));
  } catch (err) {
    logger.error(`Error calculating base win probability: ${err.toString()}`);
    return MIN_WIN_PROBABILITY;
  }
}

/**
 * Calculates prize-specific probabilities when a win occurs
 * @param {object} params - The function parameters
 * @param {Array<number>} params.currentCounts - Current inventory counts
 * @param {object} params.logger - Logger object
 * @returns {Array<number>} Array of probabilities for each prize
 */
function calculatePrizeProbabilities({ currentCounts, logger }) {
  try {
    const remainingInventories = LIMITS.map((limit, index) =>
      Math.max(0, Number(limit) - (currentCounts[index] || 0))
    );

    logger.debug(`Prize calculation details:`, {
      prizes: PRIZES,
      limits: LIMITS,
      currentCounts,
      remainingInventories,
    });

    const totalRemaining = remainingInventories.reduce((sum, inv) => sum + inv, 0);
    if (totalRemaining === 0) {
      return new Array(PRIZES.length).fill(0);
    }

    return remainingInventories.map(inv => inv / totalRemaining);
  } catch (err) {
    logger.error(`Error calculating prize probabilities: ${err.toString()}`);
    throw err;
  }
}

/**
 * Determines if a prize is won and which prize
 * @param {object} params - The function parameters
 * @param {Array<number>} params.currentCounts - Current inventory counts
 * @param {object} params.logger - Logger object
 * @returns {{prize: string, index: number} | null} The prize result
 */
function determinePrize({ currentCounts, logger }) {
  const winRand = Math.random();
  const baseWinProb = calculateBaseWinProbability({ currentCounts, logger });

  if (winRand > baseWinProb) {
    logger.debug(`No win. Random: ${winRand}, Probability: ${baseWinProb}`);
    return null;
  }

  const prizeRand = Math.random();
  const prizeProbabilities = calculatePrizeProbabilities({ currentCounts, logger });

  let cumulativeProb = 0;
  for (let i = 0; i < PRIZES.length; i++) {
    cumulativeProb += prizeProbabilities[i];
    if (prizeRand < cumulativeProb) {
      return { prize: PRIZES[i], index: i };
    }
  }

  return null;
}

/**
 * Disables the campaign when the last prize is won
 * @param {object} params - The function parameters
 * @param {string} params.token - Authentication token
 * @param {object} params.logger - Logger object
 * @returns {Promise<void>}
 */
async function disableCampaign({ token, logger }) {
  try {
    karteActionClient.auth(token);
    await karteActionClient.postV2betaActionCampaignToggleenabled({
      enabled: false,
      id: KARTE_CAMPAIGN_ID,
    });

    logger.log(`Campaign disabled successfully as last prize was won.`);
  } catch (err) {
    logger.error(`Failed to disable campaign after last prize won: ${err.toString()}`);
  }
}

/**
 * Checks if all prizes have been exhausted
 * @param {object} params - The function parameters
 * @param {Array<number>} params.currentCounts - Current inventory counts
 * @returns {boolean} Returns true if all prizes have been exhausted
 */
function checkAllPrizesExhausted({ currentCounts }) {
  return LIMITS.every((limit, index) => (currentCounts[index] || 0) >= Number(limit));
}

/**
 * Main function to handle the lucky draw process.
 * @param {object} data - The input data.
 * @param {object} MODULES - The modules object.
 * @returns {Promise<{craft_status_code: number, result: string} |
 *                   {craft_status_code: number, error: string}>}
 */
export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { kvs, counter, initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    logger.debug('Starting the lucky draw process.');

    if (PRIZES.length !== LIMITS.length) {
      const errorMessage = 'PRIZES and LIMITS must have the same length.';
      logger.error(errorMessage);
      res.status(500).json({ error: errorMessage });
      return;
    }

    const { body } = req;
    const { lotteryKey, userId } = body;
    if (!lotteryKey || !userId) {
      const missingKeyError = `Missing ${!lotteryKey ? 'lotteryKey' : 'userId'}`;
      logger.warn(missingKeyError);
      res.status(400).json({ error: `${missingKeyError} is required.` });
      return;
    }

    const hasParticipated = await hasParticipatedRecently({ lotteryKey, userId, kvs, logger });
    if (hasParticipated) {
      logger.debug(`User ${userId} has participated recently.`);
      res.status(400).json({ error: 'User has participated recently.' });
      return;
    }

    const keys = PRIZES.map(prize => generateCounterKey(lotteryKey, prize));
    const initialCounts = await counter.get({ keys });

    const prizeResult = determinePrize({
      currentCounts: initialCounts,
      logger,
    });

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
      res.status(200).json({ result: 'No prize won' });
      return;
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
      res.status(200).json({ result: 'No prize won' });
      return;
    }

    const updatedCounts = [...initialCounts];
    updatedCounts[index] = count;
    const allPrizesExhausted = checkAllPrizesExhausted({ currentCounts: updatedCounts });

    if (allPrizesExhausted) {
      await disableCampaign({ token, logger });
      logger.log('Campaign ended as all prizes have been exhausted.');
    }

    await sendKarteEvent({ userId, lotteryKey, prize, message: '', token, logger });
    await setParticipationTime({ lotteryKey, userId, kvs, logger });
    logger.debug(`User ${userId} won prize: ${prize}. ${LIMITS[index] - count} left.`);
    res.status(200).json({ result: prize });
  } catch (error) {
    logger.error(`Error in the lucky draw process: ${error.toString()}`);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
