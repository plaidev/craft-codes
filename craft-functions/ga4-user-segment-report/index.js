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

// Google Analytics APIからデータを取得する関数
async function fetchGA4Data(analyticsDataClient, propertyId, userType, startDate, endDate, logger) {
  try {
    const response = await analyticsDataClient.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [
          {
            startDate,
            endDate,
          },
        ],
        dimensions: [
          {
            name: 'newVsReturning',
          },
        ],
        metrics: [
          {
            name: 'activeUsers',
          },
          {
            name: 'sessions',
          },
          {
            name: 'averageSessionDuration',
          },
          {
            name: 'screenPageViews',
          },
          {
            name: 'bounceRate',
          },
          {
            name: 'conversions',
          },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'newVsReturning',
            stringFilter: {
              matchType: 'EXACT',
              value: userType === 'new' ? 'New' : 'Returning',
            },
          },
        },
      },
    });
    return response;
  } catch (error) {
    logger.error(
      `Error fetching GA4 data for ${userType} between ${startDate} and ${endDate}:`,
      error
    );
  }
}

// レスポンスからメトリックを処理し、ログ出力する関数
function processMetrics(response, logger) {
  if (!response) {
    logger.error('The response object is undefined.');
    return;
  }

  if (!response.data) {
    logger.error('The response does not contain "data" property.');
    return;
  }

  const sheetRowData = []; // スプレッドシートに書き込むための行データ

  if (response.data.rows) {
    response.data.rows.forEach(row => {
      let sessionsValue = 0;
      let pageViewsValue = 0;
      let activeUsersValue = 0;
      let conversionsValue = 0;
      let bounceRateValue = 0;
      let averageSessionDurationValue = 0;

      row.metricValues.forEach((metricValueObj, i) => {
        const metricName = response.data.metricHeaders[i].name;
        const metricValue = metricValueObj.value;
        // 対応するメトリクスの値を変数に格納
        switch (metricName) {
          case 'activeUsers':
            activeUsersValue = metricValue;
            break;
          case 'sessions':
            sessionsValue = metricValue;
            break;
          case 'screenPageViews':
            pageViewsValue = metricValue;
            break;
          case 'conversions':
            conversionsValue = metricValue;
            break;
          case 'bounceRate':
            bounceRateValue = `${(parseFloat(metricValue) * 100).toFixed(2)}%`;
            break;
          case 'averageSessionDuration': {
            // 秒単位の値を分と秒に変換
            const durationInSeconds = parseFloat(metricValue);
            const minutes = Math.floor(durationInSeconds / 60);
            const seconds = Math.round(durationInSeconds % 60);
            averageSessionDurationValue = `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
            break;
          }
          default:
            logger.warn(`Unrecognized metric name: ${metricName}`);
            break;
        }
      });

      // スプレッドシートに書き込むための行データに各メトリクスの値を追加
      sheetRowData.push([
        activeUsersValue, // ユーザー数
        sessionsValue, // セッション数
        pageViewsValue, // PV数
        bounceRateValue, // 直帰率
        averageSessionDurationValue, // 平均セッション時間
        conversionsValue, // コンバージョン数
        // コンバージョン率、PV/S、PV/UUの計算と追加が必要な場合はここで行う
      ]);
    });
  }
  return sheetRowData;
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
async function writeDataToSheet(
  sheets,
  spreadsheetId,
  sheetName,
  startDate,
  endDate,
  data,
  logger
) {
  try {
    // ヘッダー行のデータ
    const headerValues = [['集計期間', startDate, endDate], [], ['', '新規ユーザー', 'リピーター']];

    // メトリック名のデータ
    const metricNames = [
      'ユーザー数',
      'セッション数',
      'PV数',
      '直帰率',
      '平均ページ滞在時間',
      'コンバージョン数',
      'コンバージョン率',
      'PV/S',
      'PV/UU',
    ];

    // スプレッドシートのデータを更新する
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `${sheetName}!A1:C3`,
            values: headerValues,
          },
          {
            range: `${sheetName}!A4:A${4 + metricNames.length - 1}`,
            values: metricNames.map(metricName => [metricName]),
          },
          {
            range: `${sheetName}!B4:C${4 + data.length - 1}`,
            values: data,
          },
        ],
      },
    });

    logger.debug('スプレッドシートへのデータ書き込みが完了しました。');
  } catch (error) {
    logger.error('スプレッドシートへの書き込みに失敗しました:', error.message);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

  const authClient = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const auth = await authClient.getClient();

  const analyticsDataClient = google.analyticsdata({
    version: 'v1beta',
    auth,
  });

  const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);

  const fetchNewUser = fetchGA4Data(
    analyticsDataClient,
    GA4_PROPERTY_ID,
    'new',
    startDate,
    endDate,
    logger
  );
  const fetchReturningUser = fetchGA4Data(
    analyticsDataClient,
    GA4_PROPERTY_ID,
    'returning',
    startDate,
    endDate,
    logger
  );

  const [newUserData, returningUserData] = await Promise.all([fetchNewUser, fetchReturningUser]);

  const newSheetData = processMetrics(newUserData, logger);
  const returningSheetData = processMetrics(returningUserData, logger);

  const sheets = await createSheetsClient(saKeyJson);

  const combinedSheetData = [];
  for (let i = 0; i < newSheetData.length; i += 1) {
    combinedSheetData.push([newSheetData[i], returningSheetData[i]]);
  }

  await writeDataToSheet(
    sheets,
    SPREADSHEET_ID,
    SHEET_NAME,
    startDate,
    endDate,
    combinedSheetData,
    logger
  );
}
