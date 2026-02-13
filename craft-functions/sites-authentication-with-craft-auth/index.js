import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const AUTH_KEY_SECRET = '<% AUTH_KEY_SECRET %>';
const AUTH_KEY_NAME = 'csp-key';
const URL_PREFIX = '<% URL_PREFIX %>';
const REQUIRED_ROLE = '<% REQUIRED_ROLE %>';
const EXPIRES_MINUTES = Number('<% EXPIRES_MINUTES %>');
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';

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
        displayName: authResult.user.displayName,
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

function generateSignedCookie(urlPrefix, keyName, base64Key, expirationTimeUnix) {
  const decodedKey = Buffer.from(base64Key, 'base64');
  const encodedUrlPrefix = Buffer.from(urlPrefix)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const input = `URLPrefix=${encodedUrlPrefix}:Expires=${expirationTimeUnix}:KeyName=${keyName}`;
  const hmac = crypto.createHmac('sha1', decodedKey);
  hmac.update(input);
  const signature = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_');

  return `Cloud-CDN-Cookie=${input}:Signature=${signature}`;
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());

  if (origins.includes(origin) || origins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }

  return false;
}

function hasRequiredRole(userRoles, requiredRole) {
  if (!requiredRole || requiredRole === '') {
    return true;
  }
  return userRoles.includes(requiredRole);
}

function getContentForUser(user, requiredRole) {
  if (!hasRequiredRole(user.roles, requiredRole)) {
    return {
      title: 'アクセス制限',
      description: `この画面を閲覧するには「${requiredRole}」のロールが必要です。管理者にロールの割り当てを依頼してください。現在のロール: ${user.roles}`,
      email: user.email,
      displayName: user.displayName,
    };
  }

  return {
    title: 'カスタム管理画面（サンプル）',
    description: '必要なroleを持つユーザーだけが閲覧できるカスタム管理画面（サンプル）です',
    email: user.email,
    displayName: user.displayName,
  };
}

async function handleSignIn(req, res, auth, secret, logger) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Validation error',
      error: 'email and password are required',
    });
  }

  try {
    const result = await auth.signIn({ email, password });

    if (!result.idToken) {
      const error = new Error('unexpected error. ID token not received.');
      error.status = 500;
      throw error;
    }

    const secrets = await secret.get({ keys: [AUTH_KEY_SECRET] });
    const base64Key = secrets[AUTH_KEY_SECRET];

    const expirationTimeUnix = Math.floor(Date.now() / 1000) + EXPIRES_MINUTES * 60;
    const signedCookie = generateSignedCookie(
      URL_PREFIX,
      AUTH_KEY_NAME,
      base64Key,
      expirationTimeUnix
    );

    return res.status(200).json({
      message: 'Sign in successful',
      result: {
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          roles: result.user.roles || [],
        },
        idToken: result.idToken,
        idTokenExpiresIn: result.expiresIn,
        refreshToken: result.refreshToken,
        signedCookie,
        signedCookieMaxAge: EXPIRES_MINUTES * 60,
      },
    });
  } catch (error) {
    logger.warn('Sign in error:', error);
    return res.status(error.status || 401).json({
      message: 'Sign in failed',
      error: error.message,
    });
  }
}

async function handleGetIdToken(req, res, auth, logger) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: 'Validation error',
      error: 'refreshToken is required',
    });
  }

  try {
    const result = await auth.getIdToken({ refreshToken });

    return res.status(200).json({
      message: 'ID token refreshed successfully',
      result: {
        idToken: result.idToken,
        idTokenExpiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    logger.warn('ID token refresh error:', error);
    return res.status(error.status || 401).json({
      message: 'ID token refresh failed',
      error: error.message,
    });
  }
}

async function handleGetContent(req, res, auth, logger) {
  const verifyResult = await verifyToken(auth, req.headers.authorization, logger);

  if (!verifyResult.success) {
    return res.status(verifyResult.status).json({
      message: 'Authorization required',
      error: verifyResult.error,
    });
  }

  const content = getContentForUser(verifyResult.user, REQUIRED_ROLE);

  return res.status(200).json({
    message: 'Content retrieved successfully',
    result: content,
  });
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { auth, initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const isOriginAllowed = setCorsHeaders(res, origin, ALLOWED_ORIGINS);
    if (isOriginAllowed) {
      return res.status(200).end();
    }
    logger.warn(`Origin not allowed: ${origin}`);
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (origin) {
    setCorsHeaders(res, origin, ALLOWED_ORIGINS);
  } else {
    // originがない場合は全て許可する設定があるかチェック
    setCorsHeaders(res, '*', ALLOWED_ORIGINS);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
      error: 'Only POST method is supported',
    });
  }

  try {
    const { action } = req.body;

    if (action === 'signin') {
      return await handleSignIn(req, res, auth, secret, logger);
    }
    if (action === 'getIdToken') {
      return await handleGetIdToken(req, res, auth, logger);
    }
    if (action === 'getContent') {
      return await handleGetContent(req, res, auth, logger);
    }
    return res.status(400).json({
      message: 'Invalid action',
      error: "action must be 'signin' or 'getContent'",
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}
