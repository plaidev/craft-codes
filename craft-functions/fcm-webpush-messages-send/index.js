import { initializeApp, getApps } from 'firebase-admin/app';
import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const FIREBASE_SERVICE_ACCOUNT_KEY_SECRET = '<% FIREBASE_SERVICE_ACCOUNT_KEY_SECRET %>';
const REQUEST_URI = '<% REQUEST_URI %>';

function createMessage(token, title, body, icon, link) {
  return {
    message: {
      token,
      data: {
        title,
        body,
        icon,
        link,
      },
    },
  };
}

async function getAccessToken(jsonKey) {
  const jwtClient = new google.auth.JWT(
    jsonKey.client_email,
    null,
    jsonKey.private_key,
    ['https://www.googleapis.com/auth/firebase.messaging'],
    null
  );

  try {
    const tokens = await jwtClient.authorize();
    return tokens.access_token;
  } catch (err) {
    throw new Error(`Failed to get access token: ${err.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  const [token, title, body, icon, link] = data.jsonPayload.data.value.split(',');

  if (getApps().length === 0) {
    initializeApp();
  }

  const secrets = await secret.get({ keys: [FIREBASE_SERVICE_ACCOUNT_KEY_SECRET] });
  const _jsonKey = secrets[FIREBASE_SERVICE_ACCOUNT_KEY_SECRET];
  const jsonKey = JSON.parse(_jsonKey);

  const message = createMessage(token, title, body, icon, link);

  try {
    const accessToken = await getAccessToken(jsonKey);
    const response = await fetch(REQUEST_URI, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const responseData = await response.json();

    if (response.ok) {
      logger.log('メッセージが送信されました。');
    } else {
      logger.error(`メッセージの送信に失敗しました。: ${JSON.stringify(responseData)}`);
    }
  } catch (error) {
    logger.error('メッセージの送信に失敗しました。', error);
  }
}
