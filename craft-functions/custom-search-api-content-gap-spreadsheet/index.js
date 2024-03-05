import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GCP_API_KEY = '<% GCP_API_KEY %>';
const CUSTOM_SEARCH_ENGINE_ID = '<% CUSTOM_SEARCH_ENGINE_ID %>';
const TARGET_KEYWORD = '<% TARGET_KEYWORD %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const SEARCH_TARGET_SITES = '<% SEARCH_TARGET_SITES %>';
const MAX_RECORDS = '<% MAX_RECORDS %>';

async function fetchData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data. Status code: ${response.status}`);
  }

  return response.json();
}

// APIを使用するための認証情報を取得する関数
async function googleAuth(jsonKey) {
  const auth = new google.auth.JWT({
    email: jsonKey.client_email,
    key: jsonKey.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await auth.authorize();
  return auth;
}

function constructSearchUrl(apiKey, searchEngineId, keyword, site) {
  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: keyword,
    num: MAX_RECORDS,
  });

  // 特定のサイトを検索対象に指定する場合
  if (site) {
    params.append('siteSearch', site);
  }

  return `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
}

// ヘッダー行をスプレッドシートに設定する関数
async function setHeaderRow(spreadsheetId, range, headers, authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });
}

async function setupSpreadsheet(spreadsheetId, sheetName, authClient) {
  const domains = SEARCH_TARGET_SITES.split(',');
  const headers = ['No'].concat(domains);
  const headerRange = `${sheetName}!A1:Z1`;

  await setHeaderRow(spreadsheetId, headerRange, headers, authClient);

  const numbersColumn = Array.from({ length: MAX_RECORDS }, (_, i) => [i + 1]);
  const numbersRange = `${sheetName}!A2:A${MAX_RECORDS + 1}`;

  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: numbersRange,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: numbersColumn,
    },
  });
}

// スプレッドシートに結果を記入する関数
async function appendResultsToSpreadsheet(
  spreadsheetId,
  sheetName,
  searchResults,
  columnIndex,
  authClient
) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!B2:Z`,
  });

  const values = searchResults.map(item => [`${item.title}\n${item.link}\n${item.snippet}`]);

  const CodeOfB = 'B'.charCodeAt(0);
  const range = `${sheetName}!${String.fromCharCode(CodeOfB + columnIndex)}2:${String.fromCharCode(CodeOfB + columnIndex)}${1 + values.length}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
}

async function fetchAndAppendSearchResults(site, index, authClient, logger) {
  const urlWithParams = constructSearchUrl(
    GCP_API_KEY,
    CUSTOM_SEARCH_ENGINE_ID,
    TARGET_KEYWORD,
    site
  );

  try {
    const searchResults = await fetchData(urlWithParams);
    if (searchResults.items && searchResults.items.length > 0) {
      await appendResultsToSpreadsheet(
        SPREADSHEET_ID,
        SHEET_NAME,
        searchResults.items,
        index,
        authClient
      );
    } else {
      logger.info(`このサイトには該当コンテンツがありませんでした: ${site}`);
    }
  } catch (error) {
    logger.error(`このサイトでの検索時にエラーが発生しました。 ${site}: ${error.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const authClient = await googleAuth(jsonKey);

  await setupSpreadsheet(SPREADSHEET_ID, SHEET_NAME, authClient);

  const siteList = SEARCH_TARGET_SITES.split(',').map(site => site.trim());
  const searchPromises = siteList.map((site, index) =>
    fetchAndAppendSearchResults(site, index, authClient, logger)
  );

  await Promise.all(searchPromises);
}
