const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_LOGIN_CHANNEL_ID = '<% LINE_LOGIN_CHANNEL_ID %>'; // LINEログインチャネルのチャネルID
const LINE_CHANNEL_SECRET_NAME = '<% LINE_CHANNEL_SECRET_NAME %>'; // シークレットマネージャーに登録したLINEログインチャネルシークレットの名前
const REDIRECT_URI = '<% REDIRECT_URI %>'; // LINEログイン後にリダイレクトされる画面のURL
const REF_TABLE_ID = '<% REF_TABLE_ID %>'; // 更新対象の紐付けテーブルID
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>'; // API v2アプリのトークンを登録したシークレット名
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>'; // 紐付けテーブル更新用ファンクションのID

// Webサイトから取得した認可コードを使ってIDトークンを取得する
async function fetchTokens(authorizationCode, clientSecret, logger) {
  try {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: REDIRECT_URI,
        client_id: LINE_LOGIN_CHANNEL_ID,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      logger.error(`Failed to fetch tokens: status: ${tokenResponse.statusText}, error: ${err}`);
      return null;
    }

    const tokenData = await tokenResponse.json();
    return tokenData;
  } catch (error) {
    logger.error(`Error fetching tokens: ${error.message}`);
    throw error;
  }
}

// IDトークンを使ってLINE IDを取得する
async function verifyIdToken(idToken, logger) {
  try {
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: LINE_LOGIN_CHANNEL_ID,
      }),
    });

    if (!verifyResponse.ok) {
      const err = await verifyResponse.text();
      logger.error(`Failed to verify token: status: ${verifyResponse.statusText}, error: ${err}`);
      return null;
    }

    const verifyData = await verifyResponse.json();
    return verifyData.sub;
  } catch (error) {
    logger.error(`Error verifying ID token: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, craftFunctions } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const secrets = await secret.get({ keys: [LINE_CHANNEL_SECRET_NAME] });
    const clientSecret = secrets[LINE_CHANNEL_SECRET_NAME];

    const { authorizationCode, websiteUserId } = req.body;
    if (!authorizationCode || !websiteUserId) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const tokenData = await fetchTokens(authorizationCode, clientSecret, logger);
    if (!tokenData) return res.status(400).json({ message: 'Line token fetch failed' });

    const retrievedLineId = await verifyIdToken(tokenData.id_token, logger);
    if (!retrievedLineId) return res.status(401).json({ message: 'Line ID verify failed' });

    await craftFunctions.invoke({
      functionId: TARGET_FUNCTION_ID,
      data: {
        apiUrl: 'https://api.karte.io/v2beta/track/refTable/row/upsert',
        tokenSecretName: KARTE_APP_TOKEN_SECRET,
        parameters: {
          id: REF_TABLE_ID,
          rowKey: { user_id: websiteUserId },
          values: { line_id: retrievedLineId },
        },
        retryTimeoutSec: 3600,
      },
    });

    res.status(200).json({ message: 'Processing started' });
  } catch (err) {
    logger.error(`Error: ${err.toString()}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
