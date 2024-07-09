import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_APP_ID = '<% INSTAGRAM_APP_ID %>';
const INSTAGRAM_APP_SECRET = '<% INSTAGRAM_APP_SECRET %>';
const REDIRECT_URI = '<% REDIRECT_URI %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const KARTE_API_TOKEN_SECRET = '<% KARTE_API_TOKEN_SECRET %>';

const sdk = api('@dev-karte/v1.0#4013y24lvyu582u');
const requestUrl = 'https://api.instagram.com/oauth/access_token';

// Instagramのアクセストークンを取得する
async function fetchInstagramAccessToken(authorizationCode, appSecret, logger) {
  const fd = new URLSearchParams({
    code: authorizationCode,
    client_id: INSTAGRAM_APP_ID,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });

  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fd.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const body = await res.json();
    return body;
  } catch (error) {
    logger.error('Failed to fetch access token:', error.message);
    throw error;
  }
}

// Instagramのユーザー情報を取得する
async function fetchInstagramUserInfo(instagramUserId, accessToken, logger) {
  const userInfoUrl = `https://graph.instagram.com/${instagramUserId}?fields=id,username&access_token=${accessToken}`;

  try {
    const userInfoRes = await fetch(userInfoUrl);

    if (!userInfoRes.ok) {
      const errorText = await userInfoRes.text();
      throw new Error(errorText);
    }

    const userInfo = await userInfoRes.json();
    return userInfo;
  } catch (error) {
    logger.error('Failed to fetch user info:', error.message);
    throw error;
  }
}

// 紐付けテーブルにデータを投入する
async function upsertKarteRefTable(websiteUserId, instagramUserId, instagramUserName, logger) {
  try {
    await sdk.postV2betaTrackReftableRowUpsert({
      id: REF_TABLE_ID,
      rowKey: { user_id: websiteUserId },
      values: { instagram_id: instagramUserId, instagram_user_name: instagramUserName },
    });
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
      keys: [KARTE_API_TOKEN_SECRET, INSTAGRAM_APP_SECRET],
    });

    const karteToken = secrets[KARTE_API_TOKEN_SECRET];
    sdk.auth(karteToken);
    const appSecret = secrets[INSTAGRAM_APP_SECRET];

    const { authorizationCode, websiteUserId } = req.body;

    const { access_token: accessToken, user_id: instagramUserId } = await fetchInstagramAccessToken(
      authorizationCode,
      appSecret,
      logger
    );
    const { username: instagramUserName } = await fetchInstagramUserInfo(
      instagramUserId,
      accessToken,
      logger
    );
    await upsertKarteRefTable(websiteUserId, instagramUserId, instagramUserName, logger);

    res.status(200).json({ message: 'Successfully sent data to the endpoint' });
  } catch (error) {
    logger.error('Failed to process Instagram authentication:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}