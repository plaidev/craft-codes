import { google } from 'googleapis';
import { auth } from 'google-auth-library';
import { subDays, format } from 'date-fns';
import { JSDOM } from 'jsdom';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const GCP_API_KEY = '<% GCP_API_KEY %>';
const SITE_URL = '<% SITE_URL %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const LOWER_LIMIT_IMPRESSIONS = '<% LOWER_LIMIT_IMPRESSIONS %>';

// APIを使用するための認証情報を取得する関数
async function googleAuth(jsonKey) {
  const authClient = new google.auth.JWT({
    email: jsonKey.client_email,
    key: jsonKey.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await authClient.authorize(); // JWT クライアントを認証する
  return authClient;
}

// PageSpeed Insights API URLを構築する関数
function buildPageSpeedApiUrl(pageUrl, strategy) {
  const apiURL = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiURL.searchParams.append('url', pageUrl);
  apiURL.searchParams.append('key', GCP_API_KEY);
  apiURL.searchParams.append('strategy', strategy);
  return apiURL.href;
}

// Search Consoleの認証処理
async function createSearchConsoleClient(saKeyJson) {
  const client = auth.fromJSON(saKeyJson);
  client.scopes = ['https://www.googleapis.com/auth/webmasters'];
  await client.authorize();

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth: client,
  });

  return searchConsole;
}

// 開始日と終了日の取得を行う関数
function getStartDateAndEndDate(dayBeforeEndDate) {
  const today = new Date();
  // 3日前の日付をendDateとして取得
  const endDate = format(subDays(today, 3), 'yyyy-MM-dd');
  // endDateからdayBeforeEndDate日前の日付をstartDateとして取得
  const startDate = format(subDays(new Date(endDate), dayBeforeEndDate), 'yyyy-MM-dd');

  return { startDate, endDate };
}

// Search Console APIからデータを取得する関数
async function fetchSearchConsoleData(searchConsole, siteUrl, startDate, endDate, logger) {
  try {
    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 100,
        startRow: 0,
      },
    });

    return response.data.rows.filter(row => row.impressions >= LOWER_LIMIT_IMPRESSIONS);
  } catch (error) {
    logger.error(`サーチコンソールからデータを取得できませんでした。 ${siteUrl}: ${error.message}`);
  }
}

// 特定のURLからタイトルとディスクリプションを取得する関数
async function fetchTitleAndDescription(url, logger) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const title = dom.window.document.querySelector('title')?.textContent || 'No title';
    const description =
      dom.window.document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      'No description';
    return { title, description };
  } catch (error) {
    logger.error(`タイトルとディスクリプションを取得できませんでした。 ${url}: ${error}`);
    return { title: 'No title', description: 'No description' };
  }
}

// PageSpeed Insightsの画面で確認できる数値と合わせるための関数
function formatFieldData(rawValue, roundDecimal) {
  if (rawValue == null) {
    return 'none';
  }

  let value;
  switch (roundDecimal) {
    case 1000:
      // LCP用の計算で少数第1位までの値を求める
      value = (Math.round(rawValue / 100) / 10).toFixed(1);
      break;
    case 100:
      // CLS用の計算で少数第2位までの値を求める
      value = (rawValue / 100).toFixed(2);
      break;
    default:
      // FID用の計算で整数の値を求める
      value = Math.round(rawValue).toString();
  }
  return parseFloat(value);
}

// パフォーマンスデータを取得する関数
async function getPerformanceData(pageUrl, strategy, logger) {
  try {
    const url = buildPageSpeedApiUrl(pageUrl, strategy);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status code: ${response.status}`);
    }

    const data = await response.json();
    return {
      lcp: formatFieldData(
        data.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
        1000
      ),
      fid: formatFieldData(data.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile, 1),
      cls: formatFieldData(
        data.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile,
        100
      ),
      score: Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
    };
  } catch (error) {
    logger.error(
      `[${strategy}] [${pageUrl}] PageSpeed Insights APIの呼び出し時にエラーが発生しました:`,
      error.message
    );
    return null;
  }
}

// スプレッドシートへの初期設定を行い、ヘッダーを設定する関数
async function setupSpreadsheet(spreadsheetId, sheetName, authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const headers = [
    'URL',
    'タイトル',
    'ディスクリプション',
    '表示回数',
    'クリック数',
    'CTR',
    '掲載順位',
    'LCP（パソコン）',
    'LCP（スマホ）',
    'FID（パソコン）',
    'FID（スマホ）',
    'CLS（パソコン）',
    'CLS（スマホ）',
    'スコア（パソコン）',
    'スコア（スマホ）',
  ];
  const headerRange = `${sheetName}!A1:O1`;

  // ヘッダー行をスプレッドシートに設定
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: headerRange,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers],
    },
  });
}

// スプレッドシートにデータを書き込む関数
async function writeToSpreadsheet(spreadsheetId, sheetName, data, authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A2`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: data,
    },
  });
}

// スプレッドシートに書き込むデータの形式を整える関数
function formatSpreadsheetData(searchConsoleData, metaData, performanceDataByUrl) {
  return searchConsoleData.map((row, index) => {
    const url = row.keys[0];
    const { title, description } = metaData[index];
    const performance = performanceDataByUrl[url];
    const desktopData = performance?.desktop || {
      lcp: 'none',
      fid: 'none',
      cls: 'none',
      score: 'none',
    };
    const mobileData = performance?.mobile || {
      lcp: 'none',
      fid: 'none',
      cls: 'none',
      score: 'none',
    };
    return [
      url,
      title,
      description,
      row.impressions,
      row.clicks,
      `${(row.ctr * 100).toFixed(2)}%`,
      row.position.toFixed(1),
      `${desktopData.lcp}秒`,
      `${mobileData.lcp}秒`,
      `${desktopData.fid}ミリ秒`,
      `${mobileData.fid}ミリ秒`,
      desktopData.cls,
      mobileData.cls,
      desktopData.score,
      mobileData.score,
    ];
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

  const searchConsole = await createSearchConsoleClient(jsonKey);
  const authClient = await googleAuth(jsonKey);

  const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);

  const searchConsoleData = await fetchSearchConsoleData(
    searchConsole,
    SITE_URL,
    startDate,
    endDate,
    logger
  );

  if (!searchConsoleData || searchConsoleData.length === 0) {
    logger.warn('サーチコンソールに該当するデータがありませんでした。');
    return;
  }

  const metaDataPromises = searchConsoleData.map(row => {
    const url = row.keys[0];
    return fetchTitleAndDescription(url, logger);
  });

  const performanceDataPromises = searchConsoleData.flatMap(row => {
    const url = row.keys[0];
    return [
      getPerformanceData(url, 'desktop', logger).then(coreWebVitalData => ({
        url,
        type: 'desktop',
        coreWebVitalData,
      })),
      getPerformanceData(url, 'mobile', logger).then(coreWebVitalData => ({
        url,
        type: 'mobile',
        coreWebVitalData,
      })),
    ];
  });

  const metaData = await Promise.all(metaDataPromises);
  const performanceData = await Promise.all(performanceDataPromises);
  const performanceDataByUrl = performanceData.reduce((acc, { url, type, coreWebVitalData }) => {
    if (!acc[url]) acc[url] = {};
    acc[url][type] = coreWebVitalData;
    return acc;
  }, {});

  await setupSpreadsheet(SPREADSHEET_ID, SHEET_NAME, authClient);

  const spreadsheetData = formatSpreadsheetData(searchConsoleData, metaData, performanceDataByUrl);

  await writeToSpreadsheet(SPREADSHEET_ID, SHEET_NAME, spreadsheetData, authClient);
}
