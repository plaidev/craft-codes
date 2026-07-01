import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>'; // DEBUG, INFO, WARN, ERROR

const HASH_PREFIX_LENGTH = 8; // ハッシュ値の文字数。既存レコードのkey生成方式に合わせて調整する
const HASH_KEY_SEPARATOR = '-'; // replace_with_hash_prefix でハッシュ値の後ろに付与する区切り文字。既存レコードのkey生成方式に合わせて調整する
const RETRY_TIMEOUT_SEC = 3600; // KVS書き込み失敗時のリトライタイムアウト（秒）。固定値（推奨値）

const KEY_OPERATIONS = ['none', 'replace_with_manual', 'replace_with_hash_prefix'];

function generateHashPrefix(id) {
  const hashBase64Url = crypto.createHash('sha256').update(id).digest('base64url');
  // 辞書順を分散させるためハッシュ値の5文字目以降を使用
  return hashBase64Url.substring(4, 4 + HASH_PREFIX_LENGTH);
}

function validateOperation(operation) {
  if (!operation || typeof operation !== 'object') {
    throw new Error('operation is required');
  }
  const { mergeValue, minutesToExpire, keyOperation, keyPrefixReplaceTarget, keyPrefixReplaceValue, dryRun } =
    operation;

  if (mergeValue === null || typeof mergeValue !== 'object' || Array.isArray(mergeValue)) {
    throw new Error('operation.mergeValue must be an object');
  }
  if (!Number.isFinite(minutesToExpire) || minutesToExpire <= 0) {
    throw new Error('operation.minutesToExpire must be a positive number');
  }
  if (!KEY_OPERATIONS.includes(keyOperation)) {
    throw new Error(`Invalid operation.keyOperation: ${keyOperation}`);
  }

  if (keyOperation !== 'none') {
    if (!keyPrefixReplaceTarget) {
      throw new Error(`keyOperation='${keyOperation}' requires keyPrefixReplaceTarget (regex)`);
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(keyPrefixReplaceTarget);
    } catch (err) {
      throw new Error(`Invalid keyPrefixReplaceTarget regex: ${err.message}`);
    }
  }

  if (dryRun !== undefined && typeof dryRun !== 'boolean') {
    throw new Error('operation.dryRun must be a boolean value');
  }

  return {
    mergeValue,
    minutesToExpire,
    keyOperation,
    keyPrefixReplaceTarget: keyPrefixReplaceTarget ?? '',
    keyPrefixReplaceValue: keyPrefixReplaceValue ?? '',
    dryRun: dryRun ?? false,
  };
}

function throwSuitableWriteError(err, RetryableError, context, retryTimeoutSec) {
  const message = err?.message || String(err);
  const isPermanent = err?.status === 400;
  if (isPermanent) {
    throw new Error(`${context} permanent error: ${message}`);
  }
  throw new RetryableError(`${context} (retryable): ${message}`, retryTimeoutSec);
}

function resolveNewKey(oldKey, op) {
  if (op.keyOperation === 'none') {
    return oldKey;
  }

  const target = new RegExp(op.keyPrefixReplaceTarget);
  const replacement =
    op.keyOperation === 'replace_with_hash_prefix'
      ? `${generateHashPrefix(oldKey)}${HASH_KEY_SEPARATOR}`
      : op.keyPrefixReplaceValue;

  const newKey = oldKey.replace(target, replacement);
  if (!newKey) {
    throw new Error(`Resulting key is empty. oldKey: ${oldKey}`);
  }
  return newKey;
}

async function updateKvsRecord(logger, kvs, record, op, RetryableError) {
  const newKey = resolveNewKey(record.key, op);
  const mergedValue = { ...record.value, ...op.mergeValue };

  if (op.dryRun) {
    logger.log(
      `[DRY RUN] Would write KVS record. key: ${newKey}, ` +
      `minutesToExpire: ${op.minutesToExpire}, ` +
      `mergedValue: ${JSON.stringify(mergedValue)}`
    );

    if (newKey !== record.key) {
      logger.log(`[DRY RUN] Would delete old KVS record. key: ${record.key}`);
    }

    return { written: false, skipped: true, newKey, dryRun: true };
  }

  try {
    await kvs.write({ key: newKey, value: mergedValue, minutesToExpire: op.minutesToExpire });
    logger.debug(`KVS record written. key: ${newKey}, minutesToExpire: ${op.minutesToExpire}`);

    if (newKey !== record.key) {
      try {
        await kvs.delete({ key: record.key });
        logger.debug(`Old KVS record deleted. key: ${record.key}`);
      } catch (deleteError) {
        logger.warn(`Failed to delete old key: ${record.key}. Both keys may coexist.`, deleteError);
      }
    }

    return { written: true, newKey };
  } catch (error) {
    logger.error(`Failed to update KVS record. oldKey: ${record.key}, newKey: ${newKey}`, error);
    throwSuitableWriteError(
      error,
      RetryableError,
      `KVS update failed for key: ${record.key} -> ${newKey}`,
      RETRY_TIMEOUT_SEC
    );
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const { record, operation } = data.jsonPayload?.data || {};

    if (!record || !record.key) {
      logger.error('Record key is missing', record);
      throw new Error('Record key is required');
    }
    if (record.value === undefined || record.value === null) {
      logger.error('Record value is missing', record);
      throw new Error(`Record value is required for key: ${record.key}`);
    }

    const op = validateOperation(operation);

    logger.log(`Processing bulk update for key: ${record.key}`);

    const result = await updateKvsRecord(logger, kvs, record, op, RetryableError);

    return {
      success: true,
      key: record.key,
      ...result,
    };
  } catch (error) {
    logger.error('Error in KVS bulk update worker:', error);

    // RetryableErrorはそのまま再スローしてリトライさせる
    if (error instanceof RetryableError || error.name === 'RetryableError') {
      throw error;
    }

    // それ以外は通常のエラーとして処理する
    throw new Error(`KVS bulk update worker failed: ${error.message}`);
  }
}
