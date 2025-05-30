import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const MINUTES_TO_EXPIRE = Number('<% MINUTES_TO_EXPIRE %>');
const HEADER_COLUMNS = '<% HEADER_COLUMNS %>'.split(',').map(v => v.trim());

// kvs書き込み時のkeyに、元のkeyをhash化した文字列をprefixとして付与するオプションです。ホットスポット回避に利用したい場合はtrueを設定してください
const APPEND_HASH_PREFIX = '<% APPEND_HASH_PREFIX %>' === 'true';

function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

async function upsertData(key, row, kvs, logger, RetryableError) {
  let _key;
  if (APPEND_HASH_PREFIX) {
    const hash = generateHashPrefix(key);
    _key = `${hash}-${key}`;
  } else {
    _key = key;
  }

  try {
    await kvs.write({ key: _key, value: row, minutesToExpire: MINUTES_TO_EXPIRE });
    logger.debug(`kvs.write() succeeded. key: ${_key}`);
  } catch (err) {
    logger.warn(`kvs.write() failed. key: ${_key},  err: ${err.message}`);

    // kvsレコード上限超過エラーはリトライしない
    if (err.toString().includes('value size should be less than')) return;

    throw new RetryableError(`attempt to retry.`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { value } = data.jsonPayload.data;

  if (data.kind !== 'karte/jobflow') {
    logger.error(new Error('invalid kind'));
    return;
  }

  // SQLの結果をkvsに格納する
  const splitData = value.split(',');
  const obj = HEADER_COLUMNS.reduce((acc, colName, j) => {
    acc[colName] = splitData[j];
    return acc;
  }, {});
  await upsertData(obj[HEADER_COLUMNS[0]], obj, kvs, logger, RetryableError);
}
