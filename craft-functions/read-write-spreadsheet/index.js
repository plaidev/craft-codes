import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>'; // GoogleサービスアカウントのJSONキーを登録したシークレットの名前
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>'; // https://docs.google.com/spreadsheets/d/#{SPREADSHEET_ID}/
const SHEET_NAME = '<% SHEET_NAME %>'; // スプレッドシート内のシート名

async function getSsValues(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return res.data.values || null;
}
async function updateSsValues(sheets, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED', // Userの入力値と同様に扱う
    resource: {
      values,
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

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

  // 現在のcountを取得
  const values = await getSsValues(sheets, `${SHEET_NAME}!A1:B1`);
  let currentCount = 0;
  if (values) {
    currentCount = Number(values[0][1]);
  }
  logger.debug(`currentCount: ${currentCount}`);

  // countを +1 して上書き
  const newValues = [['count: ', currentCount + 1]];
  await updateSsValues(sheets, `${SHEET_NAME}!A1:B1`, newValues);
}
