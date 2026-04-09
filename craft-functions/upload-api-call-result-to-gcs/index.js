import { Storage } from '@google-cloud/storage';
import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const API_URL = '<% API_URL %>';
const BUCKET_NAME = '<% BUCKET_NAME %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = 3600;

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));
  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

function formatDataToJSONLines(data) {
  return data.map(obj => JSON.stringify(obj)).join('\n');
}

function parseDataFromPayload(valueString) {
  if (!valueString) {
    throw new Error('処理対象のデータ（jsonPayload.data.value）が存在しません。');
  }
  const parts = valueString.split(',');
  if (parts.length < 2) {
    throw new Error(`データ形式が不正です。要素数が2未満です: ${valueString}`);
  }

  const parsedObject = {
    filePath: parts[0],
    jobflowId: parts[1]
  };

  return parsedObject;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // Secret Managerから認証情報を取得
  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const gcsKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];

  // ジョブフローからパラメータを取得
  const valueString = data.jsonPayload.data.value;
  const batchData = parseDataFromPayload(valueString);

  // APIからデータを取得
  // このテンプレートは実装の参考例です
  // 実際に利用する際は、使用するAPIの仕様に合わせてカスタマイズしてください
  let json;
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      const errorText = await res.text();
      const error = new Error(
        `API request failed (${res.status})
         URL: ${API_URL}
         Body: ${errorText}`
      );
      error.status = res.status;
      throw error;
    }
    json = await res.json();
  } catch (e) {
    logger.error('Failed to fetch data from API', e);
    throwSuitableError({
      msg: e.message,
      status: e.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC
    });
  }

  // 空配列チェック
  if (!json || json.length === 0) {
    logger.warn('No data to process');
    return;
  }

  // JSONをJSONL形式に変換
  const jsonl = formatDataToJSONLines(json);

  // GCSにアップロード
  // @google-cloud/storage の仕様によりエラー時は適切なリトライが実行されます
  try {
    const storage = new Storage({
      credentials: JSON.parse(gcsKey),
    });
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(batchData.filePath);
    await file.save(jsonl);
    logger.log(`Successfully uploaded to gs://${BUCKET_NAME}/${batchData.filePath}`);
  } catch (e) {
    logger.error('Failed to upload to GCS', e);
    return;
  }

  // データ処理後の次ステップを実行（jobflowIdが指定されている場合）
  if (batchData.jobflowId) {
    try {
      const jobflowSecrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
      const appToken = jobflowSecrets[KARTE_APP_TOKEN_SECRET];
      const jobflowsApi = api('@dev-karte/v1.0#kjw1z015mccjef86');
      jobflowsApi.auth(appToken);
      await jobflowsApi.postV2DatahubJobflowExec({ jobflow_id: batchData.jobflowId});
      logger.log(`Successfully executed jobflow: ${batchData.jobflowId}`);
    } catch (e) {
      logger.error('Failed to execute jobflow', e);
    }
  }
}
