// =================================================================
// GET:  Sites から購読状態を取得（JSON）
// POST: 次の2パターンを同一 Function で処理
//   - Sites からの設定保存（JSON body）
//   - メーラーのワンクリック購読解除（RFC 8058 / List-Unsubscribe=One-Click）
// =================================================================
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const HMAC_SECRET_NAME = '<% HMAC_SECRET_NAME %>';
const INTERNAL_API_URL = '<% INTERNAL_API_URL %>';
const INTERNAL_API_UPDATE_URL = '<% INTERNAL_API_UPDATE_URL %>';
const CORS_ALLOWED_ORIGINS = '<% CORS_ALLOWED_ORIGINS %>'
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// 自社 API が返す / 受け取るユーザー情報の形
// { email: string, subscribed: boolean }

// =============================================================================
// 共通ユーティリティ
// =============================================================================

function maskUserIdForLog(userId) {
  const id = String(userId);
  if (!id) {
    return '****';
  }
  if (id.length <= 4) {
    return '****';
  }
  return `****${id.slice(-4)}`;
}

function maskEmail(email) {
  const at = email.indexOf('@');
  if (at < 1) return email;
  return `${email.charAt(0)}••••@${email.slice(at + 1)}`;
}

function verifyUserToken(userId, userToken, secret) {
  // user_token = HMAC-SHA256(共有シークレット, user_id) であることを検証
  const expected = crypto.createHmac('sha256', secret).update(userId).digest('hex');
  const expectedBuf = Buffer.from(expected.toLowerCase(), 'utf8');
  const actualBuf = Buffer.from(userToken.toLowerCase(), 'utf8');

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

// RFC 8058: メーラーからのワンクリック購読解除リクエストか判定
function isOneClickUnsubscribe(req, rawBody) {
  const rawBodyStr = typeof rawBody === 'string' ? rawBody : '';
  return (
    req.body?.['List-Unsubscribe'] === 'One-Click' ||
    rawBodyStr.includes('List-Unsubscribe=One-Click') ||
    (
      rawBodyStr.includes('name="List-Unsubscribe"') &&
      rawBodyStr.includes('One-Click')
    )
  );
}

function setCorsHeaders(req, res) {
  const origin = req.get('origin');
  if (!origin || !CORS_ALLOWED_ORIGINS.includes(origin)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getHmacSecret(secretModule) {
  const secrets = await secretModule.get({ keys: [HMAC_SECRET_NAME] });
  const hmacSecret = secrets[HMAC_SECRET_NAME];
  if (!hmacSecret) {
    throw new Error(`Secret "${HMAC_SECRET_NAME}" is not set`);
  }
  return hmacSecret;
}

// =============================================================================
// 自社 API クライアント
// URL・認証・レスポンス形式を自社仕様に合わせて調整してください。
// =============================================================================

function buildInternalApiUrl(urlTemplate, userId) {
  // {user_id} を実際の user_id に置換
  return urlTemplate.replace('{user_id}', encodeURIComponent(userId));
}

function parseSubscriptionResponse(data) {
  if (
    !data ||
    typeof data.email !== 'string' ||
    typeof data.subscribed !== 'boolean'
  ) {
    throw new Error('Invalid subscription response');
  }
  return {
    email: data.email,
    subscribed: data.subscribed,
  };
}

async function fetchSubscription(userId, logger) {
  if (!INTERNAL_API_URL) {
    logger.error('INTERNAL_API_URL is not configured');
    throw new Error('Internal API is not configured');
  }

  const url = buildInternalApiUrl(INTERNAL_API_URL, userId);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${apiKey}`, // 認証が必要な場合（secret.get で取得）
      },
    });
  } catch (error) {
    logger.error(`Internal API GET network error: user_id=${maskUserIdForLog(userId)}, message=${error.message}`);
    throw error;
  }

  if (response.status === 404) {
    logger.warn(`Internal API GET not found: user_id=${maskUserIdForLog(userId)}`);
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error(
      `Internal API GET failed: user_id=${maskUserIdForLog(userId)}, status=${response.status}, body=${body}`
    );
    throw new Error(`Internal API error: ${response.status}`);
  }

  const data = await response.json();
  const user = parseSubscriptionResponse(data);
  return user;
}

async function updateSubscription(userId, subscribed, logger) {
  const updateUrlTemplate = INTERNAL_API_UPDATE_URL || INTERNAL_API_URL;
  if (!updateUrlTemplate) {
    logger.error('INTERNAL_API_URL is not configured');
    throw new Error('Internal API is not configured');
  }

  const url = buildInternalApiUrl(updateUrlTemplate, userId);

  let response;
  try {
    response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${apiKey}`, // 認証が必要な場合（secret.get で取得）
      },
      body: JSON.stringify({ subscribed }),
    });
  } catch (error) {
    logger.error(`Internal API PATCH network error: user_id=${maskUserIdForLog(userId)}, message=${error.message}`);
    throw error;
  }

  if (response.status === 404) {
    logger.warn(`Internal API PATCH not found: user_id=${maskUserIdForLog(userId)}`);
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error(
      `Internal API PATCH failed: user_id=${maskUserIdForLog(userId)}, status=${response.status}, body=${body}`
    );
    throw new Error(`Internal API error: ${response.status}`);
  }

  const data = await response.json();
  const user = parseSubscriptionResponse(data);
  return user;
}

// =============================================================================
// HTTP ハンドラ（Sites / ワンクリック購読解除）
// =============================================================================

async function handleGet(req, res, hmacSecret, logger) {
  const userId = String(req.query?.user_id || '');
  const userToken = String(req.query?.user_token || '');

  if (!userId || !userToken) {
    logger.warn('Missing user_id or user_token');
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  if (!verifyUserToken(userId, userToken, hmacSecret)) {
    logger.warn(`Invalid user_token for user_id=${maskUserIdForLog(userId)}`);
    res.status(403).json({ error: 'invalid_token' });
    return;
  }

  try {
    const user = await fetchSubscription(userId, logger);

    if (!user?.email) {
      logger.warn(`User not found: user_id=${maskUserIdForLog(userId)}`);
      res.status(404).json({ error: 'user_not_found' });
      return;
    }

    res.status(200).json({
      maskedEmail: maskEmail(user.email),
      subscribed: user.subscribed,
    });
  } catch (error) {
    logger.error(`Failed to fetch user data: ${error.message}`);
    res.status(500).json({ error: 'internal_error' });
  }
}

// メールヘッダ List-Unsubscribe の POST 先（クエリに user_id / user_token）
async function handleOneClickPost(req, res, hmacSecret, logger) {
  const userId = String(req.query?.user_id || '');
  const userToken = String(req.query?.user_token || '');

  if (!userId || !userToken) {
    logger.warn('One-click: missing user_id or user_token in query');
    res.status(400).send('Bad Request');
    return;
  }

  if (!verifyUserToken(userId, userToken, hmacSecret)) {
    logger.warn(`One-click: invalid user_token for user_id=${maskUserIdForLog(userId)}`);
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const user = await updateSubscription(userId, false, logger);

    // ワンクリック購読解除はメーラーに email を返さないため、存在確認は user の有無のみ
    if (!user) {
      logger.warn(`One-click: user not found: user_id=${maskUserIdForLog(userId)}`);
      res.status(404).send('Not Found');
      return;
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error(`One-click opt-out failed: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
}

async function handleSettingsPost(req, res, hmacSecret, logger) {
  const userId = String(req.body?.user_id || '');
  const userToken = String(req.body?.user_token || '');
  const subscribed = req.body?.subscribed;

  if (!userId || !userToken || typeof subscribed !== 'boolean') {
    logger.warn('Invalid POST body');
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  if (!verifyUserToken(userId, userToken, hmacSecret)) {
    logger.warn(`Invalid user_token for user_id=${maskUserIdForLog(userId)}`);
    res.status(403).json({ error: 'invalid_token' });
    return;
  }

  try {
    const user = await updateSubscription(userId, subscribed, logger);

    if (!user?.email) {
      logger.warn(`User not found: user_id=${maskUserIdForLog(userId)}`);
      res.status(404).json({ error: 'user_not_found' });
      return;
    }

    res.status(200).json({
      maskedEmail: maskEmail(user.email),
      subscribed: user.subscribed,
    });
  } catch (error) {
    logger.error(`Failed to update user data: ${error.message}`);
    res.status(500).json({ error: 'internal_error' });
  }
}

async function handlePost(req, res, hmacSecret, logger) {
  const rawBody = req.rawBody?.toString?.('utf8') || '';

  if (isOneClickUnsubscribe(req, rawBody)) {
    await handleOneClickPost(req, res, hmacSecret, logger);
    return;
  }

  await handleSettingsPost(req, res, hmacSecret, logger);
}


// =============================================================================
// エントリポイント
// =============================================================================

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let hmacSecret;
  try {
    hmacSecret = await getHmacSecret(secret);
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ error: 'internal_error' });
    return;
  }

  if (req.method === 'GET') {
    await handleGet(req, res, hmacSecret, logger);
    return;
  }

  await handlePost(req, res, hmacSecret, logger);
}
