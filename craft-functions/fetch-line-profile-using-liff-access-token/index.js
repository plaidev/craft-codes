import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_LOGIN_CHANNEL_ID = '<% LINE_LOGIN_CHANNEL_ID %>';
const KVS_MINUTES_TO_EXPIRE = Number('<% KVS_MINUTES_TO_EXPIRE %>');
const ALLOWED_ORIGIN = '<% ALLOWED_ORIGIN %>';

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('base64');
}
function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}
function kvsKey(hashedLineId) {
  const SOLUTION_ID = 'line_user_data';
  const hash = generateHashPrefix(`${SOLUTION_ID}-${hashedLineId}`); // ホットスポット回避用のハッシュ値
  return `${hash}-${SOLUTION_ID}-${hashedLineId}`;
}

async function verifyAccessToken(accessToken, logger) {
  try {
    const res = await fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`, {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error(`verify request failed. status: ${res.statusText}, error: ${err}`);
      return false;
    }

    const r = await res.json();
    logger.debug(
      `verify request succeeded. client_id: ${r.client_id}, scope: ${r.scope}, expires_in: ${r.expires_in}`
    );
    if (r.client_id !== LINE_LOGIN_CHANNEL_ID) {
      logger.error(
        `LINE Login channel ID is invalid. expected: ${LINE_LOGIN_CHANNEL_ID}, received: ${r.client_id}`
      );
      return false;
    }
    if (r.expires_in <= 0) {
      logger.error(`access_token is alread expired.`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error(`verifyAccessToken failed: ${err}`);
    return false;
  }
}

async function fetchProfile(accessToken, logger) {
  try {
    const res = await fetch(`https://api.line.me/v2/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error(`fetchProfile failed. status: ${res.statusText}, error: ${err}`);
      return null;
    }

    const profile = await res.json();
    logger.debug(`profile: ${JSON.stringify(profile)}`);
    return profile;
  } catch (err) {
    logger.error(`fetchProfile failed: ${err}`);
    return null;
  }
}

// LINE ID毎にkvsでデータを管理するサンプルとして、pv数をincrementして返す
async function incrementPv(lineId, kvs, logger) {
  const hashedLineId = generateHash(lineId);
  const key = kvsKey(hashedLineId);

  const v = await kvs.get({ key });
  let pv = v[key]?.value?.pv || 0;
  pv += 1;
  await kvs.write({
    key,
    value: { pv },
    minutesToExpire: KVS_MINUTES_TO_EXPIRE,
  });
  logger.log(`incrementPv succeeded. kvsKey: ${key}, hashedLineId: ${hashedLineId}, pv: ${pv}`);

  return pv;
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;

  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', true);
    return res.status(204).send('');
  }

  // リクエストbodyからアクセストークンを取得
  const body = req.body;
  const accessToken = body.accessToken;

  // アクセストークンの有効性を検証
  const isValid = await verifyAccessToken(accessToken, logger);

  if (!isValid) return res.status(401).json({ message: 'accessToken is invalid' });

  // ユーザープロフィールを取得
  const profile = await fetchProfile(accessToken, logger);
  if (!profile) return res.status(500).json({ message: 'fail to fetch profile' });
  const lineId = profile.userId;

  // 当該LINE IDに対応する現在のpv数を取得
  const pv = await incrementPv(lineId, kvs, logger);

  // pv数を返却
  return res.json({ pv });
}
