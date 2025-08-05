import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_LOGIN_CHANNEL_ID = '<% LINE_LOGIN_CHANNEL_ID %>'; // LINEログインチャネルのチャネルID
const LINE_CHANNEL_SECRET_NAME = '<% LINE_CHANNEL_SECRET_NAME %>'; // シークレットマネージャーに登録したLINEログインチャネルシークレットの名前
const REDIRECT_URI = '<% REDIRECT_URI %>'; // LINEログイン後にリダイレクトされる画面のURL
const REF_TABLE_ID = '<% REF_TABLE_ID %>'; // 紐付けテーブルのテーブルID
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>'; // API v2アプリのトークンを登録したシークレット

const sdk = api('@dev-karte/v1.0#4013y24lvyu582u');

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

// 紐付けテーブルにデータを投入する
async function upsertKarteRefTable(websiteUserId, lineId, logger) {
  try {
    const response = await sdk.postV2betaTrackReftableRowUpsert({
      id: REF_TABLE_ID,
      rowKey: { user_id: websiteUserId },
      values: { line_id: lineId },
    });

    return response;
  } catch (error) {
    logger.error(`Error upserting KARTE ref table: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const secrets = await secret.get({
      keys: [KARTE_APP_TOKEN_SECRET, LINE_CHANNEL_SECRET_NAME],
    });

    const karteToken = secrets[KARTE_APP_TOKEN_SECRET];
    const clientSecret = secrets[LINE_CHANNEL_SECRET_NAME];
    sdk.auth(karteToken);

    const { authorizationCode, websiteUserId } = req.body;

    if (!authorizationCode || !websiteUserId) {
      logger.warn('Missing authorizationCode or websiteUserId');
      res.status(400).json({ message: 'Missing authorizationCode or websiteUserId' });
      return;
    }

    const tokenData = await fetchTokens(authorizationCode, clientSecret, logger);
    if (!tokenData) {
      res.status(400).json({ message: 'Error in fetchTokens' });
      return;
    }

    const { id_token: idToken } = tokenData;

    const retrievedLineId = await verifyIdToken(idToken, logger);
    if (!retrievedLineId) {
      res.status(401).json({ message: 'Error in verifyIdToken' });
      return;
    }

    await upsertKarteRefTable(websiteUserId, retrievedLineId, logger);

    res.status(200).json({ message: 'Data inserted successfully' });
  } catch (err) {
    logger.error(`Error in lineid mapping process: ${err.toString()}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
