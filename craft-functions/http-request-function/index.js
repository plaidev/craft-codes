const LOG_LEVEL = '<% LOG_LEVEL %>';

function throwSuitableError({ msg, status, RetryableError }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));
  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, 10);
  }
  throw new Error(msg);
}

export default async function (data, { MODULES }) {
  const { initLogger, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const payload = data.jsonPayload && data.jsonPayload.data ? data.jsonPayload.data : data;

  const { targetUrl, method = 'POST', headers = {}, body: _body } = payload;

  if (!targetUrl || !_body) {
    logger.error('Invalid parameters.', {
      targetUrl: targetUrl || '(undefined or empty)',
      hasBody: !!_body,
      bodyType: typeof _body,
    });
    return;
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const body = JSON.stringify(_body);

  try {
    logger.debug(`[Sending] ${method} to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body,
    });

    if (!response.ok) {
      const txt = await response.text();
      const msg = `Request failed: ${response.status} ${txt}`;
      throwSuitableError({ msg, status: response.status, RetryableError });
    }

    logger.debug('[Success] Request completed.');
  } catch (err) {
    const msg = `[NETWORK_ERROR] ${err.message}`;
    logger.error(msg);
    throwSuitableError({ msg, status: err.status || 500, RetryableError });
  }
}
