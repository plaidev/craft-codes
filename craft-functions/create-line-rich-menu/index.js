const LINE_CHANNEL_ACCESS_TOKEN = '<% LINE_CHANNEL_ACCESS_TOKEN %>';
const KVS_DATA_VALIDITY_MINUTE = '<% KVS_DATA_VALIDITY_MINUTE %>';
const KEY_PREFIX = '<% KEY_PREFIX %>';
const CREATE_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/richmenu';
const UPLOAD_LINE_RICH_MENU_IMAGE_ENDPOINT_URL = 'https://api-data.line.me/v2/bot/richmenu';
const SET_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/user/all/richmenu';
const SET_USER_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/richmenu/bulk/link';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
async function postLineRichMenuJson(richMenuJson, lineChannelAccessToken) {
  const res = await fetch(CREATE_LINE_RICH_MENU_ENDPOINT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    },
    body: JSON.stringify(richMenuJson),
  });

  if (!res.ok) {
    throw new Error('Failed to create rich menu');
  }

  const data = await res.json();
  return data.richMenuId;
}

async function uploadLineRichMenuImage(richMenuId, lineChannelAccessToken, imageBuffer) {
  const res = await fetch(`${UPLOAD_LINE_RICH_MENU_IMAGE_ENDPOINT_URL}/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    },
    body: imageBuffer,
  });

  if (!res.ok) {
    throw new Error('Failed to upload rich menu image');
  }
}

async function setDefaultRichMenu(richMenuId, lineChannelAccessToken) {
  const res = await fetch(`${SET_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL}/${richMenuId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to set default rich menu');
  }
}

async function setUserLineRichMenu(userIds, richMenuId, lineChannelAccessToken) {
  const res = await fetch(SET_USER_LINE_RICH_MENU_ENDPOINT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    },
    body: JSON.stringify({
      richMenuId,
      userIds,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to set user line rich menu');
  }
}

async function createLineRichMenu(richMenuJson, lineChannelAccessToken, imageBuffer, userIds, kvs) {
  try {
    const richMenuId = await postLineRichMenuJson(richMenuJson, lineChannelAccessToken);
    await uploadLineRichMenuImage(richMenuId, lineChannelAccessToken, imageBuffer);

    if (userIds.length > 0) {
      await setUserLineRichMenu(userIds, richMenuId, lineChannelAccessToken);
      await kvs.write({
        key: `${KEY_PREFIX}-${richMenuId}`,
        value: {
          userIds,
        },
        minutesToExpire: KVS_DATA_VALIDITY_MINUTE,
      });
    } else {
      await setDefaultRichMenu(richMenuId, lineChannelAccessToken);
    }
    return richMenuId;
  } catch (error) {
    throw new Error('createLineRichMenu error');
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, kvs } = MODULES;
  const logger = initLogger({ logLevel: 'INFO' });
  const { req, res } = data;

  try {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const lineChannelAccessToken = (
      await secret.get({
        keys: [LINE_CHANNEL_ACCESS_TOKEN],
      })
    )[LINE_CHANNEL_ACCESS_TOKEN];

    const richMenuJson = req.body.richMenuJson;
    const imageBuffer = Buffer.from(req.body.base64Image, 'base64');
    const userIds = req.body.userIds;
    await createLineRichMenu(richMenuJson, lineChannelAccessToken, imageBuffer, userIds, kvs);

    res.status(200).json({ message: 'success' });
  } catch (error) {
    logger.log('Unexpected error 500:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
