import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const AUTH_KEY_SECRET = '<% AUTH_KEY_SECRET %>';
const AUTH_KEY_NAME = '<% AUTH_KEY_NAME %>';
const AUTH_ENDPOINT_URL = '<% AUTH_ENDPOINT_URL %>';
const ALLOWED_ORIGIN = '<% ALLOWED_ORIGIN %>';

async function signin(username, password, logger) {
  try {
    const response = await fetch(AUTH_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signin',
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Authentication server error: ${errorData.error || 'Unknown error'}`);
      return {
        isValid: false,
        error: errorData.error || 'Authentication failed due to server error',
      };
    }

    const data = await response.json();
    const jwt = data.result.token;
    if (!jwt) {
      logger.error('no jwt token');
      return {
        isValid: false,
        error: 'Authentication failed due to server error',
      };
    }
    return { isValid: true, jwt };
  } catch (error) {
    logger.error(`Error in authentication request: ${error.toString()}`);
    throw error;
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

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;

  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', true);
    return res.status(204).send('');
  }

  const body = req.body;

  const { urlPrefix, expiredSeconds, username, password } = body;

  if (!urlPrefix)
    return res.status(400).json({ error: 'urlPrefix is required in the request body.' });
  if (!username)
    return res.status(400).json({ error: 'username is required in the request body.' });
  if (!password)
    return res.status(400).json({ error: 'password is required in the request body.' });

  const _expiredSeconds = expiredSeconds || 600;

  const secrets = await secret.get({ keys: [AUTH_KEY_SECRET] });

  // 入力されたログイン情報をチェック
  const signinResult = await signin(username, password, logger);
  if (!signinResult.isValid) {
    return res.status(401).json({ error: 'usernameまたはpasswordが間違っています' });
  }

  // 署名鍵の値を取得する
  const base64Key = secrets[AUTH_KEY_SECRET];

  const expirationTimeUnix = Math.floor(Date.now() / 1000) + _expiredSeconds;
  const signedCookie = generateSignedCookie(
    urlPrefix,
    AUTH_KEY_NAME,
    base64Key,
    expirationTimeUnix
  );

  return res.json({ signedCookie, jwt: signinResult.jwt });
}
