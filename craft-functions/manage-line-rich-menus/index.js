const LINE_CHANNEL_ACCESS_TOKEN = '<% LINE_CHANNEL_ACCESS_TOKEN %>';
const KEY_PREFIX = '<% KEY_PREFIX %>';
const SET_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/user/all/richmenu';
const GET_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/richmenu';
const GET_ALL_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/richmenu/list';
const DELETE_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/richmenu';
const DELETE_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/user/all/richmenu';
const DOWNLOAD_LINE_RICH_MENU_IMAGE_ENDPOINT_URL = 'https://api-data.line.me/v2/bot/richmenu';
const GET_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL = 'https://api.line.me/v2/bot/user/all/richmenu';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function setDefaultRichMenu(richMenuId, lineChannelAccessToken) {
  try {
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
  } catch (error) {
    throw new Error('Failed to set default rich menu');
  }
}

async function getLineRichMenu(richMenuId, lineChannelAccessToken, kvs) {
  try {
    const richMenuResponse = await fetch(`${GET_LINE_RICH_MENU_ENDPOINT_URL}/${richMenuId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
    });

    const richMenuImageResponse = await fetch(
      `${DOWNLOAD_LINE_RICH_MENU_IMAGE_ENDPOINT_URL}/${richMenuId}/content`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${lineChannelAccessToken}`,
        },
      }
    );

    const key = `${KEY_PREFIX}-${richMenuId}`;

    const kvsData = await kvs.get({
      key,
    });

    let userIds = [];

    if (kvsData[richMenuId]) {
      userIds = kvsData[richMenuId].value.userIds;
    }

    if (!richMenuResponse.ok) {
      throw new Error('Failed to get line rich menu');
    }

    const richMenuData = await richMenuResponse.json();
    const imageBuffer = await richMenuImageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    return { richMenuData, base64Image, userIds };
  } catch (error) {
    throw new Error('Failed to get line rich menu');
  }
}

async function getAllLineRichMenu(lineChannelAccessToken, kvs) {
  try {
    const richMenusResponse = await fetch(GET_ALL_LINE_RICH_MENU_ENDPOINT_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
    });

    const richMenus = await richMenusResponse.json();

    if (!richMenusResponse.ok) {
      throw new Error('Failed to get line rich menu');
    }

    const defaultRichMenuResponse = await fetch(GET_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
    });

    const defaultRichMenu = await defaultRichMenuResponse.json();
    const richMenusData = await Promise.all(
      richMenus.richmenus.map(async richMenu => {
        const key = `${KEY_PREFIX}-${richMenu.richMenuId}`;
        const kvsData = await kvs.get({
          key,
        });

        let menuType = 'default';
        if (richMenu.richMenuId === defaultRichMenu.richMenuId) {
          menuType = 'default';
        } else if (kvsData[key]) {
          menuType = 'user';
        } else {
          menuType = 'none';
        }

        return {
          ...richMenu,
          menuType,
        };
      })
    );
    return { richMenusData };
  } catch (error) {
    throw new Error('Failed to get all line rich menus');
  }
}

async function deleteLineRichMenu(richMenuId, lineChannelAccessToken) {
  try {
    const res = await fetch(`${DELETE_LINE_RICH_MENU_ENDPOINT_URL}/${richMenuId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete line rich menu');
    }
  } catch (error) {
    throw new Error('Failed to delete line rich menu');
  }
}

async function deleteDefaultLineRichMenu(lineChannelAccessToken) {
  try {
    const res = await fetch(DELETE_DEFAULT_LINE_RICH_MENU_ENDPOINT_URL, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to delete default line rich menu');
    }
  } catch (error) {
    throw new Error('Failed to delete default line rich menu');
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

    const lineChannelAccessToken = (
      await secret.get({
        keys: [LINE_CHANNEL_ACCESS_TOKEN],
      })
    )[LINE_CHANNEL_ACCESS_TOKEN];

    const richMenuId = req.query.id;
    switch (req.method) {
      case 'GET': {
        if (richMenuId) {
          const { richMenuData, base64Image, userIds } = await getLineRichMenu(
            richMenuId,
            lineChannelAccessToken,
            kvs
          );

          res.status(200).json({ message: 'success', richMenuData, base64Image, userIds });
        } else {
          const richMenuResponse = await getAllLineRichMenu(lineChannelAccessToken, kvs);
          res.status(200).json({ message: 'success', richMenuResponse });
        }
        break;
      }
      case 'POST': {
        await setDefaultRichMenu(richMenuId, lineChannelAccessToken);
        res.status(200).json({ message: 'success' });
        break;
      }

      case 'DELETE': {
        if (richMenuId) {
          await deleteLineRichMenu(richMenuId, lineChannelAccessToken);
        } else {
          await deleteDefaultLineRichMenu(lineChannelAccessToken);
        }
        
        res.status(200).json({ message: 'success' });
        break;
      }
      default:
        res.status(400).json({ message: 'Invalid request method' });
        break;
    }
  } catch (error) {
    logger.log('Unexpected error 500:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
