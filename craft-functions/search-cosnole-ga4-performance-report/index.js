import { google } from 'googleapis';
import { subDays, format } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';
const SITE_URL = '<% SITE_URL %>';
const ROW_LIMIT = '<% ROW_LIMIT %>';
const GA4_PROPERTY_ID = '<% GA4_PROPERTY_ID %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';

const HEADERS = [
  '集計開始日',
  'URL',
  '表示回数',
  'クリック数',
  'CTR',
  '掲載順位',
  'ユーザー数',
  'セッション数',
  'エンゲージメントセッション数',
  'エンゲージメント率',
  'PV数',
  '直帰率',
  'キーイベント数',
  'セッションキーイベント率',
  'PV/S',
];

function formatMetric(value, formatter) {
  if (value === undefined || value === null) return '0';
  switch (formatter) {
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'integer':
      return Math.round(value);
    default:
      return '0';
  }
}

function prepareDataRow(startDate, row) {
  const ga4Data = row.ga4Data || [];
  return [
    startDate,
    row.page,
    formatMetric(row.impressions, 'integer'),
    formatMetric(row.clicks, 'integer'),
    formatMetric(row.ctr, 'percentage'),
    formatMetric(row.position, 'decimal'),
    formatMetric(ga4Data[0]?.value, 'integer'),
    formatMetric(ga4Data[1]?.value, 'integer'),
    formatMetric(ga4Data[2]?.value, 'integer'),
    formatMetric(ga4Data[3]?.value, 'percentage'),
    formatMetric(ga4Data[4]?.value, 'integer'),
    formatMetric(ga4Data[5]?.value, 'percentage'),
    formatMetric(ga4Data[6]?.value, 'integer'),
    formatMetric(ga4Data[7]?.value, 'percentage'),
    formatMetric(ga4Data[8]?.value, 'decimal'),
  ];
}

async function createSearchConsoleClient(saKeyJson) {
  const client = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const auth = await client.getClient();

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth,
  });

  return searchConsole;
}

async function createAnalyticsDataClient(saKeyJson) {
  const client = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const auth = await client.getClient();

  const analyticsData = google.analyticsdata({
    version: 'v1beta',
    auth,
  });

  return analyticsData;
}

async function createSheetsClient(saKeyJson) {
  const client = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const auth = await client.getClient();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  return sheets;
}

function getStartDateAndEndDate(dayBeforeEndDate) {
  const today = new Date();
  const endDate = format(subDays(today, 3), 'yyyy-MM-dd'); // サーチコンソールのデータは3日前が最新の場合が多いので、集計開始日から3日前までを集計
  const startDate = format(subDays(new Date(endDate), dayBeforeEndDate), 'yyyy-MM-dd');
  return { startDate, endDate };
}

function extractPathFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname;
  } catch (error) {
    return url;
  }
}

async function getPageMetrics({ searchConsole, siteUrl, startDate, endDate, rowLimit, logger }) {
  try {
    const res = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit,
      },
    });

    return res.data.rows.map(row => ({
      page: row.keys[0],
      path: extractPathFromUrl(row.keys[0]),
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      position: row.position,
    }));
  } catch (error) {
    logger.error('ページURLのメトリクス取得に失敗しました:', error.message);
    return [];
  }
}

function createGA4ApiRequest(propertyId, pagePath, startDate, endDate) {
  return {
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      dimensionFilter: {
        filter: {
          fieldName: 'landingPage',
          stringFilter: { matchType: 'EXACT', value: pagePath },
        },
      },
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'keyEvents' },
        { name: 'sessionKeyEventRate' },
        { name: 'screenPageViewsPerSession' },
      ],
    },
  };
}

async function fetchGA4Data({
  analyticsDataClient,
  propertyId,
  pagePaths,
  startDate,
  endDate,
  logger,
}) {
  const requests = pagePaths.map(async pagePath => {
    // トップページ以外は末尾のスラッシュを削除
    const sanitizedPagePath = pagePath === '/' ? pagePath : pagePath.replace(/\/$/, '');
    try {
      const request = createGA4ApiRequest(propertyId, sanitizedPagePath, startDate, endDate);
      const response = await analyticsDataClient.properties.runReport(request);

      if (response.data && response.data.rows && response.data.rows.length > 0) {
        return { pagePath, data: response.data.rows[0].metricValues };
      }
      logger.warn(`GA4のデータが見つかりません： ${sanitizedPagePath}`);
      return { pagePath, data: [] };
    } catch (error) {
      logger.error(
        `次のページパスのGA4のデータ取得時にエラーが発生しました ${sanitizedPagePath}:`,
        error
      );
      return { pagePath, data: [] };
    }
  });

  const results = await Promise.all(requests);
  const ga4Data = {};
  results.forEach(result => {
    ga4Data[result.pagePath] = result.data;
  });

  return ga4Data;
}

async function writeDataToSheet(sheets, spreadsheetId, sheetName, startDate, data, logger) {
  try {
    const headers = [HEADERS];
    const formattedData = data.map(row => prepareDataRow(startDate, row));

    const range = `${sheetName}!A1:O${1 + formattedData.length}`;
    const values = [...headers, ...formattedData];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error) {
    logger.error('スプレッドシートへの書き込みに失敗しました:', error.message);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
    const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

    const searchConsole = await createSearchConsoleClient(saKeyJson);
    const analyticsDataClient = await createAnalyticsDataClient(saKeyJson);

    const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);
    const pageMetrics = await getPageMetrics({
      searchConsole,
      siteUrl: SITE_URL,
      startDate,
      endDate,
      rowLimit: ROW_LIMIT,
      logger,
    });

    if (pageMetrics.length === 0) {
      logger.warn(
        'ページURLのメトリクスが空です。スプレッドシートへの書き込みはスキップされます。'
      );
      return;
    }

    const pagePaths = pageMetrics.map(row => row.path);
    const ga4Metrics = await fetchGA4Data({
      analyticsDataClient,
      propertyId: GA4_PROPERTY_ID,
      pagePaths,
      startDate,
      endDate,
      logger,
    });

    const combinedData = pageMetrics.map(row => ({
      ...row,
      ga4Data: ga4Metrics[row.path] || [],
    }));

    const sheets = await createSheetsClient(saKeyJson);
    await writeDataToSheet(sheets, SPREADSHEET_ID, SHEET_NAME, startDate, combinedData, logger);
  } catch (error) {
    logger.error('処理中にエラーが発生しました:', error.message);
  }
}
