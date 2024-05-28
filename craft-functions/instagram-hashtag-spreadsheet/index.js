import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_ACCESS_TOKEN_SECRET = '<% INSTAGRAM_ACCESS_TOKEN_SECRET %>';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '<% INSTAGRAM_BUSINESS_ACCOUNT_ID %>';
const GRAPH_API_VERSION = '<% GRAPH_API_VERSION %>';
const HASHTAG = '<% HASHTAG %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';

// 定数の定義
const SHEET_HEADER_RANGE = 'A1:G1';
const SHEET_HEADER_VALUES = [
  '投稿ID',
  '投稿日時',
  '投稿URL',
  '画像URL',
  '投稿テキスト',
  'いいね数',
  'コメント数',
];
const SHEET_DATA_START_RANGE = 'A2';

// JSONデータをフェッチする共通関数
async function fetchJson(url, params, logger) {
  try {
    const response = await fetch(`${url}?${params}`, { method: 'GET' });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Error fetching or parsing response:', error);
    throw error;
  }
}

// ハッシュタグIDを取得する関数
async function fetchHashtagId({ apiVersion, businessAccountId, hashtag, accessToken, logger }) {
  const hashtagUrl = `https://graph.facebook.com/${apiVersion}/ig_hashtag_search`;
  const hashtagParams = new URLSearchParams({
    user_id: businessAccountId,
    q: hashtag,
    access_token: accessToken,
  });
  const response = await fetchJson(hashtagUrl, hashtagParams, logger);
  const hashtagId = response.data?.[0]?.id;
  if (!hashtagId) {
    throw new Error('No hashtag ID found in response');
  }
  return hashtagId;
}

// ハッシュタグに関連する投稿を取得する関数
async function fetchMediaDetails({
  apiVersion,
  hashtagId,
  businessAccountId,
  accessToken,
  logger,
}) {
  const mediaUrl = `https://graph.facebook.com/${apiVersion}/${hashtagId}/recent_media`;
  const mediaParams = new URLSearchParams({
    user_id: businessAccountId,
    fields: 'id,timestamp,media_url,permalink,comments_count,like_count,caption',
    access_token: accessToken,
  });
  const response = await fetchJson(mediaUrl, mediaParams, logger);
  const mediaPosts = response.data;
  if (!mediaPosts?.length) {
    throw new Error('No media details found in response');
  }
  return mediaPosts;
}

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

// スプレッドシートにヘッダーとハッシュタグ検索で取得したデータを書き込む関数
async function writeToSpreadsheet(sheets, spreadsheetId, sheetName, mediaDetails, logger) {
  try {
    // ヘッダー行を設定する
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `${sheetName}!${SHEET_HEADER_RANGE}`,
            values: [SHEET_HEADER_VALUES],
          },
        ],
      },
    });

    // ハッシュタグ検索で取得した結果を書き込む
    const values = mediaDetails.map(item => [
      item.id,
      item.timestamp,
      item.permalink,
      item.media_url,
      item.caption,
      item.like_count,
      item.comments_count,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!${SHEET_DATA_START_RANGE}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values,
      },
    });
  } catch (error) {
    logger.error('Error writing to spreadsheet:', error);
    throw error;
  }
}

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

    const hashtagId = await fetchHashtagId({
      apiVersion: GRAPH_API_VERSION,
      businessAccountId: INSTAGRAM_BUSINESS_ACCOUNT_ID,
      hashtag: HASHTAG,
      accessToken,
      logger,
    });
    const mediaDetails = await fetchMediaDetails({
      apiVersion: GRAPH_API_VERSION,
      hashtagId,
      businessAccountId: INSTAGRAM_BUSINESS_ACCOUNT_ID,
      accessToken,
      logger,
    });

    if (!mediaDetails || mediaDetails.length === 0) {
      throw new Error('No media details retrieved');
    }

    await writeToSpreadsheet(sheets, SPREADSHEET_ID, SHEET_NAME, mediaDetails, logger);

    logger.log('Media details successfully written to spreadsheet:', mediaDetails);
  } catch (error) {
    logger.error('An error occurred in the main function:', error);
  }
}
