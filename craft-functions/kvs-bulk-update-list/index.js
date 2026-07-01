const LOG_LEVEL = '<% LOG_LEVEL %>'; // DEBUG, INFO, WARN, ERROR
const KVS_PREFIX_RANGE = '<% KVS_PREFIX_RANGE %>'; // 処理対象のKVSキー範囲（スラッシュ区切り）。形式: 開始位置/終了位置
const DRY_RUN = '<% DRY_RUN %>' === 'true'; // ドライラン（true時はKVS書き込みをスキップ）
const KVS_WRITE_FUNCTION_ID = '<% KVS_WRITE_FUNCTION_ID %>'; // ワーカー（kvs-bulk-update-write）のファンクションID
const KVS_CURSOR_KEY = '<% KVS_CURSOR_KEY %>'; // endCursorを保存するKVSキー（対象prefix範囲外にすること）

// ワーカーに連携する更新オペレーション設定
const MERGE_VALUE_JSON = '<% MERGE_VALUE %>'; // valueにshallow mergeするJSON文字列。例: {"feature_x_enabled": false}
const KVS_MINUTES_TO_EXPIRE = Number('<% KVS_MINUTES_TO_EXPIRE %>'); // 書き戻し時に一律設定する有効期限（分）
const KEY_OPERATION = '<% KEY_OPERATION %>'; // 'none' / 'replace_with_manual' / 'replace_with_hash_prefix'
const KEY_PREFIX_REPLACE_TARGET = '<% KEY_PREFIX_REPLACE_TARGET %>'; // 置換対象（正規表現）。例: prefix付与なら ^ 、prefix削除/置換なら ^old-
const KEY_PREFIX_REPLACE_VALUE = '<% KEY_PREFIX_REPLACE_VALUE %>'; // replace_with_manual時の置換後文字列（空文字なら削除）

const PAGE_SIZE = 30; // kvs.listの取得件数（最大30）。ホットスポット緩和等が必要ならこの定数を編集
const MAX_RUN_SECONDS = 480; // 1実行の処理時間バジェット（秒。イベント駆動上限540未満にする）
const LIST_RETRY_TIMEOUT_SEC = 300; // kvs.list一時エラー時にその場でリトライする期限（秒）
const CURSOR_MINUTES_TO_EXPIRE = 1440; // カーソル・完了フラグの有効期限（分）。24時間（1日間のスケジューラ想定）

const KEY_OPERATIONS = ['none', 'replace_with_manual', 'replace_with_hash_prefix'];

/**
 * MERGE_VALUE をJSONパースして返す（JSONオブジェクトでなければ即fail）。
 */
function parseMergeValue() {
  let mergeValue;
  try {
    mergeValue = JSON.parse(MERGE_VALUE_JSON);
  } catch (err) {
    throw new Error(`MERGE_VALUE is not valid JSON: ${err.message}`);
  }
  if (mergeValue === null || typeof mergeValue !== 'object' || Array.isArray(mergeValue)) {
    throw new Error('MERGE_VALUE must be a JSON object');
  }
  return mergeValue;
}

/**
 * KVS_PREFIX_RANGE をパースして {startKey, stopKey} を返す。
 * フォーマット: "start/end"
 */
function parsePrefixRange() {
  if (!KVS_PREFIX_RANGE) {
    throw new Error('KVS_PREFIX_RANGE is required');
  }

  const parts = KVS_PREFIX_RANGE.split('/').map(s => s.trim());

  if (parts.length !== 2) {
    throw new Error(
      `KVS_PREFIX_RANGE must contain exactly 2 values separated by slash. ` +
      `Expected format: "start/end". Got: "${KVS_PREFIX_RANGE}"`
    );
  }

  const [startKey, stopKey] = parts;

  if (!startKey || !stopKey) {
    throw new Error(
      `KVS_PREFIX_RANGE values cannot be empty. Got: start="${startKey}", end="${stopKey}"`
    );
  }

  return { startKey, stopKey };
}

/**
 * DRY_RUN に応じたカーソルキーを返す。
 * ドライラン時は -dryrun サフィックスを付与して本番実行と分離する。
 */
function resolveCursorKey() {
  return DRY_RUN ? `${KVS_CURSOR_KEY}-dryrun` : KVS_CURSOR_KEY;
}

function validateVariables() {
  // KVS_PREFIX_RANGE validation is handled by parsePrefixRange()
  if (!KVS_CURSOR_KEY) throw new Error('KVS_CURSOR_KEY is required');
  if (!KVS_WRITE_FUNCTION_ID) throw new Error('KVS_WRITE_FUNCTION_ID is required');

  if (!Number.isFinite(KVS_MINUTES_TO_EXPIRE) || KVS_MINUTES_TO_EXPIRE <= 0) {
    throw new Error('KVS_MINUTES_TO_EXPIRE must be a positive number');
  }

  if (!KEY_OPERATIONS.includes(KEY_OPERATION)) {
    throw new Error(
      `Invalid KEY_OPERATION: ${KEY_OPERATION}. Use ${KEY_OPERATIONS.join(' / ')}`
    );
  }

  if (KEY_OPERATION !== 'none') {
    if (!KEY_PREFIX_REPLACE_TARGET) {
      throw new Error(`KEY_OPERATION='${KEY_OPERATION}' requires KEY_PREFIX_REPLACE_TARGET (regex)`);
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(KEY_PREFIX_REPLACE_TARGET);
    } catch (err) {
      throw new Error(`KEY_PREFIX_REPLACE_TARGET is not a valid regex: ${err.message}`);
    }
  }

  if (typeof DRY_RUN !== 'boolean') {
    throw new Error('DRY_RUN must be a boolean value');
  }
}

/**
 * ワーカーへ渡す更新オペレーション設定を組み立てる。
 * 各レコードのinvokeで同じoperationを連携する。
 * @returns {Object} operation
 */
function buildOperation() {
  const mergeValue = parseMergeValue();
  return {
    mergeValue,
    minutesToExpire: KVS_MINUTES_TO_EXPIRE,
    keyOperation: KEY_OPERATION,
    keyPrefixReplaceTarget: KEY_PREFIX_REPLACE_TARGET,
    keyPrefixReplaceValue: KEY_PREFIX_REPLACE_VALUE,
    dryRun: DRY_RUN,
  };
}

function throwSuitableListError(err, RetryableError) {
  const status = err?.status;
  const isTransient =
    status && ((status >= 500 && status < 600) || [408, 429].includes(status));
  if (isTransient) {
    throw new RetryableError(`kvs.list failed (retryable): ${err.message}`, LIST_RETRY_TIMEOUT_SEC);
  }
  throw new Error(`kvs.list failed (permanent): ${err.message}`);
}

async function loadJobState(logger, kvs, cursorKey) {
  try {
    const result = await kvs.get({ keys: [cursorKey] });
    const state = result?.[cursorKey]?.value;
    if (state) {
      if (state.completed) {
        logger.log(`Job already completed at ${state.completedAt}`);
        return state;
      }
      if (state.jobStartedAt) {
        logger.log(`Resuming job. cursor: ${state.cursor}, jobStartedAt: ${state.jobStartedAt}`);
        return { cursor: state.cursor ?? null, jobStartedAt: state.jobStartedAt };
      }
    }
  } catch (error) {
    logger.warn('Failed to read job state from KVS. Starting fresh.', error);
  }
  return null;
}

async function saveJobState(logger, kvs, cursorKey, state) {
  await kvs.write({
    key: cursorKey,
    value: state,
    minutesToExpire: CURSOR_MINUTES_TO_EXPIRE,
  });
  logger.debug(`Job state saved. cursor: ${state.cursor}, jobStartedAt: ${state.jobStartedAt}`);
}

async function fetchKvsList(logger, kvs, startCursor, prefixRange) {
  logger.debug('Fetching KVS list. startCursor:', startCursor);

  const response = await kvs.list({
    startCursor,
    pageSize: PAGE_SIZE,
    startKey: prefixRange.startKey,
    stopKey: prefixRange.stopKey,
  });

  return {
    values: response.item || {},
    hasMoreResults: response.isMoreResults,
    endCursor: response.endCursor,
  };
}

async function invokeWriteFunction(craftFunctions, key, record, operation) {
  await craftFunctions.invoke({
    functionId: KVS_WRITE_FUNCTION_ID,
    data: {
      record: {
        key,
        value: record.value,
      },
      operation,
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, craftFunctions, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // 変数の検証はここで1回だけ行い、不正なら即failする。
  validateVariables();

  // PREFIX範囲とカーソルキーを解決（DRY_RUNに応じて分岐）
  const prefixRange = parsePrefixRange();
  const cursorKey = resolveCursorKey();

  // DRY_RUN時は目立つログで通知
  if (DRY_RUN) {
    logger.log('=== DRY RUN ENABLED ===');
    logger.log('KVS writes will be skipped. Cursor key:', cursorKey);
    logger.log('Prefix range:', `${prefixRange.startKey} to ${prefixRange.stopKey}`);
  }

  const startedAtMs = Date.now();
  let loopCount = 0;
  let totalProcessedRecords = 0;
  let currentKey;
  let hasMoreResults = true;
  const logPrefix = DRY_RUN ? '[DRY RUN] ' : '';

  try {
    logger.log(`${logPrefix}Starting KVS bulk update...`);

    const operation = buildOperation();

    // ジョブ状態（カーソル＋ジョブ開始時刻＋完了フラグ）を取得
    let state = await loadJobState(logger, kvs, cursorKey);

    // 既に完了済みの場合はスキップ
    if (state?.completed) {
      logger.log(
        `Job already completed at ${state.completedAt}. ` +
        `Skipping to prevent re-execution during scheduler period. ` +
        `Total records processed: ${state.totalRecords || 'unknown'}`
      );
      return {
        alreadyCompleted: true,
        completedAt: state.completedAt,
        totalRecords: state.totalRecords,
        dryRun: DRY_RUN
      };
    }

    // 未完了の場合は新規開始
    if (!state) {
      state = { cursor: null, jobStartedAt: new Date().toISOString() };
      await saveJobState(logger, kvs, cursorKey, state);
    }
    const jobStartedAtMs = new Date(state.jobStartedAt).getTime();
    // 基準時刻が不正だと再処理除外が黙って無効化される（key操作で二重処理の恐れ）ため即fail
    if (!Number.isFinite(jobStartedAtMs)) {
      throw new Error(`Invalid jobStartedAt in saved state: ${state.jobStartedAt}`);
    }
    let cursor = state.cursor;

    while (hasMoreResults) {
      // 実行時間バジェットに達したら正常終了（カーソルは保持されるので次回継続）
      const elapsedSec = (Date.now() - startedAtMs) / 1000;
      if (elapsedSec >= MAX_RUN_SECONDS) {
        logger.warn(
          `${logPrefix}Reached MAX_RUN_SECONDS (${MAX_RUN_SECONDS}s). Pausing. ` +
            `Will resume from saved cursor on next run. processed: ${totalProcessedRecords}`
        );
        return { paused: true, totalProcessedRecords, loopCount, dryRun: DRY_RUN };
      }

      loopCount++;
      let page;
      try {
        page = await fetchKvsList(logger, kvs, cursor, prefixRange);
      } catch (err) {
        // 一時エラー（5xx/408/429）のみRetryableError、永続エラーは即fail
        throwSuitableListError(err, RetryableError);
      }
      const { values, hasMoreResults: hasMore, endCursor } = page;

      const rawEntries = Object.entries(values);
      if (rawEntries.length === 0) {
        logger.log(`Loop #${loopCount}: No records found`);
        hasMoreResults = false;
        break;
      }

      // このジョブが生成/更新した（created_at >= jobStartedAt）レコードを除外し、再処理を防ぐ。
      // key更新では新keyが走査範囲内に再出現しうるため、開始時刻基準でself-producedを弾く。
      // またカーソルキー自体も走査範囲に含まれた場合は除外する（進捗管理用の内部データであり業務データではない）。
      const entries = [];
      const skippedKeys = [];
      rawEntries.forEach(([key, record]) => {
        // カーソルキー自体は処理対象から除外
        if (key === cursorKey) {
          skippedKeys.push(key);
          return;
        }

        const createdAtMs = new Date(record.created_at).getTime();
        if (Number.isFinite(createdAtMs) && createdAtMs >= jobStartedAtMs) {
          skippedKeys.push(key);
        } else {
          entries.push([key, record]);
        }
      });

      // 除外したkeyはWARNで残す（クロックずれ等による誤除外を検知できるようにするため）。
      if (skippedKeys.length > 0) {
        logger.warn(
          `Loop #${loopCount}: excluded ${skippedKeys.length} records by created_at >= jobStartedAt ` +
            `(self-produced or clock-skew). keys: ${skippedKeys.join(', ')}`
        );
      }

      [currentKey] = rawEntries[0];
      logger.log(
        `${logPrefix}Loop #${loopCount}: dispatching ${entries.length} records (excluded ${skippedKeys.length}), currentKey: ${currentKey}`
      );

      // 各レコードの更新をワーカーへ並列ディスパッチする
      if (entries.length > 0) {
        const results = await Promise.allSettled(
          entries.map(([key, record]) => invokeWriteFunction(craftFunctions, key, record, operation))
        );

        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length > 0) {
          // ディスパッチ失敗時はカーソルを進めず、次回そのページから再試行する
          logger.error(
            `Loop #${loopCount}: ${rejected.length}/${entries.length} dispatch failed. ` +
              `Cursor is NOT advanced; this page will be retried on the next run.`,
            rejected.map(r => r.reason?.message)
          );
          throw new Error(
            `dispatch failed: ${rejected.length}/${entries.length} records at currentKey: ${currentKey}`
          );
        }

        totalProcessedRecords += entries.length;
      }

      // ページ完了 → ジョブ状態（カーソル＋jobStartedAt）を保存して前進
      if (endCursor) {
        await saveJobState(logger, kvs, cursorKey, { cursor: endCursor, jobStartedAt: state.jobStartedAt });
      }
      cursor = endCursor;
      hasMoreResults = hasMore;
    }

    logger.log(
      `${logPrefix}KVS bulk update completed. loopCount: ${loopCount}, total records: ${totalProcessedRecords}`
    );

    // 完了したので完了フラグを保存する（カーソルは削除しない）
    // TTLは「完了から CURSOR_MINUTES_TO_EXPIRE 経過後」に削除される
    try {
      await kvs.write({
        key: cursorKey,
        value: {
          completed: true,
          completedAt: new Date().toISOString(),
          jobStartedAt: state.jobStartedAt,
          totalRecords: totalProcessedRecords,
          dryRun: DRY_RUN
        },
        minutesToExpire: CURSOR_MINUTES_TO_EXPIRE
      });
      logger.log(
        `${logPrefix}Job completed. Completion flag saved (TTL: ${CURSOR_MINUTES_TO_EXPIRE}min) ` +
        `to prevent re-execution during scheduler period`
      );
    } catch (error) {
      logger.debug('Error saving completion flag:', error);
    }

    return { completed: true, totalProcessedRecords, loopCount, dryRun: DRY_RUN };
  } catch (error) {
    // listの一時エラー由来のRetryableErrorはそのまま再スローしてその場リトライさせる
    if (error instanceof RetryableError || error.name === 'RetryableError') {
      throw error;
    }
    // それ以外（永続エラー・dispatch失敗）は終了。進捗はカーソルに保存済みなので
    // 次回のスケジューラ起動で続きから再開する。
    throw new Error(
      `${logPrefix}KVS bulk update failed. message: ${error.message}, loopCount: ${loopCount}, currentKey: ${currentKey}`
    );
  }
}
