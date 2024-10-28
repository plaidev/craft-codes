import api from 'api';
import { google } from 'googleapis';
import { subDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const DATA_SHEET_NAME = '<% SHEET_NAME %>';
const UPDATE_TYPE = '<% UPDATE_TYPE %>';
const RELATIVE_START_DATE_DAYS_AGO = Number('<% RELATIVE_START_DATE_DAYS_AGO %>');
const ABSOLUTE_START_DATE = '<% ABSOLUTE_START_DATE %>';
const ABSOLUTE_END_DATE = '<% ABSOLUTE_END_DATE %>';
const AGGREGATION_RANGE = '<% AGGREGATION_RANGE %>';
const STATE_SHEET_NAME = '__state'; // 状態管理に利用するシート名

// 下記のフィールド群から表示対象のフィールドを表示したい順番に並び替えて指定
const FIELDS_TO_DISPLAY = [
  '接客サービスID',
  '接客サービス名',
  '接客タイプ',
  'ゴール',
  'サービス状態',
  'ラベル',
  '対象ユーザー',
  '対象イベント',
  '配信開始日',
  '配信終了日',
  '同時配信',
  '配信優先度',
  'オプション',
  '作成者',
  '作成日時',
  '最終更新者',
  '更新日時',
  '設定URL',
  'フォルダ',
  'トリガー元',
  '接客数',
  '平均PV',
  '平均滞在時間(秒)',
  'ゴールした接客数',
  '接客ゴール率',
  '接客ゴール金額(円)',
  '平均ゴール金額(円)',
  '接客あたり平均ゴール金額(円)',
  '未接客数',
  '未接客平均PV',
  '未接客平均滞在時間(秒)',
  '未接客ゴール数',
  '未接客ゴール率',
  '未接客ゴール金額(円)',
  '未接客平均ゴール金額(円)',
  '未接客あたり平均ゴール金額(円)',
  'ABテスト',
  'リフトアップゴール回数',
  'ゴール回数アップ率',
  'リフトアップ金額(円)',
  'ゴール金額アップ率',
  'クリックされた接客数',
  '接客クリック率',
  'クリック後にゴールした接客数',
  '接客クリック後ゴール率',
  '接客クリック後ゴール金額(円)',
  '接客クリック後平均ゴール金額(円)',
  '接客クリックあたり平均ゴール金額',
  'リフトアップゴール回数信頼度',
];

// daysAgo（相対指定）か、startDate & endDate（絶対指定）のいずれか一方が指定される
function makeStartEndDate(daysAgo, startDate, endDate) {
  // 絶対指定
  if (startDate && endDate) {
    return {
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.999Z`,
    };
  }

  // 相対指定
  const s = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'); // N日前から
  const e = format(subDays(new Date(), 1), 'yyyy-MM-dd'); // 1日前まで
  return {
    startDate: `${s}T00:00:00.000Z`,
    endDate: `${e}T23:59:59.999Z`,
  };
}

async function fetchCampaignSettingsAndStats({ startDate, endDate, range, renew, sdk, logger }) {
  logger.debug(`[fetchCampaignSettingsAndStats] renew: ${renew}`);
  try {
    const res = await sdk.postV2betaActionCampaignGetsettingsandstats({
      start_date: startDate,
      end_date: endDate,
      range,
      is_test: false, // ダミーデータによるテストをしたい場合はtrueを指定
      renew, // データ作成依頼時はtrueを、その後のデータ取得時はfalseを指定
    });
    return { result: res.data, status: res.status };
  } catch (err) {
    logger.error(err);
    return null;
  }
}

async function getSsClient(jsonKey) {
  // Google Drive APIの初期化
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();

  const sheets = google.sheets({ version: 'v4', auth: jwtClient });
  return sheets;
}

// 更新用データを整形
function makeSsValues({ stats, fieldsToDisplay, isSheetEmpty }) {
  const CREATED_AT_COLUMN_NAME = 'createdAt';
  // 更新日カラムを追加
  const createdAt = format(toZonedTime(new Date(), 'Asia/Tokyo'), 'yyyy-MM-dd');
  const _fieldsToDisplay = [CREATED_AT_COLUMN_NAME].concat(fieldsToDisplay);

  // {"0":["接客サービスID","接客サービス名", ...], "1": ["test", "初回来訪のユーザーに接客", ...]}
  const indexes = Object.keys(stats); // ["0", "1", "2", ...]

  // csv形式に変換: [["接客サービスID","接客サービス名", ...], ["test", "初回来訪のユーザーに接客", ...], ...]
  let csvRows = [];
  indexes.forEach(_i => {
    const i = Number(_i);
    csvRows[i] = stats[_i];
  });

  csvRows = csvRows.filter(v => !!v);

  // オブジェクトの配列に変換: [{"接客サービスID": "test", "接客サービス名": "初回来訪のユーザーに接客", ...}, ...]
  const fieldNames = csvRows[0]; // 1行目がヘッダー行
  csvRows = csvRows.slice(1);
  const objArr = csvRows.map(row => {
    const obj = {};
    row.forEach((field, i) => {
      obj[fieldNames[i]] = field;
    });
    return obj;
  });

  // 表示対象のフィールドに絞った上で「配列の配列」に戻す: [["接客サービス名", "接客サービスID"], ["初回来訪のユーザーに接客", "test"], ...]
  const values = [];
  if (UPDATE_TYPE === 'REPLACE' || isSheetEmpty) {
    // REPLACEの場合、またはAPPENDでシートが空の場合は、ヘッダー行を追加
    values.push(_fieldsToDisplay);
  }
  objArr.forEach(obj => {
    const row = _fieldsToDisplay.map(fieldName => {
      if (fieldName === CREATED_AT_COLUMN_NAME) {
        return createdAt; // 更新日カラムを追加
      }
      return obj[fieldName];
    });
    values.push(row);
  });
  return values;
}

async function clearSsValues(sheets, sheetName) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
}
// REPLACE または APPEND でシートを更新
async function updateSsValues({ sheets, range, values }) {
  const options = {
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED', // Userの入力値と同様に扱う
    resource: {
      values,
    },
  };
  if (UPDATE_TYPE === 'REPLACE') {
    await clearSsValues(sheets, DATA_SHEET_NAME);
    await sheets.spreadsheets.values.update(options);
  } else {
    await sheets.spreadsheets.values.append(options);
  }
}

// ヘッダー行の出力有無を切り替えるために、データが空かどうかチェック
async function checkSsEmpty({ sheets }) {
  const range = `${DATA_SHEET_NAME}!A1`; // A1セルのデータ有無で判定する
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows = result.data.values;
  const isEmpty = !rows || rows.length === 0;
  return isEmpty;
}

// 「データ作成依頼」リクエスト済であることを __state シートに記録
async function writeDataCreationState({ sheets, logger }) {
  const startAt = format(toZonedTime(new Date(), 'Asia/Tokyo'), 'yyyy-MM-dd HH:mm:ss');
  const values = [['data_creation_start_at'], [startAt]];
  const range = `${STATE_SHEET_NAME}!A1:A2`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
  logger.debug(`[writeDataCreationState] write succeeded. data_creation_start_at: ${startAt}`);
}

// 「データ作成依頼」リクエスト済か（=リトライ実行か）どうかをチェック
async function checkDataCreationState({ sheets, logger }) {
  const range = `${STATE_SHEET_NAME}!A2`; // A2セルのデータ有無で判定する
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows = result.data.values;
  const hasRequested = !!(rows && rows.length > 0);
  logger.debug(`[checkDataCreationState] hasRequested: ${hasRequested}`);
  return hasRequested;
}

//  __state シートが無ければ作成する
async function createStateSheetIfNotExists({ sheets, logger }) {
  const sheetMetadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const sheetTitles = sheetMetadata.data.sheets.map(sheet => sheet.properties.title);

  // 指定したシート名が存在するかチェック
  if (!sheetTitles.includes(STATE_SHEET_NAME)) {
    // シートが存在しなければ作成
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: STATE_SHEET_NAME,
              },
            },
          },
        ],
      },
    });
    logger.debug(`[createStateSheetIfNotExists] sheet '${STATE_SHEET_NAME}' created`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, SERVICE_ACCOUNT_KEY_SECRET],
  });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];

  const sdk = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
  sdk.auth(appToken);

  // 相対日時（N日前）か絶対日時のうち、設定されている方を利用して期間指定する
  const { startDate, endDate } = makeStartEndDate(
    RELATIVE_START_DATE_DAYS_AGO,
    ABSOLUTE_START_DATE,
    ABSOLUTE_END_DATE
  );
  logger.debug(`startDate: ${startDate}, endDate: ${endDate}, range: ${AGGREGATION_RANGE}`);

  // スプレッドシートにアクセスするための認証を通す
  const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const jsonKey = JSON.parse(_jsonKey);
  const sheets = await getSsClient(jsonKey);

  // データ作成状態の管理用シートをチェック
  await createStateSheetIfNotExists({ sheets, logger });
  const hasRequested = await checkDataCreationState({ sheets, logger });

  const renew = !hasRequested;
  const { result, status } = await fetchCampaignSettingsAndStats({
    startDate,
    endDate,
    range: AGGREGATION_RANGE,
    renew,
    sdk,
    logger,
  });
  logger.debug(`fetchCampaignSettingsAndStats done. status: ${status}`);

  // CSVの作成リクエストが受け付けられた場合、または作成中の場合、リトライする
  if (status === 202) {
    if (renew) {
      await writeDataCreationState({ sheets, logger });
      throw new RetryableError(`Data creation request accepted. Wait for the next retry.`);
    }
    throw new RetryableError(`Data creation in progress. Wait for the next retry.`);
  }

  if (status !== 200) {
    return logger.error(`Request failed with status ${status}`);
  }

  const isSheetEmpty = await checkSsEmpty({ sheets, logger });

  const ssValues = makeSsValues({
    stats: result,
    fieldsToDisplay: FIELDS_TO_DISPLAY,
    isSheetEmpty,
    logger,
  });
  logger.debug(`result row size: ${ssValues.length}`);

  await updateSsValues({ sheets, range: `${DATA_SHEET_NAME}!A1:AZ`, values: ssValues });
  await clearSsValues(sheets, STATE_SHEET_NAME);
  logger.log(`spreadsheet update succeeded.`);
}
