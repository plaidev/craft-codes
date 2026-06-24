import { Storage } from '@google-cloud/storage';
import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_CHANNEL_ACCESS_TOKEN_SECRET_NAME = '<% LINE_CHANNEL_ACCESS_TOKEN_SECRET_NAME %>';
const SERVICE_ACCOUNT_KEY_SECRET_NAME = '<% SERVICE_ACCOUNT_KEY_SECRET_NAME %>';
const BUCKET_NAME = '<% BUCKET_NAME %>';
const FILE_PATH = '<% FILE_PATH %>';
const KARTE_APP_TOKEN_SECRET_NAME = '<% KARTE_APP_TOKEN_SECRET_NAME %>';
const JOBFLOW_ID = '<% JOBFLOW_ID %>';
const RETRY_TIMEOUT_SEC = 3600;
const LINE_FOLLOWER_IDS_URL = 'https://api.line.me/v2/bot/followers/ids';

async function fetchAllFollowers(accessToken) {
  const userIds = [];
  let next;
  do {
    const url = new URL(LINE_FOLLOWER_IDS_URL);
    url.searchParams.set('limit', '1000');
    if (next) {
      url.searchParams.set('start', next);
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      const error = new Error(`API request failed (${res.status})`);
      error.status = res.status;
      throw error;
    }
    const json = await res.json();
    userIds.push(...json.userIds);
    next = json.next;
  } while (next);
  return userIds;
}

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || status === 408);
  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

function formatDataToJsonLines(userIds) {
  return userIds.map(userId => JSON.stringify({ user_id: userId })).join('\n');
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // Secret Managerから認証情報を取得
  const secrets = await secret.get({
    keys: [LINE_CHANNEL_ACCESS_TOKEN_SECRET_NAME, SERVICE_ACCOUNT_KEY_SECRET_NAME],
  });
  const lineKey = secrets[LINE_CHANNEL_ACCESS_TOKEN_SECRET_NAME];
  const gcsKey = secrets[SERVICE_ACCOUNT_KEY_SECRET_NAME];

  // APIからデータを取得
  let userIds;
  try {
    userIds = await fetchAllFollowers(lineKey);
  } catch (e) {
    logger.error('Failed to fetch data from API', e);
    throwSuitableError({
      msg: e.message,
      status: e.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }

  // 空配列チェック
  if (!userIds || userIds.length === 0) {
    logger.warn('No data to process');
    return;
  }

  // JSONをJSONL形式に変換
  const jsonl = formatDataToJsonLines(userIds);

  // GCSにアップロード
  // @google-cloud/storage の仕様によりエラー時は適切なリトライが実行されます
  try {
    const storage = new Storage({
      credentials: JSON.parse(gcsKey),
    });
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(FILE_PATH);
    await file.save(jsonl);
    logger.log(`Successfully uploaded to gs://${BUCKET_NAME}/${FILE_PATH}`);
  } catch (e) {
    logger.error('Failed to upload to GCS', e);
    throw new Error(`GCS upload failed: ${e.message}`);
  }

  // データ処理後の次ステップを実行（jobflowIdが指定されている場合）
  if (JOBFLOW_ID) {
    try {
      const jobflowSecrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET_NAME] });
      const appToken = jobflowSecrets[KARTE_APP_TOKEN_SECRET_NAME];
      const jobflowsApi = api('@dev-karte/v1.0#kjw1z015mccjef86');
      jobflowsApi.auth(appToken);
      await jobflowsApi.postV2DatahubJobflowExec({ jobflow_id: JOBFLOW_ID });
      logger.log(`Successfully executed jobflow: ${JOBFLOW_ID}`);
    } catch (e) {
      logger.error('Failed to execute jobflow', e);
      throw new Error(`Jobflow execution failed: ${e.message}`);
    }
  }
}
