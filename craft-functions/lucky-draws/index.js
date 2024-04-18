import crypto from "crypto";
import api from "api";

// Constants
const PRIZE_COUNT_PREFIX = "<% PRIZE_COUNT_PREFIX %>";
const PRIZE_COUNT_EXPIRE_SECONDS = Number("<% PRIZE_COUNT_EXPIRE_SECONDS %>");
const USER_PARTICIPATION_PREFIX = "<% USER_PARTICIPATION_PREFIX %>";
const USER_PARTICIPATION_EXPIRE_SECONDS = Number(
  "<% USER_PARTICIPATION_EXPIRE_SECONDS %>"
);
const APPEND_HASH_PREFIX = "<% APPEND_HASH_PREFIX %>" === "true";
const PRIZES = JSON.parse("<% PRIZES %>");
const PROBABILITIES = JSON.parse("<% PROBABILITIES %>");
const LIMITS = JSON.parse("<% LIMITS %>");

const karteApiClient = api("@dev-karte/v1.0#1bkcoiglscz8c35");

/**
 * Generates a hashed prefix from a given key.
 * @param {string} key - The key to generate the hashed prefix from.
 * @returns {string} The hashed prefix.
 */
const generateHashedPrefix = (key) => {
  const hashBase64 = crypto.createHash("sha256").update(key).digest("base64");
  return hashBase64.substring(4, 12);
};

/**
 * Generates a storage key based on the provided parameters.
 * @param {string} prefix - The prefix of the key.
 * @param {string} luckyDrawKey - The lucky draw key.
 * @param {string} identifier - The identifier.
 * @returns {string} The generated storage key.
 */
const generateKey = (prefix, luckyDrawKey, identifier) => {
  let key = `${prefix}_${luckyDrawKey}_${identifier}`;
  if (APPEND_HASH_PREFIX) {
    const hashPrefix = generateHashedPrefix(key);
    key = `${hashPrefix}_${key}`;
  }
  return key;
};

/**
 * Increments and fetches the count for a given identifier.
 * @param {string} prefix - The prefix of the key.
 * @param {string} luckyDrawKey - The lucky draw key.
 * @param {string} identifier - The identifier.
 * @param {object} counter - The counter object.
 * @param {object} logger - The logger object.
 * @param {function} RetryableError - The RetryableError constructor.
 * @returns {Promise<{count: number}>} The count object.
 */
const incrementAndFetchCount = async (
  prefix,
  luckyDrawKey,
  identifier,
  counter,
  logger,
  RetryableError
) => {
  const key = generateKey(prefix, luckyDrawKey, identifier);
  try {
    const count = await counter.increment({
      key,
      secondsToExpire: PRIZE_COUNT_EXPIRE_SECONDS,
    });
    logger.debug(
      `Increment and fetch count succeeded for key: ${key}, count: ${count}`
    );
    return { count };
  } catch (err) {
    const errorStr = `Error in incrementAndFetchCount for key: ${key}, error: ${err.toString()}`;
    logger.error(errorStr);
    throw new RetryableError(errorStr);
  }
};

/**
 * Checks if a user has participated today.
 * @param {string} luckyDrawKey - The lucky draw key.
 * @param {string} userId - The user ID.
 * @param {object} kvs - The key-value store object.
 * @param {object} logger - The logger object.
 * @returns {Promise<boolean>} Whether the user has participated today.
 */
const hasParticipatedToday = async (luckyDrawKey, userId, kvs, logger) => {
  const today = new Date().toISOString().slice(0, 10);
  const key = generateKey(
    USER_PARTICIPATION_PREFIX,
    `${luckyDrawKey}_${today}`,
    userId
  );
  try {
    const participation = await kvs.get({ key });
    logger.debug(`Participation check succeeded for key: ${key}`);
    return !!participation[key]?.value?.hasParticipatedToday;
  } catch (err) {
    logger.error(
      `Error or participation not found for key: ${key}, error: ${err.toString()}`
    );
    return false;
  }
};

/**
 * Sets the user participation for today.
 * @param {string} luckyDrawKey - The lucky draw key.
 * @param {string} userId - The user ID.
 * @param {object} kvs - The key-value store object.
 * @param {object} logger - The logger object.
 * @param {function} RetryableError - The RetryableError constructor.
 * @returns {Promise<void>}
 */
const setParticipationToday = async (
  luckyDrawKey,
  userId,
  kvs,
  logger,
  RetryableError
) => {
  const today = new Date().toISOString().slice(0, 10);
  const key = generateKey(
    USER_PARTICIPATION_PREFIX,
    `${luckyDrawKey}_${today}`,
    userId
  );
  try {
    await kvs.write({
      key,
      value: { hasParticipatedToday: true },
      secondsToExpire: USER_PARTICIPATION_EXPIRE_SECONDS,
    });
    logger.debug(`Participation set for today succeeded for key: ${key}`);
  } catch (err) {
    const errorStr = `Error setting participation for today for key: ${key}, error: ${err.toString()}`;
    logger.error(errorStr);
    throw new RetryableError(errorStr);
  }
};

/**
 * Sends a Karte event.
 * @param {string} userId - The user ID.
 * @param {string} luckyDrawKey - The lucky draw key.
 * @param {string} prize - The prize.
 * @param {string} token - The authentication token.
 * @param {object} logger - The logger object.
 * @returns {Promise<void>}
 */
const sendKarteEvent = async (userId, luckyDrawKey, prize, token, logger) => {
  try {
    karteApiClient.auth(token);
    await karteApiClient.postV2TrackEventWrite({
      keys: { user_id: userId },
      event: {
        values: { luckyDrawKey, won: prize },
        event_name: "lucky_draws",
      },
    });
    logger.log(`Event sent successfully.`);
  } catch (err) {
    logger.error(`Error sending Karte event: ${err.toString()}`);
  }
};

/**
 * Determines the prize based on the probabilities.
 * @param {number} rand - The random number.
 * @returns {{prize: string, index: number} | null} The prize object or null if no prize is won.
 */
const determinePrize = (rand) => {
  let cumulativeProbability = 0;

  for (let i = 0; i < PRIZES.length; i++) {
    cumulativeProbability += PROBABILITIES[i];
    if (rand < cumulativeProbability) {
      return { prize: PRIZES[i], index: i };
    }
  }

  return null;
};

/**
 * Main function to handle the lucky draw process.
 * @param {object} data - The input data.
 * @param {object} MODULES - The modules object.
 * @returns {Promise<{craft_status_code: number, result: string} | {craft_status_code: number, error: string}>}
 */
export default async (data, { MODULES }) => {
  const { kvs, counter, initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: "<% LOG_LEVEL %>" });
  const secrets = await secret.get({ keys: ["KARTE_API_TOKEN_LUCKYDRAWS"] });
  const token = secrets["KARTE_API_TOKEN_LUCKYDRAWS"];

  try {
    logger.log("Starting the lucky draw process.");

    if (data.kind !== "karte/track-hook") {
      logger.error('Invalid request type. Expected "karte/track-hook".');
      return { craft_status_code: 400, error: "Invalid request type" };
    }

    const { jsonPayload } = data;
    if (!jsonPayload?.data?.hook_data?.body) {
      logger.error("Invalid payload: Missing required data");
      return { craft_status_code: 400, error: "Invalid payload" };
    }

    const {
      body: { luckyDrawKey, userId },
    } = jsonPayload.data.hook_data;
    if (!luckyDrawKey || !userId) {
      const missingKeyError = `Missing ${
        !luckyDrawKey ? "luckyDrawKey" : "userId"
      }`;
      logger.warn(missingKeyError);
      return {
        craft_status_code: 400,
        error: `${missingKeyError} is required.`,
      };
    }

    const hasParticipated = await hasParticipatedToday(
      luckyDrawKey,
      userId,
      kvs,
      logger
    );
    if (hasParticipated) {
      logger.log(`User ${userId} has already participated today.`);
      return {
        craft_status_code: 400,
        error: "User has already participated today.",
      };
    }

    const rand = Math.random();
    const prizeResult = determinePrize(rand);

    if (prizeResult) {
      const { prize, index } = prizeResult;
      const { count, error } = await incrementAndFetchCount(
        PRIZE_COUNT_PREFIX,
        luckyDrawKey,
        prize,
        counter,
        logger,
        RetryableError
      );

      if (error) {
        return {
          craft_status_code: 500,
          error: `Error incrementing prize count: ${error}`,
        };
      }

      if (count <= LIMITS[index]) {
        await sendKarteEvent(userId, luckyDrawKey, prize, token, logger);
        await setParticipationToday(
          luckyDrawKey,
          userId,
          kvs,
          logger,
          RetryableError
        );
        logger.log(
          `User ${userId} won prize: ${prize}. ${LIMITS[index] - count} left.`
        );
        return { craft_status_code: 200, result: prize };
      } else {
        await sendKarteEvent(
          userId,
          luckyDrawKey,
          `Prize ${prize} has reached its limit.`,
          token,
          logger
        );
        logger.log(`Prize ${prize} has reached its limit.`);
        return { craft_status_code: 200, result: "No prize won" };
      }
    } else {
      await sendKarteEvent(
        userId,
        luckyDrawKey,
        `User ${userId} did not win any prize.`,
        token,
        logger
      );
      await setParticipationToday(
        luckyDrawKey,
        userId,
        kvs,
        logger,
        RetryableError
      );
      logger.log(`User ${userId} did not win any prize.`);
      return { craft_status_code: 200, result: "No prize won" };
    }
  } catch (error) {
    logger.error(`Error in the lucky draw process: ${error.toString()}`);
    return { craft_status_code: 500, error: "Internal Server Error" };
  }
};
