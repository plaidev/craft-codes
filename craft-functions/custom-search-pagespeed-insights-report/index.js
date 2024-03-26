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

async function fetchData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data. Status code: ${response.status}`);
  }

  return response.json();
}

// PageSpeed Insights API URLを構築する関数
function buildPageSpeedApiUrl(pageUrl, strategy) {
  const apiURL = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiURL.searchParams.append('url', pageUrl);
  apiURL.searchParams.append('key', GCP_API_KEY);
  apiURL.searchParams.append('strategy', strategy);
  return apiURL.href;
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
      // FID用の計算が不要になったので、そのままの値を返す
      value = rawValue.toString();
      break;
  }
  return value;
}

// パフォーマンスデータを取得する関数
async function getPerformanceData(pageUrl, strategy, logger) {
  try {
    const url = buildPageSpeedApiUrl(pageUrl, strategy);
    const data = await fetchData(url);
    const metrics = data.loadingExperience?.metrics;
    return {
      strategy,
      lcp:
        metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile !== undefined
          ? formatFieldData(metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile, 1000)
          : 'none',
      cls:
        metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile !== undefined
          ? formatFieldData(metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile, 100)
          : 'none',
      score:
        data.lighthouseResult?.categories?.performance?.score !== undefined
          ? Math.round(data.lighthouseResult.categories.performance.score * 100).toString()
          : 'none',
    };
  } catch (error) {
    logger.error(
      `[${strategy}] パフォーマンスデータの取得時にエラーが発生しました:`,
      error.message
    );
    return {
      strategy,
      lcp: 'none',
      cls: 'none',
      score: 'none',
    };
  }
}

// スプレッドシートにヘッダーとデータを書き込む関数
async function writeToSpreadsheet(
  spreadsheetId,
  sheetName,
  searchResults,
  performanceData,
  authClient
) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  // ヘッダー行を定義
  const headers = [
    [
      '順位',
      'URL',
      'タイトル',
      'ディスクリプション',
      'LCP（パソコン）',
      'LCP（スマホ）',
      'CLS（パソコン）',
      'CLS（スマホ）',
      'スコア（パソコン）',
      'スコア（スマホ）',
    ],
  ];

  // データ行を準備
  const dataRows = searchResults.map((result, index) => {
    const pc = performanceData.desktop[index];
    const mobile = performanceData.mobile[index];
    return [
      index + 1,
      result.link,
      result.title,
      result.snippet,
      `${pc.lcp}秒`,
      `${mobile.lcp}秒`,
      pc.cls,
      mobile.cls,
      pc.score,
      mobile.score,
    ];
  });
  // ヘッダー行をスプレッドシートに書き込む
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:L1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: headers },
  });
  // データ行をスプレッドシートに書き込む
  if (dataRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2:L${dataRows.length + 1}`,
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
  if (!searchResults || searchResults.length === 0) {
    logger.error('検索結果を取得できませんでした');
    return;
  }

  const performancePromises = searchResults.flatMap(result => {
    const url = result.link;
    return ['desktop', 'mobile'].map(strategy => getPerformanceData(url, strategy, logger));
  });

  const performanceResults = await Promise.all(performancePromises);

  const performanceData = {
    desktop: performanceResults.filter(result => result.strategy === 'desktop'),
    mobile: performanceResults.filter(result => result.strategy === 'mobile'),
  };

  // スプレッドシートに書き込み
  await writeToSpreadsheet(
    SPREADSHEET_ID,
    SHEET_NAME,
    searchResults,
    performanceData,
    authClient,
    logger
  );
}
