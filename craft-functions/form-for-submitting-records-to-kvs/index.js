import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ALLOWED_ORIGIN = '<% ALLOWED_ORIGIN %>';
const DEFAULT_MINUTE_TO_EXPIRE = 60 * 24 * 7; // 1 week
const SHARED_KEY = '<% SHARED_KEY %>';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Generates a key, optionally adding a hash prefix.
 * @param {string} originalKey - The original key.
 * @param {boolean} hashPrefixEnabled - Whether to add a hash prefix.
 * @returns {string} The generated key, with or without a hash prefix.
 */
function generateKey(originalKey, hashPrefixEnabled) {
  if (!hashPrefixEnabled) {
    return originalKey;
  }
  const hashBase64 = crypto.createHash('sha256').update(originalKey).digest('base64');
  const hashPrefix = hashBase64.substring(4, 12);
  return `${hashPrefix}-${originalKey}`;
}

/**
 * Validates the request body.
 * @param {Object} body - The request body to validate.
 * @throws {ValidationError} If validation fails.
 */
function validateRequestBody(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object.');
  }

  if (!Array.isArray(body.items)) {
    throw new ValidationError('The "items" in the request body must be an array.');
  }

  if (body.items.length === 0) {
    throw new ValidationError('The "items" array must not be empty.');
  }

  body.items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new ValidationError(`Item at index ${index} must be an object.`);
    }
    if (typeof item.key !== 'string' || item.key.trim() === '') {
      throw new ValidationError(
        `Item at index ${index} must have a valid "key" property (non-empty string).`
      );
    }
    if (!('value' in item)) {
      throw new ValidationError(`Item at index ${index} must have a "value" property.`);
    }
  });

  if (body.minutesToExpire !== undefined && typeof body.minutesToExpire !== 'number') {
    throw new ValidationError('minutesToExpire must be a number.');
  }

  if (body.hashPrefixEnabled !== undefined && typeof body.hashPrefixEnabled !== 'boolean') {
    throw new ValidationError('hashPrefixEnabled must be a boolean.');
  }
}

/**
 * Writes an item to the KVS.
 * @param {Object} kvs - The KVS module.
 * @param {Object} item - The item to write.
 * @param {number} minutesToExpire - The number of minutes until expiration.
 * @param {boolean} hashPrefixEnabled - Whether to enable hash prefixing.
 * @returns {Promise<string>} A promise that resolves to the written key.
 */
async function writeItemToKVS({ kvs, item, minutesToExpire, hashPrefixEnabled }) {
  const key = generateKey(item.key, hashPrefixEnabled);
  await kvs.write({
    key,
    value: item.value,
    minutesToExpire: minutesToExpire || DEFAULT_MINUTE_TO_EXPIRE,
  });
  return key;
}

/**
 * Validates the authentication header.
 * @param {string} authHeader - The value of the Authorization header.
 * @throws {AuthenticationError} If authentication fails.
 */
function validateAuthHeader(authHeader) {
  if (!authHeader) {
    throw new AuthenticationError('Authentication header is missing');
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw new AuthenticationError('Invalid authentication header format');
  }

  if (token !== SHARED_KEY) {
    throw new AuthenticationError('Invalid token');
  }
}

/**
 * Handles the KVS write operation.
 * @param {Object} data - The request data.
 * @param {Object} data.req - The request object.
 * @param {Object} data.res - The response object.
 * @param {Object} MODULES - The available modules.
 * @param {Function} MODULES.initLogger - Function to initialize the logger.
 * @param {Object} MODULES.kvs - The KVS module for data storage.
 * @returns {Promise<void>}
 */
export default async function (data, { MODULES }) {
  const { initLogger, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    validateAuthHeader(req.headers.authorization);

    validateRequestBody(req.body);
    const { items, minutesToExpire, hashPrefixEnabled } = req.body;

    const writtenKeys = await Promise.all(
      items.map(item => writeItemToKVS({ kvs, item, minutesToExpire, hashPrefixEnabled }))
    );

    res.status(200).json({ message: 'All records were successfully written.', writtenKeys });
  } catch (error) {
    logger.error(error);

    if (error instanceof ValidationError) {
      res.status(400).json({ message: 'Invalid request', error: error.message });
    } else if (error instanceof AuthenticationError) {
      res.status(401).json({ message: 'Authentication error', error: error.message });
    } else {
      res
        .status(500)
        .json({ message: 'An unexpected error occurred', error: 'Internal server error' });
    }
  }
}
