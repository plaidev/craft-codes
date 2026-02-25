import { randomUUID, createHash } from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const CUSTOM_DOMAIN_BASE = '<% CUSTOM_DOMAIN_BASE %>';
const KVS_EXPIRE_MINUTES = Number('<% KVS_EXPIRE_MINUTES %>');
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';
const REQUIRED_ROLE = '<% REQUIRED_ROLE %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';

function generateHashPrefix(key) {
  const hashBase64 = createHash('sha256').update(key).digest('base64');
  return hashBase64.substring(4, 12);
}

function generateKvsKey(solutionId, shortId) {
  const recordName = shortId;
  const baseKey = `${solutionId}-${recordName}`;
  const hash = generateHashPrefix(baseKey);
  return `${hash}-${baseKey}`;
}

async function verifyToken(auth, authHeader, logger) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Bearer token must be provided',
        status: 401,
      };
    }

    const idToken = authHeader.replace('Bearer ', '');
    const authResult = await auth.verify({ idToken });

    return {
      success: true,
      user: {
        uid: authResult.user.uid,
        email: authResult.user.email,
        roles: authResult.user.roles || [],
      },
    };
  } catch (error) {
    logger.warn('Token verification error:', error);
    return {
      success: false,
      error: error.message,
      status: error.status || 401,
    };
  }
}

function hasRequiredRole(userRoles, requiredRole) {
  if (!requiredRole || requiredRole === '') return true;
  return userRoles.includes(requiredRole);
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  if (origins.includes(origin) || origins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return true;
  }
  return false;
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, auth } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const isOriginAllowed = setCorsHeaders(res, origin, ALLOWED_ORIGINS);
    if (isOriginAllowed) {
      return res.status(204).send('');
    }
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  setCorsHeaders(res, origin, ALLOWED_ORIGINS);

  try {
    const verifyResult = await verifyToken(auth, req.headers.authorization, logger);
    if (!verifyResult.success) {
      return res
        .status(verifyResult.status)
        .json({ message: 'Authorization required', error: verifyResult.error });
    }

    if (!hasRequiredRole(verifyResult.user.roles, REQUIRED_ROLE)) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: `Insufficient roles. Required: ${REQUIRED_ROLE}` });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { finalDestination } = body;

    if (!finalDestination) {
      return res
        .status(400)
        .json({ success: false, error: 'Bad Request: finalDestination is required' });
    }

    const shortId = randomUUID();
    const kvsKey = generateKvsKey(SOLUTION_ID, shortId);

    await kvs.write({
      key: kvsKey,
      value: { url: finalDestination },
      minutesToExpire: KVS_EXPIRE_MINUTES,
    });

    const shortenedUrl = `${CUSTOM_DOMAIN_BASE}?code=${shortId}`;

    res.status(200).json({
      success: true,
      shortId,
      shortenedUrl,
    });
  } catch (error) {
    logger.error('保存処理エラー:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
