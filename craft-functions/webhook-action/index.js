import retry from "async-retry";
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const FUNCTIONS_TIMEOUT_MS = 20 * 1000; // [変更不可] Function全体における1回の実行のTimeout時間（ミリ秒）. Craft Functions側の制限である30secを超えないよう余裕をもった値を設定する

const defaultRetryOptions = {
  retries: 4, // 最大リトライ回数
  minTimeout: 1000, // 最小リトライ間隔（ミリ秒）
  maxTimeout: 10000, // 最大リトライ間隔（ミリ秒）
  randomize: false, // リトライ間隔の計算に乱数を利用する
  factor: 2, // リトライ間隔を指数関数的に増やすときの乗数
};

class BailError extends Error {
  constructor(message) {
    super(message);
  }
}

function infoLogger(logger, infoLogEnabled=false) {
  return {
    log: (data, ...args) => {
      if(!infoLogEnabled) return;
      logger.log(data, ...args);
    }
  }
}

// Note https://github.com/tim-kos/node-retry#retrytimeoutsoptions
function calculateSleepMs({attempt, minTimeout=1000, maxTimeout=10*1000, factor=2, randomize}) {
  let sleepTime = Math.min(
    minTimeout * Math.pow(factor, attempt - 1),
    maxTimeout
  );

  if (randomize) {
    // randomize: Randomizes the timeouts by multiplying with a factor between 1 to 2.
    // 最大値の2で計算する
    sleepTime = sleepTime * 2;
  }
  return sleepTime;
}

function isTimeoutRertyLoop({retryOptions, attempt, startMs}) {
  if (attempt >= retryOptions.retries+1) return false;
  const currentMs = new Date().getTime();
  const nextSleepMs = calculateSleepMs({...retryOptions, attempt});
  return currentMs + nextSleepMs - startMs  >= FUNCTIONS_TIMEOUT_MS;
}

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

async function requestData({ method, url, data = {}, headers = {}, campaignId, id }) {
  if (!ALLOWED_METHODS.includes(method)) {
    throw new BailError(`[${campaignId}][${id}] Method is not allowed`);
  }

  if (!isValidUrl(url)) {
    throw new BailError(`[${campaignId}][${id}] URL is not valid`);
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
    if (response.status >= 500 && response.status < 600 || [408, 429].includes(response.status)) {
      throw new Error(`[${campaignId}][${id}] Request failed with status ${response.status}`);
    }
    throw new BailError(`[${campaignId}][${id}] Request failed with status ${response.status}. Bail Error.`);
  }

  return response.status;
}

export default async function (data, { MODULES }) {
  const { logger } = MODULES;
  const { method, url, hookData, headers, infoLogEnabled, campaignId } = data.jsonPayload.data;
  const _logger = infoLogger(logger, infoLogEnabled);
  const { id } = data; // 関数実行毎のID
  let { retryOptions } = data.jsonPayload.data;
  retryOptions = retryOptions ? retryOptions : defaultRetryOptions;

  const startMs = new Date().getTime();

  return await retry(async (bail, attempt) => {
    try {
      const resStatus = await requestData({ method, url, data: hookData, headers, campaignId, id });
      _logger.log(`[${campaignId}][${id}] Webhook execution completed. status: ${resStatus}`);
      return;
    } catch (err) {
      if (err instanceof BailError) {
        bail(err);
        return;
      }
      if (isTimeoutRertyLoop({retryOptions, attempt, startMs})) {
        bail(new Error(`[${campaignId}][${id}] Craft function timeout.`));
        return;
      }
      throw err;
    }
  }, retryOptions);
}
