import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GCP_API_KEY = '<% GCP_API_KEY %>';
const CUSTOM_SEARCH_ENGINE_ID = '<% CUSTOM_SEARCH_ENGINE_ID %>';
const TARGET_KEYWORD = '<% TARGET_KEYWORD %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const MAX_RECORDS = '<% MAX_RECORDS %>';

async function googleAuth(jsonKey) {
  const auth = new google.auth.GoogleAuth({
    credentials: jsonKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return authClient;
}

// 特定のキーワードでの検索結果を取得する関数
async function getSearchResults(apiKey, searchEngineId, keyword, logger) {
  const customSearch = google.customsearch('v1');
  try {
    const res = await customSearch.cse.list({
      key: apiKey,
      cx: searchEngineId,
      q: keyword,
      num: MAX_RECORDS,
    });
    return res.data.items || [];
  } catch (error) {
    logger.error('検索結果の取得に失敗しました:', error.message);
    return null;
  }
}

// スプレッドシートにヘッダーとデータを書き込む関数
async function writeToSpreadsheet(spreadsheetId, sheetName, searchResults, authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const dataRows = searchResults.map((result, index) => [
    index + 1,
    result.link,
    result.title,
    result.snippet,
  ]);

  const headers = [['順位', 'URL', 'タイトル', 'ディスクリプション']];

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:D1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: headers },
  });

  if (dataRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2:D${dataRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: dataRows },
    });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const authClient = await googleAuth(jsonKey);

  const searchResults = await getSearchResults(
    GCP_API_KEY,
    CUSTOM_SEARCH_ENGINE_ID,
    TARGET_KEYWORD,
    logger
  );
  if (!searchResults) {
    logger.error('検索結果を取得できませんでした');
    return;
  }

  await writeToSpreadsheet(SPREADSHEET_ID, SHEET_NAME, searchResults, authClient);
}
