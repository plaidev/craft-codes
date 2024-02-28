import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GCP_API_KEY = '<% GCP_API_KEY %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SITE_MAP_URL = '<% SITE_MAP_URL %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';

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

// PageSpeed Insights API URLを構築する関数
function buildPageSpeedApiUrl(pageUrl, strategy) {
  const apiURL = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiURL.searchParams.append('url', pageUrl);
  apiURL.searchParams.append('key', GCP_API_KEY);
  apiURL.searchParams.append('strategy', strategy);
  return apiURL.href;
}

// サイトマップからURLを抽出する関数
async function extractUrlsFromSitemap(sitemapUrl, logger) {
  try {
    const response = await fetch(sitemapUrl);
    const sitemapText = await response.text();
    const urls = [];
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;

    match = regex.exec(sitemapText);
    while (match !== null) {
      urls.push(match[1]);
      match = regex.exec(sitemapText);
    }

    return urls;
  } catch (error) {
    logger.error(`Failed to extract URLs from sitemap: ${error.message}`);
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
    const data = await fetchData(url);
    return {
      lcp: formatFieldData(
        data.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? 'none',
        1000
      ),
      fid: formatFieldData(
        data.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile ?? 'none',
        1
      ),
      cls: formatFieldData(
        data.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? 'none',
        100
      ),
      score: Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
    };
  } catch (error) {
    logger.error(
      `[${strategy}] PageSpeed Insights APIの呼び出し時にエラーが発生しました:`,
      error.message
    );
    return null;
  }
}

// スプレッドシートへの初期設定を行う関数
async function setupSpreadsheet(spreadsheetId, sheetName, authClient) {
  const headers = [
    'URL',
    'LCP（パソコン）',
    'LCP（スマホ）',
    'FID（パソコン）',
    'FID（スマホ）',
    'CLS（パソコン）',
    'CLS（スマホ）',
    'スコア（パソコン）',
    'スコア（スマホ）',
  ];
  const headerRange = `${sheetName}!A1`;

  const sheets = google.sheets({ version: 'v4', auth: authClient });
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
async function writeToSheet(spreadsheetId, range, values, authClient) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
}

// URLごとのパフォーマンスデータ取得処理を実行する関数
async function fetchPerformanceData(urls, logger) {
  try {
    const performanceDataPromises = urls.map(url =>
      Promise.all([
        getPerformanceData(url, 'desktop', logger),
        getPerformanceData(url, 'mobile', logger),
      ])
    );

    return await Promise.all(performanceDataPromises);
  } catch (error) {
    logger.error('パフォーマンスデータの取得中にエラーが発生しました。', error);
  }
}

// スプレッドシートにデータを書き込む関数
async function updateSpreadsheetWithData(
  spreadsheetId,
  sheetName,
  urls,
  performanceDataResults,
  authClient,
  logger
) {
  try {
    const sheetData = [];

    performanceDataResults.forEach(([pcData, mobileData], index) => {
      const url = urls[index];
      if (pcData && mobileData) {
        sheetData.push([
          url,
          `${pcData.lcp}秒`,
          `${mobileData.lcp}秒`,
          `${pcData.fid}ミリ秒`,
          `${mobileData.fid}ミリ秒`,
          pcData.cls,
          mobileData.cls,
          `${pcData.score}点`,
          `${mobileData.score}点`,
        ]);
      }
    });

    if (sheetData.length > 0) {
      const range = `${sheetName}!A2`;
      await writeToSheet(spreadsheetId, range, sheetData, authClient);
    }
  } catch (error) {
    logger.error('スプレッドシートの更新中にエラーが発生しました。', error);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const authClient = await googleAuth(jsonKey);

  await setupSpreadsheet(SPREADSHEET_ID, SHEET_NAME, authClient);

  const urls = await extractUrlsFromSitemap(SITE_MAP_URL, logger);
  const performanceDataResults = await fetchPerformanceData(urls, logger);
  await updateSpreadsheetWithData(
    SPREADSHEET_ID,
    SHEET_NAME,
    urls,
    performanceDataResults,
    authClient,
    logger
  );
}
