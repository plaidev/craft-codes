import crypto from 'crypto';
import { differenceInMinutes } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const FREQUENT_ACQUISITION_ERROR_MINUTES = Number('<% FREQUENT_ACQUISITION_ERROR_MINUTES %>');
const COUPON_INDEX_EXPIRE_SECONDS = Number('<% COUPON_INDEX_EXPIRE_SECONDS %>');
const SOLUTION_ID = '<% SOLUTION_ID %>';

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('base64');
}

function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

function kvsKey(recordName) {
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${recordName}`);
  return `${hash}-${solutionId}-${recordName}`;
}

function couponCodeKey({ couponGroupId, couponIndex }) {
  const recordName = `code_${couponGroupId}_${couponIndex}`;
  return kvsKey(recordName);
}

function couponUserStatusKey({ couponGroupId, hashedUserId }) {
  const recordName = `user_${couponGroupId}_${hashedUserId}`;
  return kvsKey(recordName);
}

function couponIndexKey({ couponGroupId }) {
  return `${SOLUTION_ID}-index_${couponGroupId}`;
}

function isFrequentAcquisition({ couponAcquisitionDate, logger }) {
  if (!couponAcquisitionDate) return false;
  const currentDate = new Date();
  const diff = differenceInMinutes(currentDate, new Date(couponAcquisitionDate), 'floor');
  logger.debug(
    `couponAcquisitionDate: ${couponAcquisitionDate}, currentDate: ${currentDate.toISOString()}, diff: ${diff}`
  );
  return diff < FREQUENT_ACQUISITION_ERROR_MINUTES;
}

function noRequiredParamErr(param) {
  return { status: 400, error: `"${param}" is required in the request body.` };
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
    logger.error(
      `fetchCouponCode error. couponGroupId: ${couponGroupId}, couponIndex: ${couponIndex}, key: ${key}, hashedUserId: ${hashedUserId}, error: ${err.toString()}`
    );
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
      minutesToExpire: FREQUENT_ACQUISITION_ERROR_MINUTES,
    });
    logger.debug(
      `updateUserStatus succeeded. key: ${key}, couponAcquisitionDate: ${couponAcquisitionDate}`
    );
  } catch (err) {
    logger.error(
      `fetchUserStatus error. couponGroupId: ${couponGroupId}, hashedUserId: ${hashedUserId}, key: ${key}, couponAcquisitionDate: ${couponAcquisitionDate}, error: ${err.toString()}`
    );
  }
}

async function fetchUserStatus({ couponGroupId, hashedUserId, kvs, logger }) {
  const key = couponUserStatusKey({ couponGroupId, hashedUserId });
  try {
    const v = await kvs.get({ key });

    if (!v || !v[key]) {
      return { couponAcquisitionDate: null };
    }
    logger.debug(`fetchUserStatus succeeded. key: ${key}`);
    return { couponAcquisitionDate: v[key].value.coupon_acquisition_date };
  } catch (err) {
    logger.error(
      `fetchUserStatus error. couponGroupId: ${couponGroupId}, hashedUserId: ${hashedUserId}, key: ${key}, error: ${err.toString()}`
    );
    return { error: `fetch user status error.` };
  }
}

async function incrementAndFetchCouponIndex({ couponGroupId, hashedUserId, counter, logger }) {
  const key = couponIndexKey({ couponGroupId });
  try {
    const couponIndex = await counter.increment({
      key,
      secondsToExpire: COUPON_INDEX_EXPIRE_SECONDS,
    });
    logger.debug(
      `incrementAndFetchCouponIndex succeeded. key: ${key}, couponIndex: ${couponIndex}, hashedUserId: ${hashedUserId}`
    );
    return { couponIndex };
  } catch (err) {
    logger.error(
      `incrementAndFetchCouponIndex error. couponGroupId: ${couponGroupId}, key: ${key}, hashedUserId: ${hashedUserId}, error: ${err.toString()}`
    );
    return { error: `fetch coupon index error.` };
  }
}

export default async function (data, { MODULES }) {
  const { kvs, counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const body = req.body;
  if (typeof body !== 'object') {
    res.status(400).send({ error: 'Invalid request body.' });
    return;
  }

  const { coupon_group_id: couponGroupId, user_id: userId } = body;
  if (!couponGroupId) {
    res.status(400).send(noRequiredParamErr('coupon_group_id'));
    return;
  }
  if (!userId) {
    res.status(400).send(noRequiredParamErr('user_id'));
    return;
  }
  const hashedUserId = generateHash(userId);

  if (FREQUENT_ACQUISITION_ERROR_MINUTES > 0) {
    const { couponAcquisitionDate, error: fetchUserStatusError } = await fetchUserStatus({
      couponGroupId,
      hashedUserId,
      kvs,
      logger,
    });
    if (fetchUserStatusError) {
      res.status(500).send({ error: fetchUserStatusError });
      return;
    }
    if (couponAcquisitionDate && isFrequentAcquisition({ couponAcquisitionDate, logger })) {
      logger.debug(`too frequent acquisition error.`);
      res.status(400).send({ error: 'too frequent acquisition error.' });
      return;
    }
  }

  const { couponIndex, error: incrementAndFetchCouponIndexError } =
    await incrementAndFetchCouponIndex({ couponGroupId, hashedUserId, counter, logger });
  if (incrementAndFetchCouponIndexError) {
    res.status(500).send({ error: incrementAndFetchCouponIndexError });
    return;
  }

  if (FREQUENT_ACQUISITION_ERROR_MINUTES > 0) {
    await updateUserStatus({ couponGroupId, hashedUserId, kvs, logger });
  }

  const { couponCode, error: fetchCouponCodeError } = await fetchCouponCode({
    couponGroupId,
    couponIndex,
    hashedUserId,
    kvs,
    logger,
  });
  if (fetchCouponCodeError) {
    res.status(500).send({ error: fetchCouponCodeError });
    return;
  }
  res.status(200).send({ coupon_code: couponCode });
}