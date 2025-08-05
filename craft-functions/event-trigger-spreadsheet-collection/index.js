import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';

async function updateSsValues(sheets, spreadsheetId, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
}

async function getHeaderRow(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  return res.data.values ? res.data.values[0] : [];
}

async function appendRow(sheets, spreadsheetId, sheetName, values) {
  // ヘッダー行がない場合は新しく作成
  const headerRow = await getHeaderRow(sheets, spreadsheetId, sheetName);
  if (headerRow.length === 0) {
    const headerValues = values.map(item => item.column);
    await updateSsValues(sheets, spreadsheetId, `${sheetName}!A1:Z1`, [headerValues]);
  }

  // 新しいイベントデータをスプレッドシートに追加
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [values.map(item => item.value)],
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // 出力先のスプレッドシートの情報と、そこに書き出されるイベントデータを取得
  const record = data.jsonPayload.data.record;
  const sheetName = data.jsonPayload.data.sheet_name;
  const spreadsheetId = data.jsonPayload.data.spreadsheet_id;
  // もしも、record、sheetName、spreadsheetIdが存在しない場合は、エラーログを吐き出す
  if (!record) return logger.error(`"record" is required in data.`);
  if (!sheetName) return logger.error(`"sheet_name" is required in data.`);
  if (!spreadsheetId) return logger.error(`"spreadsheet_id" is required in data.`);

  // GoogleサービスアカウントのJSONキーをシークレットから取得
  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const jsonKey = JSON.parse(_jsonKey);

  // Google Drive APIの初期化
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();

  const sheets = google.sheets({ version: 'v4', auth: jwtClient });

  // イベントが発生するたびに、そのデータを格納する行を構築して追加
  await appendRow(sheets, spreadsheetId, sheetName, record);
}
