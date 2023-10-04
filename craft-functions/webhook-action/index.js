const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// Function自体の再実行も考慮したTimeout時間（秒）. 無限に再実行されるのを防ぐ. ex 60 * 10 = 10分
const PER_DATA_TIMEOUT_SEC = Number('<% PER_DATA_TIMEOUT_SEC %>');
const LOG_LEVEL = "<% LOG_LEVEL %>"; // DEBUG, INFO, WARN, ERROR

function isValidUrl(url) {
  const regex = /^(https?:\/\/[^\s/:?#]+)([^\s?#]*)(\?[^#]*)?(#.*)?$/;
  const match = url.match(regex);

  if (match) {
    // const protocolAndDomain = match[1]; // "https://example.com"
    // const path = match[2]; // "/path/to/something"
    const query = match[3]; // "?query=param"
    const fragment = match[4]; // "#fragment"

    return query === undefined && fragment === undefined;
  }

  return false;
}

async function requestData({
  method,
  url,
  data = {},
  headers = {},
  campaignId,
  id,
  RetryableError,
}) {
  if (!ALLOWED_METHODS.includes(method)) {
    throw new Error(`[${campaignId}][${id}] Method is not allowed`);
  }

  if (!isValidUrl(url)) {
    throw new Error(`[${campaignId}][${id}] URL is not valid`);
  }

  const requestOptions = {
    method: method,
    headers: new Headers(headers),
  };

  if (method === "GET") {
    const urlParams = new URLSearchParams(data);
    url = `${url}?${urlParams}`;
  } else if (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  ) {
    requestOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    if (
      (response.status >= 500 && response.status < 600) ||
      [408, 429].includes(response.status)
    ) {
      throw new RetryableError(
        `[${campaignId}][${id}] Request failed with status ${response.status}`,
        PER_DATA_TIMEOUT_SEC
      );
    }
    throw new Error(
      `[${campaignId}][${id}] Request failed with status ${response.status}. Bail Error.`
    );
  }

  return response.status;
}

export default async function (data, { MODULES }) {
  const { initLogger,  RetryableError } = MODULES;
  const { id } = data;
  const { method, url, hookData, headers, campaignId } = data.jsonPayload.data;
  const logger = initLogger({
    logLevel: ["DEBUG", "INFO", "WARN", "ERROR"].includes(LOG_LEVEL)
      ? LOG_LEVEL
      : "ERROR",
  });

  if (data.kind !== "karte/action") {
    logger.error("invalid kind. expected: karte/action", data);
    return;
  }

  const resStatus = await requestData({
    method,
    url,
    data: hookData,
    headers,
    campaignId,
    id,
    RetryableError,
  });
  logger.debug(
    `[${campaignId}][${id}] Webhook execution completed. status: ${resStatus}`
  );

  return;
}
