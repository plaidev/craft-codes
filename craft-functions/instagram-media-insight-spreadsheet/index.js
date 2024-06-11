import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_ACCESS_TOKEN_SECRET = '<% INSTAGRAM_ACCESS_TOKEN_SECRET %>';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '<% INSTAGRAM_BUSINESS_ACCOUNT_ID %>';
const GRAPH_API_VERSION = '<% GRAPH_API_VERSION %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';

const HEADER_VALUES = [
  'ID',
  '投稿URL',
  '本文',
  '投稿日時',
  'インプレッション数',
  'リーチ数',
  'いいね数',
  'コメント数',
];

// スプレッドシートAPIのクライアントを作成する関数
async function createSheetsClient(saKeyJson) {
  const authClient = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const auth = await authClient.getClient();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  return sheets;
}

// メディア情報を取得する関数
async function getMediaInfo(businessAccountId, accessToken, logger) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${businessAccountId}/media?fields=id,permalink,caption,timestamp&access_token=${accessToken}`
    );
    const responseData = await response.json();
    return responseData.data;
  } catch (error) {
    logger.error('Error fetching media info', error);
    throw error;
  }
}

// メディアのインサイト情報を取得する関数
async function getMediaInsights(mediaId, accessToken, graphApiVersion, logger) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/${mediaId}/insights?metric=impressions,reach,likes,comments&access_token=${accessToken}`
    );
    const responseData = await response.json();
    const insights = {};
    responseData.data.forEach(item => {
      insights[item.name] = item.values[0].value;
    });
    return insights;
  } catch (error) {
    logger.error(`Error fetching insights for media ID ${mediaId}`, error);
    throw error;
  }
}

// スプレッドシートにデータを書き込む関数
async function writeToSheets(sheets, spreadsheetId, sheetName, mediaData, logger) {
  try {
    const values = [
      HEADER_VALUES,
      ...mediaData.map(media => [
        media.id,
        media.permalink,
        media.caption,
        media.timestamp,
        media.impressions,
        media.reach,
        media.likes,
        media.comments,
      ]),
    ];

    const resource = {
      values,
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      resource,
    });
  } catch (error) {
    logger.error('Error writing data to spreadsheet', error);
    throw error;
  }
}

// メイン関数
export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [SERVICE_ACCOUNT_KEY_SECRET, INSTAGRAM_ACCESS_TOKEN_SECRET],
    });
    const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
    const sheets = await createSheetsClient(saKeyJson);
    const accessToken = secrets[INSTAGRAM_ACCESS_TOKEN_SECRET];

    const mediaInfo = await getMediaInfo(INSTAGRAM_BUSINESS_ACCOUNT_ID, accessToken, logger);

    const insightsPromises = mediaInfo.map(async media => {
      const insights = await getMediaInsights(media.id, accessToken, GRAPH_API_VERSION, logger);
      return {
        ...media,
        impressions: insights.impressions,
        reach: insights.reach,
        likes: insights.likes,
        comments: insights.comments,
      };
    });

    const mediaData = await Promise.all(insightsPromises);

    await writeToSheets(sheets, SPREADSHEET_ID, SHEET_NAME, mediaData, logger);

    logger.log('Successfully wrote media insights to the spreadsheet');
  } catch (error) {
    logger.error('Error fetching media insights or writing to spreadsheet', error);
  }
}
