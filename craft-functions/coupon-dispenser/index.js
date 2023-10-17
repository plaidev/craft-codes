import murmurhash from 'murmurhash';
import { differenceInMinutes } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const FREQUENT_ACQUISITION_ERROR_MINUTES = Number('<% FREQUENT_ACQUISITION_ERROR_MINUTES %>'); // 同一ユーザーの連続取得禁止を解除するまでの時間（分）. 連続取得チェックをしない場合は0を指定.

// kvs
const COUPON_CODE_PREFIX = '<% COUPON_CODE_PREFIX %>'; // プロジェクトで共通のクーポン管理用prefix
const COUPON_USER_STATUS_PREFIX = '<% COUPON_USER_STATUS_PREFIX %>'; // プロジェクトで共通のprefix
const COUPON_USER_STATUS_EXPIRE_MINUTES = Number('<% COUPON_USER_STATUS_EXPIRE_MINUTES %>'); // ユーザー状態の保持期間（分）

// Counter
const COUPON_INDEX_PREFIX = '<% COUPON_INDEX_PREFIX %>'; // プロジェクトで共通のクーポン管理用prefix
const COUPON_INDEX_EXPIRE_SECONDS = Number('<% COUPON_INDEX_EXPIRE_SECONDS %>'); // 払い出し中クーポン番号の保持期間（秒）

function couponCodeKey({ couponGroupId, couponIndex }) {
    const key = `${COUPON_CODE_PREFIX}_${couponGroupId}_${couponIndex}`;
    const hash = murmurhash.v3(key); // ホットスポット回避用のハッシュ値
    return `${hash}_${key}`; // 例: xxxx_coupon-code_shop001_42
}
function couponUserStatusKey({ couponGroupId, hashedUserId }) {
    const key = `${COUPON_USER_STATUS_PREFIX}_${couponGroupId}_${hashedUserId}`;
    const hash = murmurhash.v3(key); // ホットスポット回避用のハッシュ値
    return `${hash}_${key}`; // 例: xxxx_coupon-user-status_shop001_uuuuuuuuu
}
function couponIndexKey({ couponGroupId }) {
    return `${COUPON_INDEX_PREFIX}_${couponGroupId}`; // 例: coupon-index_shop001
}
function isFrequentAcquisition({ couponAcquisitionDate, logger }) {
    if (!couponAcquisitionDate) return false;
    const currentDate = new Date();
    const diff = differenceInMinutes(currentDate, new Date(couponAcquisitionDate), 'floor'); // 端数は切り捨て. 最小値は0になる
    logger.debug(`couponAcquisitionDate: ${couponAcquisitionDate}, currentDate: ${currentDate.toISOString()}, diff: ${diff}`);
    return diff < FREQUENT_ACQUISITION_ERROR_MINUTES;
}
function noRequiredParamErr(param) {
    return { craft_status_code: 400, error: `"${param}" is required in the request body.` }
}

async function fetchCouponCode({ couponGroupId, couponIndex, hashedUserId, kvs, logger }) {
    const key = couponCodeKey({ couponGroupId, couponIndex });
    try {
        const v = await kvs.get({ key });
        if (!v || !v[key]) {
            throw new Error('key not found in kvs');
        }
        logger.debug(`fetchCouponCode succeeded. key: ${key}, hashedUserId: ${hashedUserId}`);
        return { couponCode: v[key].value.coupon_code };
    } catch (err) {
        logger.error(`fetchCouponCode error. couponGroupId: ${couponGroupId}, couponIndex: ${couponIndex}, key: ${key}, hashedUserId: ${hashedUserId}, error: ${err.toString()}`)
        return { error: `fetch coupon code error.` };
    }
}
async function updateUserStatus({ couponGroupId, hashedUserId, kvs, logger }) {
    const key = couponUserStatusKey({ couponGroupId, hashedUserId });
    const couponAcquisitionDate = new Date();
    try {
        await kvs.write({
            key,
            value: { coupon_acquisition_date: couponAcquisitionDate },
            minutesToExpire: COUPON_USER_STATUS_EXPIRE_MINUTES,
        });
        logger.debug(`updateUserStatus succeeded. key: ${key}, couponAcquisitionDate: ${couponAcquisitionDate}`);
        return;
    } catch (err) {
        logger.error(`fetchUserStatus error. couponGroupId: ${couponGroupId}, hashedUserId: ${hashedUserId}, key: ${key}, couponAcquisitionDate: ${couponAcquisitionDate}, error: ${err.toString()}`)
        return; // エラー時もクーポン払い出し処理自体は止めず、エラーログ出力だけ行う
    }
}
async function fetchUserStatus({ couponGroupId, hashedUserId, kvs, logger }) {
    const key = couponUserStatusKey({ couponGroupId, hashedUserId });
    try {
        const v = await kvs.get({ key });

        // 初取得の場合はkvs上にレコードが存在しないのでnullを返す
        if (!v || !v[key]) {
            return { couponAcquisitionDate: null };
        }
        logger.debug(`fetchUserStatus succeeded. key: ${key}`);
        return { couponAcquisitionDate: v[key].value.coupon_acquisition_date };
    } catch (err) {
        logger.error(`fetchUserStatus error. couponGroupId: ${couponGroupId}, hashedUserId: ${hashedUserId}, key: ${key}, error: ${err.toString()}`)
        return { error: `fetch user status error.` };
    }
}
async function incrementAndFetchCouponIndex({ couponGroupId, hashedUserId, counter, logger }) {
    const key = couponIndexKey({ couponGroupId });
    try {
        const couponIndex = await counter.increment({ // keyが存在しない場合は0とみなされ、最初は1を返す
            key,
            secondsToExpire: COUPON_INDEX_EXPIRE_SECONDS,
        });
        logger.debug(`incrementAndFetchCouponIndex succeeded. key: ${key}, couponIndex: ${couponIndex}, hashedUserId: ${hashedUserId}`);
        return { couponIndex };
    } catch (err) {
        logger.error(`incrementAndFetchCouponIndex error. couponGroupId: ${couponGroupId}, key: ${key}, hashedUserId: ${hashedUserId}, error: ${err.toString()}`)
        return { error: `fetch coupon index error.` };
    }
}

export default async function (data, { MODULES }) {
    const { kvs, counter, initLogger } = MODULES;
    const logger = initLogger({ logLevel: LOG_LEVEL });

    // validation
    if (data.kind !== "karte/track-hook") {
        logger.error(new Error("invalid kind. expected: karte/track-hook"));
        return;
    }
    const body = data.jsonPayload.data.hook_data.body;
    if (typeof body !== 'object') {
        return { craft_status_code: 400, error: 'Invalid request body.' };
    }
    const { coupon_group_id: couponGroupId, user_id: userId } = body;
    if (!couponGroupId) return noRequiredParamErr('coupon_group_id');
    if (!userId) return noRequiredParamErr('user_id');
    const hashedUserId = murmurhash.v3(userId); // リスク軽減のためにuser_idはハッシュ化してから扱う

    // 前回の取得から一定時間経過しているかチェック
    if (FREQUENT_ACQUISITION_ERROR_MINUTES > 0) {
        const { couponAcquisitionDate, error: fetchUserStatusError } = await fetchUserStatus({ couponGroupId, hashedUserId, kvs, logger });
        if (fetchUserStatusError) { return { craft_status_code: 500, error: fetchUserStatusError }; }
        if (couponAcquisitionDate && isFrequentAcquisition({ couponAcquisitionDate, logger })) {
            logger.debug(`too frequent acquisition error.`);
            return { craft_status_code: 400, error: 'too frequent acquisition error.' };
        }    
    }

    // クーポン番号の取得
    const { couponIndex, error: incrementAndFetchCouponIndexError } = await incrementAndFetchCouponIndex({ couponGroupId, hashedUserId, counter, logger });
    if (incrementAndFetchCouponIndexError) { return { craft_status_code: 500, error: incrementAndFetchCouponIndexError }; }

    // ユーザーのクーポン取得日を更新
    if (FREQUENT_ACQUISITION_ERROR_MINUTES > 0) {
        await updateUserStatus({ couponGroupId, hashedUserId, kvs, logger });
    }

    // クーポンコードの取得
    const { couponCode, error: fetchCouponCodeError} = await fetchCouponCode({ couponGroupId, couponIndex, hashedUserId, kvs, logger });
    if (fetchCouponCodeError) { return { craft_status_code: 500, error: fetchCouponCodeError }; }
    return { craft_status_code: 200, coupon_code: couponCode };
}
