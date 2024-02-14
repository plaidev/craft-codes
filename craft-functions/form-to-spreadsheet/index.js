import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const SHEET_RANGE = '<% SHEET_RANGE %>';
const FORM_FIELDS = '<% FORM_FIELDS %>';
const VALUES = FORM_FIELDS.split(',');

async function addSsValues(sheets, range, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const body = data.jsonPayload.data.hook_data.body;

  const values = {};
  VALUES.forEach(field => {
    values[field] = body[field];
  });

  try {
    const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
    const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
    const jsonKey = JSON.parse(_jsonKey);

    const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
      'https://www.googleapis.com/auth/spreadsheets',
    ]);
    await jwtClient.authorize();

    const sheets = google.sheets({ version: 'v4', auth: jwtClient });
    const listData = [VALUES.map(field => values[field])];
    await addSsValues(sheets, `${SHEET_NAME}!${SHEET_RANGE}`, listData);

    logger.log('書き込みに成功しました。');
  } catch (error) {
    logger.error(`書き込みに失敗しました。error: ${error}`);
  }
}
