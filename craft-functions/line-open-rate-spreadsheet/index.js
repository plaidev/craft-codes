import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const CHANNEL_ACCESS_TOKEN_SECRET = '<% CHANNEL_ACCESS_TOKEN_SECRET %>';
const HEADER = [
  'キャンペーンID',
  '集計開始日',
  '集計終了日',
  '送信対象者数',
  '開封数',
  '開封率',
  'タップしたURL',
  'URLタップ数',
  'URLタップ率',
];

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

async function getSheetRowCount(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });
  return res.data.values ? res.data.values.length : 0;
}

async function fetchLineAPIData({ campaignId, startDate, endDate, messagingApiAccessToken }) {
  const url = `https://api.line.me/v2/bot/insight/message/event/aggregation?customAggregationUnit=${campaignId}&from=${startDate}&to=${endDate}`;

  const headers = {
    Authorization: `Bearer ${messagingApiAccessToken}`,
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`LINE API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

function formatDate(yyyymmdd) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`;
}

async function writeDataToSheet({ sheets, spreadsheetId, sheetName, values, logger }) {
  try {
    const rowCount = await getSheetRowCount(sheets, spreadsheetId, sheetName);
    const dataToWrite = rowCount === 0 ? [HEADER, ...values] : values;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: dataToWrite },
    });

    logger.log('Data successfully written to the sheet.');
  } catch (error) {
    logger.error('Error writing data to the sheet:', error);

    throw new Error(`Failed to write data to sheet: ${error.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  let jobflowData = data.jsonPayload.data;

  if (typeof jobflowData === 'string') {
    try {
      jobflowData = JSON.parse(jobflowData);
    } catch (e) {
      logger.error('Failed to parse jobflowData:', e);
      return;
    }
  }

  const rows = jobflowData.value.replace(/\n/g, '\n').split('\n').slice(1);

  const secrets = await secret.get({
    keys: [SERVICE_ACCOUNT_KEY_SECRET, CHANNEL_ACCESS_TOKEN_SECRET],
  });
  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const sheets = await createSheetsClient(saKeyJson);
  const messagingApiChannelAccessTokenSecret = secrets[CHANNEL_ACCESS_TOKEN_SECRET];

  const rowPromises = rows.map(async row => {
    const columns = row.split(',');

    if (columns.length < 4) return null;

    const [campaignId, sendUserCount, startDate, endDate] = columns;

    if (!campaignId || !sendUserCount || !startDate || !endDate) {
      logger.debug('Skipping row due to missing data:', {
        campaignId,
        sendUserCount,
        startDate,
        endDate,
      });
      return null;
    }

    try {
      const lineCampaignData = await fetchLineAPIData({
        campaignId,
        startDate,
        endDate,
        messagingApiAccessToken: messagingApiChannelAccessTokenSecret,
      });

      const uniqueImpression = lineCampaignData?.overview?.uniqueImpression;
      if (uniqueImpression == null) {
        logger.warn(`uniqueImpression is missing for campaign ${campaignId}`);
        return null;
      }
      const openRate = sendUserCount ? (uniqueImpression / sendUserCount) * 100 : 0;
      const urlData = lineCampaignData?.clicks || [];

      if (urlData.length === 0) {
        return [
          [
            campaignId,
            formatDate(startDate),
            formatDate(endDate),
            sendUserCount,
            uniqueImpression,
            `${openRate.toFixed(2)}%`,
            '',
            null,
            null,
          ],
        ];
      }

      const campaignRows = urlData.map((click, index) => {
        const urlClickRate = uniqueImpression ? (click.click / uniqueImpression) * 100 : 0;

        // タップしたURLが複数ある場合、最初の1行目（index === 0）はキャンペーン全体のデータも含める
        if (index === 0) {
          return [
            campaignId,
            formatDate(startDate),
            formatDate(endDate),
            sendUserCount,
            uniqueImpression,
            `${openRate.toFixed(2)}%`,
            click.url,
            click.click,
            `${urlClickRate.toFixed(2)}%`,
          ];
        }

        // 2行目以降はURLとクリック情報のみを記録、他の列は省略（重複を避けるため空文字を使用）
        return [
          campaignId,
          '', // 2行目以降は開始日を省略
          '', // 2行目以降は終了日を省略
          '', // 2行目以降は送信対象者数を省略
          '', // 2行目以降は開封数を省略
          '', // 2行目以降は開封率を省略
          click.url,
          click.click,
          `${urlClickRate.toFixed(2)}%`,
        ];
      });

      return campaignRows;
    } catch (error) {
      logger.error('Error processing row:', { row, error });
      return null;
    }
  });

  const resultRows = (await Promise.all(rowPromises)).filter(row => row !== null).flat();

  await writeDataToSheet({
    sheets,
    spreadsheetId: SPREADSHEET_ID,
    sheetName: SHEET_NAME,
    values: resultRows,
    logger,
  });
}
