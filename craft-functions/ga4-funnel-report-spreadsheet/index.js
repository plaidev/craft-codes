import { google } from 'googleapis';
import { subDays, format } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const GA4_PROPERTY_ID = '<% GA4_PROPERTY_ID %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const FUNNEL_NAMES = '<% FUNNEL_NAMES %>';

// 開始日と終了日の取得を行う関数
function getStartDateAndEndDate(dayBeforeEndDate) {
  const today = new Date();
  // 昨日の日付をendDateとして取得
  const endDate = format(subDays(today, 1), 'yyyy-MM-dd');
  // endDateからdayBeforeEndDate日前の日付をstartDateとして取得
  const startDate = format(subDays(new Date(endDate), dayBeforeEndDate), 'yyyy-MM-dd');

  return { startDate, endDate };
}

// APIリクエストを作成する関数
function createApiRequest(propertyId, eventName, startDate, endDate) {
  return {
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'conversions' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: eventName,
          },
        },
      },
    },
  };
}

// レスポンスデータを処理する関数
function processResponseData(response, eventName, logger) {
  if (!response || !response.data || !Array.isArray(response.data.rows)) {
    logger.error(`Invalid response for event ${eventName}`);
    return;
  }
  return response.data.rows.map(row => ({
    eventName: row.dimensionValues[0].value,
    eventCount: parseInt(row.metricValues[0].value, 10),
    sessions: parseInt(row.metricValues[1].value, 10),
    activeUsers: parseInt(row.metricValues[2].value, 10),
    conversions: parseInt(row.metricValues[3].value, 10),
  }));
}

// Google Analytics APIからデータを取得する関数
async function fetchGA4DataForEvents(
  analyticsDataClient,
  propertyId,
  startDate,
  endDate,
  funnelNames,
  logger
) {
  const eventNames = funnelNames.split(',').map(name => name.trim());

  const allEventDataPromises = eventNames.map(async eventName => {
    try {
      const request = createApiRequest(propertyId, eventName, startDate, endDate);
      const response = await analyticsDataClient.properties.runReport(request);
      return processResponseData(response, eventName, logger);
    } catch (error) {
      logger.error(`Error fetching data for event ${eventName}: ${error}`);
      return []; // エラーがあった場合は空の配列を返す
    }
  });

  const allEventDataArrays = await Promise.all(allEventDataPromises);

  return allEventDataArrays.flat();
}

// セッション通過率を計算する関数
function calculatePassThroughRates(ga4Data) {
  let previousSessions = 0;
  for (let i = 0; i < ga4Data.length; i += 1) {
    const currentData = ga4Data[i];
    if (i === 0) {
      // 最初のファネルについては通過率は計算しない
      currentData.passThroughRate = '-';
      previousSessions = currentData.sessions;
    } else {
      // 通過率を計算 (1つ前のセッション数に対する現在のセッション数)
      const passThroughRate = (currentData.sessions / previousSessions) * 100;
      currentData.passThroughRate = `${passThroughRate.toFixed(1)}%`;
      previousSessions = currentData.sessions;
    }
  }
  return ga4Data;
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

// スプレッドシートにヘッダーとデータを書き込む関数
async function writeToSpreadsheet(
  sheets,
  spreadsheetId,
  sheetName,
  startDate,
  endDate,
  funnelNames,
  ga4Data,
  logger
) {
  try {
    const funnelNamesArray = funnelNames.split(',').map(name => [name.trim()]);

    // ヘッダー行を設定する
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `${sheetName}!A1:C1`,
            values: [['集計期間', startDate, endDate]],
          },
          {
            range: `${sheetName}!A3:F3`,
            values: [
              [
                'ファネル',
                'イベント数',
                'セッション数',
                'ユーザー数',
                'コンバージョン数',
                'セッション通過率',
              ],
            ],
          },
          {
            // ファネル名をA4セル以下に入れる
            range: `${sheetName}!A4:A${3 + funnelNamesArray.length}`,
            values: funnelNamesArray,
          },
        ],
      },
    });

    // 各ファネルのデータを書き込む
    const rowData = ga4Data.map(funnel => [
      funnel.eventCount,
      funnel.sessions,
      funnel.activeUsers,
      funnel.conversions,
      funnel.passThroughRate,
    ]);

    // データをスプレッドシートに書き込む
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B4:F${3 + ga4Data.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rowData,
      },
    });
  } catch (error) {
    logger.error(`Error writing to spreadsheet: ${error}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

  const auth = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analyticsDataClient = google.analyticsdata({
    version: 'v1beta',
    auth,
  });

  const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);

  const sheets = await createSheetsClient(saKeyJson);

  const ga4Data = await fetchGA4DataForEvents(
    analyticsDataClient,
    GA4_PROPERTY_ID,
    startDate,
    endDate,
    FUNNEL_NAMES,
    logger
  );
  const ga4DataWithPassThroughRates = calculatePassThroughRates(ga4Data);

  await writeToSpreadsheet(
    sheets,
    SPREADSHEET_ID,
    SHEET_NAME,
    startDate,
    endDate,
    FUNNEL_NAMES,
    ga4DataWithPassThroughRates,
    logger
  );
}
