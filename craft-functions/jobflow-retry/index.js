import api from 'api';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SOLUTION_ID_FOR_KVS_KEY = '<% SOLUTION_ID_FOR_KVS_KEY %>';
const TARGET_JOBFLOW_IDS = '<% TARGET_JOBFLOW_IDS %>'; // カンマ区切り。空なら全対象
const EXCLUDED_JOBFLOW_IDS = '<% EXCLUDED_JOBFLOW_IDS %>'; // カンマ区切り。最優先で除外
const RETRY_LIMIT = Number('<% RETRY_LIMIT %>');
const RETRY_TIMEOUT = Number('<% RETRY_TIMEOUT %>');
const KVS_MINUTES_TO_EXPIRE = RETRY_TIMEOUT * 3;

const parseIds = rawString => {
  if (!rawString || rawString.includes('<%')) return [];
  return rawString
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '');
};

function generateKey(prefix, jobflowId) {
  const solutionId = SOLUTION_ID_FOR_KVS_KEY;
  const hashBase64 = crypto
    .createHash('sha256')
    .update(`${solutionId}-${prefix}-${jobflowId}`)
    .digest('base64');
  const hash = hashBase64.substring(0, 8);
  return `${hash}-${solutionId}-${prefix}-${jobflowId}`;
}

async function executeJobflow(appToken, jobflowId, logger) {
  try {
    const jobflowsApi = api('@dev-karte/v1.0#kjw1z015mccjef86');
    jobflowsApi.auth(appToken);
    const result = await jobflowsApi.postV2DatahubJobflowExec({ jobflow_id: jobflowId });
    logger.log(`Jobflow execution triggered: ${jobflowId}`);
    return result;
  } catch (err) {
    logger.error(`Failed to execute jobflow ${jobflowId}:`, err);
    throw err;
  }
}

async function getRetryState(kvs, retryCountKey, firstRetryDateKey) {
  const retryCounts = await kvs.get({ key: retryCountKey });
  const firstRetryDates = await kvs.get({ key: firstRetryDateKey });

  if (!retryCounts?.[retryCountKey] || !firstRetryDates?.[firstRetryDateKey]) {
    const firstRetryDate = Date.now();
    await kvs.write({
      key: firstRetryDateKey,
      value: { firstRetryDate, minutesToExpire: KVS_MINUTES_TO_EXPIRE },
    });
    return { currentRetryCount: 0, firstRetryDate };
  }

  const currentRetryCount = retryCounts[retryCountKey].value.retryCount;
  const firstRetryDate = firstRetryDates[firstRetryDateKey].value.firstRetryDate;

  return { currentRetryCount, firstRetryDate };
}

export default async function (data, { MODULES }) {
  const { secret, initLogger, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    return;
  }

  const jobflowId = data.jsonPayload.data.id;
  const status = data.jsonPayload.data.status;

  const targetIds = parseIds(TARGET_JOBFLOW_IDS);
  const excludedIds = parseIds(EXCLUDED_JOBFLOW_IDS);

  if (excludedIds.includes(jobflowId)) {
    logger.log(`Jobflow ${jobflowId} is excluded by EXCLUDED_JOBFLOW_IDS.`);
    return;
  }

  if (targetIds.length > 0 && !targetIds.includes(jobflowId)) {
    logger.log(`Jobflow ${jobflowId} is not in TARGET_JOBFLOW_IDS. Skipping.`);
    return;
  }

  if (status !== 'ERROR') {
    logger.log(`Jobflow ${jobflowId} status is ${status}. No retry needed.`);
    return;
  }

  const retryCountKey = generateKey('retryCount', jobflowId);
  const firstRetryDateKey = generateKey('firstRetryDate', jobflowId);

  const { currentRetryCount, firstRetryDate } = await getRetryState(
    kvs,
    retryCountKey,
    firstRetryDateKey
  );

  if (currentRetryCount >= RETRY_LIMIT) {
    logger.warn(`Retry limit reached for ${jobflowId}. Finishing.`);
    await kvs.delete({ key: retryCountKey });
    await kvs.delete({ key: firstRetryDateKey });
    return;
  }

  const timeoutMs = RETRY_TIMEOUT * 60 * 1000;
  if (Date.now() - firstRetryDate > timeoutMs) {
    logger.warn(`Retry timeout for ${jobflowId}. Finishing.`);
    await kvs.delete({ key: retryCountKey });
    await kvs.delete({ key: firstRetryDateKey });
    return;
  }

  logger.log(`Retrying jobflow ${jobflowId}. Attempt: ${currentRetryCount + 1}`);

  const karteSecrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const karteAppToken = karteSecrets[KARTE_APP_TOKEN_SECRET];

  await executeJobflow(karteAppToken, jobflowId, logger);

  await kvs.write({
    key: retryCountKey,
    value: {
      retryCount: currentRetryCount + 1,
      minutesToExpire: KVS_MINUTES_TO_EXPIRE,
    },
  });
}
