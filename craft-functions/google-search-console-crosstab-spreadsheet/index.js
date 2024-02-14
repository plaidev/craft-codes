import { google } from 'googleapis';
import { auth } from 'google-auth-library';
import { subDays, format } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SITE_URL = '<% SITE_URL %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>' ;
const SHEET_NAME = '<% SHEET_NAME %>' ;
const ROW_LIMIT = '<% ROW_LIMIT %>' ;

// Search Consoleの認証処理
async function createSearchConsoleClient(saKeyJson) {
  const client = auth.fromJSON(saKeyJson);
  client.scopes = ['https://www.googleapis.com/auth/webmasters'];
  await client.authorize();

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth: client
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

// キーワードとURLの組み合わせを取得し、それらのメトリクスを取得する
async function getKeywordPageMetrics(searchConsole, siteUrl, startDate, endDate, logger) {
  try {
    const res = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: ROW_LIMIT
      }
    });

    return res.data.rows.map(row => ({
      query: row.keys[0],
      page: row.keys[1],
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      position: row.position
    }));
  } catch (error) {
    logger.error('キーワードとURLのメトリクス取得に失敗しました:', error.message);
  }
}

// スプレッドシートAPIのクライアントを作成する関数
async function createSheetsClient(saKeyJson) {
  const client = auth.fromJSON(saKeyJson);
  client.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  await client.authorize();

  const sheets = google.sheets({
    version: 'v4',
    auth: client
  });

  return sheets;
}

// スプレッドシートにヘッダーとデータを書き込む関数
async function writeDataToSheet(sheets, spreadsheetId, sheetName, startDate, data, logger) {
  try {
    // ヘッダー行を設定
    const headers = [['集計開始日', 'キーワード', 'URL', '表示回数', 'クリック数', 'CTR', '掲載順位']];
    
    // 数値を四捨五入し、フォーマットを調整してデータ行を作成
    const formattedData = data.map(row => ([
      startDate, // A列に固定でstartDateを入れる
      `'${row.query}`, // キーワードの値を文字列として扱うためにアポストロフィを追加
      row.page,
      row.impressions,
      row.clicks,
      `${(Math.round(row.ctr * 1000) / 10).toFixed(1)}%`,
      Math.round(row.position * 10) / 10  
    ]));

    // データを書き込む範囲を指定
    const range = `${sheetName}!A1:G${1 + formattedData.length}`; // ヘッダー + データを書き込む範囲
    const values = [...headers, ...formattedData]; // ヘッダーとデータを結合して書き込む

    // ヘッダーとデータを書き込む
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values } 
    });
  } catch (error) {
    logger.error('スプレッドシートへの書き込みに失敗しました:', error.message);
  }
}
  
  export default async function (data, { MODULES }) {
    const { initLogger, secret } = MODULES;
    const logger = initLogger({ logLevel: LOG_LEVEL });
  
    // Search Consoleとスプレッドシート用のシークレットを取得
    const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  
    const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
    const searchConsole = await createSearchConsoleClient(saKeyJson);
  
    const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);
  
    const keywordPageMetrics = await getKeywordPageMetrics(searchConsole, SITE_URL, startDate, endDate);
  
    if (keywordPageMetrics.length === 0) {
        logger.warn('キーワードとURLのメトリクスが空です。スプレッドシートへの書き込みはスキップされます。');
        return; // メトリクスが空の場合は処理を終了する
    }
  
    const sheets = await createSheetsClient(saKeyJson);
  
    await writeDataToSheet(sheets, SPREADSHEET_ID, SHEET_NAME, startDate, keywordPageMetrics, logger);
  
  }