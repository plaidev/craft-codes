import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const SHEET_RANGE = '<% SHEET_RANGE %>';

async function initializeGoogleSheets(jsonKey) {
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();
  return google.sheets({ version: 'v4', auth: jwtClient });
}

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

  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  try {
    const values = data.jsonPayload.data.value;
    const fileSettings = values.split(',');

    const userId = fileSettings[0];
    const eventName = fileSettings[1];
    const campaignId = fileSettings[2];
    const timestamp = fileSettings[3];
    const name = fileSettings[4];
    const description = fileSettings[5];
    const pushType = fileSettings[6];

    const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
    const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
    const jsonKey = JSON.parse(_jsonKey);

    const sheets = await initializeGoogleSheets(jsonKey);

    const listData = [[userId, eventName, campaignId, timestamp, name, description, pushType]];

    await addSsValues(sheets, `${SHEET_NAME}!${SHEET_RANGE}`, listData);

    logger.log('書き込みに成功しました。');
  } catch (error) {
    logger.error(`書き込みに失敗しました。error: ${error.message}`, error.stack);
  }
}
