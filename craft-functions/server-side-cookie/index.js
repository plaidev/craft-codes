const LOG_LEVEL = '<% LOG_LEVEL %>';
const COOKIE_NAME = '<% COOKIE_NAME %>';
const DOMAIN = '<% DOMAIN %>';

/** Cookie configuration */
const COOKIE_CONFIG = {
  name: COOKIE_NAME,
  domain: DOMAIN,
  sameSite: 'None',
  secure: true,
  httpOnly: false,
  expiryYears: 50,
};

/**
 * Generates a new external ID
 * @returns {string} Generated external ID
 */
function generateExternalId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Calculates cookie expiry date
 * @returns {Date} Expiry date
 */
function getExpiryDate() {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + COOKIE_CONFIG.expiryYears);
  return expiryDate;
}

/**
 * Creates cookie header string
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @returns {string} Formatted cookie header string
 */
function createCookieHeader(name, value) {
  const expires = getExpiryDate().toUTCString();
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Expires=${expires}`,
    'Path=/',
    `Domain=${COOKIE_CONFIG.domain}`,
    `SameSite=${COOKIE_CONFIG.sameSite}`,
  ];

  if (COOKIE_CONFIG.secure) parts.push('Secure');
  if (COOKIE_CONFIG.httpOnly) parts.push('HttpOnly');

  return parts.join('; ');
}

/**
 * Sets CORS headers on the response
 * @param {Object} res - Response object
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Parses cookie string into an object
 * @param {string} cookieHeader - Cookie header string
 * @returns {Object} Parsed cookies as key-value pairs
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  try {
    return cookieHeader.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
  } catch {
    return {};
  }
}

/**
 * Resolves external ID from cookies or generates a new one
 * @param {Object} cookies - Parsed cookies object
 * @param {Object} logger - Logger instance
 * @returns {string} External ID
 */
function resolveExternalId(cookies, logger) {
  let externalId = cookies[COOKIE_CONFIG.name];

  if (!externalId) {
    externalId = generateExternalId();
    logger.debug('Generated new external ID:', externalId);
  } else {
    logger.debug('Using existing external ID:', externalId);
  }

  return externalId;
}

/**
 * Request handler for external ID management
 * @param {Object} data - Contains request and response objects
 * @param {Object} data.req - Request object
 * @param {Object} data.res - Response object
 * @param {Object} context - Context containing available modules
 * @param {Object} context.MODULES - Available modules
 * @returns {Promise<Object>} Response object
 */
export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        status: 'error',
        message: 'Method Not Allowed',
      });
    }

    const cookies = parseCookies(req.headers.cookie);
    const externalId = resolveExternalId(cookies, logger);

    const cookieHeader = createCookieHeader(COOKIE_CONFIG.name, externalId);
    res.setHeader('Set-Cookie', cookieHeader);

    return res.status(200).json({
      status: 'success',
      externalId,
    });
  } catch (error) {
    logger.error(`Failed to process ${req.method} request:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message,
    });
  }
}
