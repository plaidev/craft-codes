import crypto from 'crypto';

const SOLUTION_ID = '<% SOLUTION_ID %>';

/**
 * Craft KVSのkeyに付与するhash prefixを生成します。
 * @param {string} key - hash prefix無しのkey
 * @returns {string} - hash prefix
 */
function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

/**
 * Craft KVSのkeyを生成して返却します。
 * @param {string} execId - Craft Functionsの実行を一意に識別するID. (data.id)
 * @returns {string} - CRAFT KVSのkey
 */
function kvsKey(execId) {
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${execId}`);
  return `${hash}-${solutionId}-${execId}`;
}

/**
 * ファンクションの重複実行を検知します。
 * @param {string} execId - Craft Functionsの実行を一意に識別するID. (data.id)
 * @param {Object} kvs - MODULES.kvs
 * @returns {Promise<boolean>} - すでに実行中であれば true を返却する。未実行であればKVSにレコードを書き込んでfalseを返却する。
 */
async function isDuplicatedExec(execId, kvs) {
  const key = kvsKey(execId);
  const v = await kvs.get({ key });

  if (v[key] != null) {
    return true;
  }

  try {
    const unixtimeMs = new Date().getTime();
    await kvs.checkAndWrite({
      key,
      value: { id: execId },
      operator: '<',
      unixtimeMs,
    });
    return false;
  } catch (e) {
    // 書き込みが衝突した場合、すでに実行中のファンクションが存在するので true を返す
    if (e.status === 409) {
      return true;
    }
    throw e;
  }
}

export default async function (data, { MODULES }) {
  const { logger, kvs } = MODULES;

  if (await isDuplicatedExec(data.id, kvs)) {
    logger.warn('duplicated execution.', data.id);
    return;
  }

  logger.log(`executed. (id=${data.id})`);
}
