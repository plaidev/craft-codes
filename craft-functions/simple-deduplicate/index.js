// KVSの重複排除用サフィックス。任意のサフィックスを指定する
const DUP_SUFFIX = '<% DUP_SUFFIX %>';

/**
 * ファンクションの重複実行を検知します。
 * @param {Object} id - Craft Functionsの実行を一意に識別するID. (data.id)
 * @param {Object} kvs - MODULES.kvs
 * @param {*} suffix - Function識別用のサフィックス
 * @returns {Promise<boolean>} - すでに実行中であれば true を返却する。未実行であればKVSにレコードを書き込んでfalseを返却する。
 */
async function isDuplicatedExec(id, kvs, suffix) {
    const key = `${id}_${suffix}`;
    const v = await kvs.get({key});

    if (v[key] != null) {
        return true;
    }

    try {
        const unixtimeMs = new Date().getTime();
        await kvs.checkAndWrite({
            key,
            value: { id, suffix },
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

    if (await isDuplicatedExec(data.id, kvs, DUP_SUFFIX)) {
        logger.warn('duplicated execution.', data.id);
        return;
    }

    logger.log(`executed. (id=${data.id})`);
}