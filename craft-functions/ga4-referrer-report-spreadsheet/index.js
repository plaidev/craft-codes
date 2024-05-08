import { google } from 'googleapis';
import { subDays, format } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const GA4_PROPERTY_ID = '<% GA4_PROPERTY_ID %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';

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
function createApiRequest(propertyId, startDate, endDate) {
  return {
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'conversions' },
      ],
    },
  };
}

// Google Analytics APIからデータを取得する関数
async function fetchGA4DataForReferrer(
  analyticsDataClient,
  propertyId,
  startDate,
  endDate,
  logger
) {
  try {
    const request = createApiRequest(propertyId, startDate, endDate);
    const response = await analyticsDataClient.properties.runReport(request);

    logger.debug('GA4 API response:', response);
    return response;
  } catch (error) {
    logger.error('Error fetching GA4 data:', error);
    return null;
  }
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
  ga4Data,
  logger
) {
  try {
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
            range: `${sheetName}!A3:G3`,
            values: [
              [
                '参照元',
                'ユーザー数',
                'セッション数',
                'エンゲージメントセッション数',
                'エンゲージメント率',
                'コンバージョン数',
              ],
            ],
          },
        ],
      },
    });

    // ga4Dataがオブジェクトであることを確認
    if (ga4Data?.data?.rows) {
      // ga4Data.data.rowsから配列データを抽出
      const rowsArray = ga4Data.data.rows;

      const values = rowsArray.map(row => {
        const source = row.dimensionValues[0].value;
        const activeUsers = row.metricValues[0].value;
        const sessions = row.metricValues[1].value;
        const engagedSessions = row.metricValues[2].value;
        const engagementRate = `${(parseFloat(row.metricValues[3].value) * 100).toFixed(1)}%`;
        const conversions = Math.round(parseFloat(row.metricValues[4].value));

        return [source, activeUsers, sessions, engagedSessions, engagementRate, conversions];
      });

      // データをスプレッドシートに書き込む
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A4:G${3 + values.length}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      });
    } else {
      logger.error(`ga4Data does not contain the expected rows data: ${JSON.stringify(ga4Data)}`);
    }
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

  const ga4Data = await fetchGA4DataForReferrer(
    analyticsDataClient,
    GA4_PROPERTY_ID,
    startDate,
    endDate,
    logger
  );

  await writeToSpreadsheet(sheets, SPREADSHEET_ID, SHEET_NAME, startDate, endDate, ga4Data, logger);
}
