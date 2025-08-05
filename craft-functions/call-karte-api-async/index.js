const LOG_LEVEL = '<% LOG_LEVEL %>';

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateParameters(payload, functionId, logger) {
  const { apiUrl, tokenSecretName, parameters, retryTimeoutSec = 3600 } = payload;

  if (!apiUrl || typeof apiUrl !== 'string') {
    logger.error(
      `Missing or invalid apiUrl. It must be a non-empty string. caller functionId: ${functionId}`
    );
    return false;
  }

  const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?$/;
  if (!urlPattern.test(apiUrl)) {
    logger.error(
      `Invalid apiUrl format. It must be a valid HTTP or HTTPS URL. caller functionId: ${functionId}`
    );
    return false;
  }

  if (!tokenSecretName || typeof tokenSecretName !== 'string') {
    logger.error(
      `Missing or invalid tokenSecretName. It must be a non-empty string. caller functionId: ${functionId}`
    );
    return false;
  }

  if (!isObject(parameters)) {
    logger.error(
      `Missing or invalid parameters. It must be an object. caller functionId: ${functionId}`
    );
    return false;
  }

  if (typeof retryTimeoutSec !== 'number' || retryTimeoutSec <= 0) {
    logger.error(
      `Invalid retryTimeoutSec. It must be a positive number. caller functionId: ${functionId}`
    );
    return false;
  }

  return true;
}

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

async function getTokenFromSecret(
  tokenSecretName,
  functionId,
  secret,
  logger,
  retryTimeoutSec,
  RetryableError
) {
  let secrets;
  try {
    secrets = await secret.get({ keys: [tokenSecretName] });
  } catch (err) {
    const msg = `Failed to retrieve secrets. tokenSecretName: ${tokenSecretName}, caller functionId: ${functionId}, error: ${err.message}, status: ${err.status}.`;
    throwSuitableError({ msg, status: err.status, RetryableError, retryTimeoutSec });
  }

  const token = secrets[tokenSecretName];
  if (!token) {
    logger.error(`Token not found in secret: ${tokenSecretName}. caller functionId: ${functionId}`);
    return null;
  }

  return token;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { functionId, data: payload } = data.jsonPayload || {};

  if (!isObject(payload)) {
    logger.error(
      `Invalid payload: data.jsonPayload.data is not an object. caller functionId: ${functionId}`
    );
    return;
  }

  const { apiUrl, tokenSecretName, parameters, retryTimeoutSec = 3600 } = payload;
  logger.debug(
    `apiUrl: ${apiUrl}, tokenSecretName: ${tokenSecretName}, parameters: ${JSON.stringify(parameters)}, retryTimeoutSec: ${retryTimeoutSec}`
  );

  if (!validateParameters(payload, functionId, logger)) {
    return;
  }

  const token = await getTokenFromSecret(
    tokenSecretName,
    functionId,
    secret,
    logger,
    retryTimeoutSec,
    RetryableError
  );
  if (!token) {
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const msg = `API request failed. caller functionId: ${functionId}, status: ${response.status}, error: ${errorText}`;
      throwSuitableError({ msg, status: response.status, RetryableError, retryTimeoutSec });
    }

    logger.debug(
      `API request to ${apiUrl} executed successfully. caller functionId: ${functionId}`
    );
  } catch (err) {
    const msg = `Failed to execute API request to ${apiUrl}. caller functionId: ${functionId}, error: ${err.message}`;
    const status = err.status || (err.code === 'ECONNRESET' ? 500 : null);
    throwSuitableError({ msg, status, RetryableError, retryTimeoutSec });
  }
}
