// KVSの重複排除用プレフィクス。任意のプレフィクスを指定する。
const DUP_PREFIX = 'functionName';

/**
 * ファンクションの重複実行を検知します。
 * @param {Object} id - Craft Functionsの実行を一意に識別するID. (data.id)
 * @param {Object} kvs - MODULES.kvs
 * @param {*} prefix - Function識別用のプレフィクス
 * @returns {boolean} - すでに実行中であれば true を返却する。未実行であればKVSにレコードを書き込んでfalseを返却する。
 */
async function isDuplicatedExec(id, kvs, prefix) {
    const key = `${prefix}_${id}`;
    const v = await kvs.get({key});

    if (v[key] != null) {
        return true;
    }

    try {
        const unixtimeMs = new Date().getTime();
        await kvs.checkAndWrite({
            key,
            value: { id, prefix },
            operator: '<',
            unixtimeMs,
        });
        return false;
    } catch(e) {
        // 書き込みが衝突した場合、すでに実行中のファンクションが存在するので true を返す
        if (e.status === 409) {
            return true;
        }
        throw e;
    }
}

export default async function(data, {MODULES}) {
    const { logger, kvs } = MODULES;

    if (await isDuplicatedExec(data.id, kvs, DUP_PREFIX)) {
        logger.warn('duplicated execution.', data);
        return;
    }

    logger.log(`executed. (id=${data.id})`);
}