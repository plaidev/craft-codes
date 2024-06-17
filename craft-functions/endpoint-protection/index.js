import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Constants
const LOG_LEVEL = '<% LOG_LEVEL %>';
const JWT_SECRET = '<% JWT_SECRET %>';
const EXPIRE_SEC = parseInt('<% EXPIRE_SEC %>', 10) || 3600;
const SOLUTION_ID = '<% SOLUTION_ID %>';

/**
 * Hashes the password using SHA-256.
 * @param {string} password - The plain text password.
 * @returns {string} The hashed password.
 */
function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

/**
 * Generates a JWT token.
 * @param {object} payload - The payload to include in the token.
 * @param {string} secret - The secret key used to sign the token.
 * @param {string} expiresIn - The expiration time of the token.
 * @returns {string} The generated JWT token.
 */
function generateToken({ payload, secret, expiresIn }) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies the provided JWT token.
 * @param {string} token - The JWT token to verify.
 * @param {string} secret - The secret key used to sign the token.
 * @returns {{authenticated: boolean, error?: string}} The authentication result.
 */
function verifyToken(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    if (Date.now() >= decoded.exp * 1000) {
      return { authenticated: false, error: 'Authentication error: Token expired' };
    }
    return { authenticated: true };
  } catch (error) {
    return { authenticated: false, error: 'Authentication error: Invalid token' };
  }
}

/**
 * Generate a hash prefix to be assigned to the kvs key.
 * @param {string} key - The key without hash prefix
 * @returns {string} - The generated hash prefix.
 */
function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

/**
 * Generate a kvs key.
 * @param {string} username - The username of the user.
 * @returns {string} -  The generated kvs key.
 */
function kvsKey(username) {
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${username}`);
  return `${hash}-${solutionId}-${username}`;
}

/**
 * Authenticates a user.
 * @param {object} params - The function parameters.
 * @param {string} params.username - The username of the user.
 * @param {string} params.password - The password of the user.
 * @param {object} params.kvs - The key-value store object.
 * @param {object} params.logger - The logger object.
 * @param {string} params.secret - The secret key used to sign the token.
 * @returns {{token: string} | {error: string}} The generated token or an error message.
 */
async function signin({ username, password, kvs, logger, secret }) {
  const key = kvsKey(username);
  const v = await kvs.get({ key });

  if (!v[key]) {
    logger.warn(`User ${username} does not exist`);
    return { error: 'Invalid username or password' };
  }
  const user = v[key].value;

  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    logger.warn(`Invalid password for user ${username}`);
    return { error: 'Invalid username or password' };
  }

  const token = generateToken({
    payload: { username, role: user.role },
    secret,
    expiresIn: EXPIRE_SEC,
    logger,
  });
  logger.debug(`User authenticated successfully`);

  return { token };
}

/**
 * Verifies the provided token.
 * @param {object} params - The function parameters.
 * @param {string} params.token - The token to verify.
 * @param {string} params.secret - The secret key used to sign the token.
 * @param {object} params.logger - The logger object.
 * @returns {{authenticated: boolean, error?: string}} The verification result.
 */
function verify({ token, secret, logger }) {
  const result = verifyToken(token, secret);
  if (result.error) {
    logger.warn(`Token verification failed: ${result.error}`);
  }
  return result;
}

/**
 * Main function to handle the authentication process.
 * @param {object} data - The input data.
 * @param {object} MODULES - The modules object.
 * @returns {Promise<{craft_status_code: number, result: object} |
 *                   {craft_status_code: number, error: string}>}
 *          The result object containing the status code and either the authentication
 *          result or an error message.
 */
export default async function (data, { MODULES }) {
  const { initLogger, kvs, secret: craftSecrets } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await craftSecrets.get({ keys: [JWT_SECRET] });
  const secret = secrets[JWT_SECRET];

  try {
    logger.debug('Starting the authentication process');

    const { jsonPayload } = data;
    const { body } = jsonPayload?.data?.hook_data || {};
    const { action, username, password, token } = body || {};

    if (!body || !action) {
      const missingField = !body ? 'request body' : 'action';
      logger.warn(`Missing ${missingField}`);
      return { craft_status_code: 400, error: `Missing ${missingField}` };
    }

    switch (action) {
      case 'signin': {
        if (!username || !password) {
          return { craft_status_code: 400, error: "Missing 'username' or 'password' parameter" };
        }
        if (typeof username !== 'string') {
          return { craft_status_code: 400, error: "Invalid 'username' parameter type" };
        }
        if (typeof password !== 'string') {
          return { craft_status_code: 400, error: "Invalid 'password' parameter type" };
        }
        const { token: generatedToken, error: signinError } = await signin({
          username,
          password,
          kvs,
          logger,
          secret,
        });
        if (signinError) {
          return { craft_status_code: 401, error: signinError };
        }
        return { craft_status_code: 200, result: { token: generatedToken } };
      }

      case 'verify': {
        if (!token) {
          return { craft_status_code: 400, error: "Missing 'token' parameter" };
        }
        const { authenticated, error: verifyError } = verify({ token, secret, logger });
        if (verifyError) {
          return { craft_status_code: 401, error: verifyError };
        }
        return { craft_status_code: 200, result: { authenticated } };
      }

      default:
        return { craft_status_code: 400, error: "Invalid 'action' parameter" };
    }
  } catch (error) {
    logger.error(`Error in authentication process: ${error.toString()}`);
    return { craft_status_code: 500, error: 'Internal Server Error' };
  }
}
