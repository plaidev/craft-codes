import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const WEATHER_API_KEY = '<% WEATHER_API_KEY %>';

const LOCATIONS = [
  { prefecture: '北海道', location: 'hokkaido', lat: '43.0352', lon: '141.2049' },
  { prefecture: '青森県', location: 'aomori', lat: '40.4928', lon: '140.4424' },
  { prefecture: '岩手県', location: 'iwate', lat: '39.4213', lon: '141.0910' },
  { prefecture: '宮城県', location: 'miyagi', lat: '38.1608', lon: '140.5220' },
  { prefecture: '秋田県', location: 'akita', lat: '39.4307', lon: '140.0609' },
  { prefecture: '山形県', location: 'yamagata', lat: '38.1426', lon: '140.2148' },
  { prefecture: '福島県', location: 'fukushima', lat: '37.4500', lon: '140.2804' },
  { prefecture: '茨城県', location: 'ibaraki', lat: '36.2030', lon: '140.2649' },
  { prefecture: '栃木県', location: 'tochigi', lat: '36.3357', lon: '139.5301' },
  { prefecture: '群馬県', location: 'gunma', lat: '36.2328', lon: '139.0339' },
  { prefecture: '埼玉県', location: 'saitama', lat: '35.5125', lon: '139.3856' },
  { prefecture: '千葉県', location: 'chiba', lat: '35.3616', lon: '140.0723' },
  { prefecture: '東京都', location: 'tokyo', lat: '35.4122', lon: '139.4130' },
  { prefecture: '神奈川県', location: 'kanagawa', lat: '35.2652', lon: '139.3833' },
  { prefecture: '新潟県', location: 'niigata', lat: '37.5409', lon: '139.0124' },
  { prefecture: '富山県', location: 'toyama', lat: '36.4143', lon: '137.1241' },
  { prefecture: '石川県', location: 'ishikawa', lat: '36.3541', lon: '136.3732' },
  { prefecture: '福井県', location: 'fukui', lat: '36.0355', lon: '136.1318' },
  { prefecture: '山梨県', location: 'yamanashi', lat: '36.3950', lon: '138.3406' },
  { prefecture: '長野県', location: 'nagano', lat: '36.3905', lon: '138.1051' },
  { prefecture: '岐阜県', location: 'gifu', lat: '36.0355', lon: '136.4320' },
  { prefecture: '静岡県', location: 'shizuoka', lat: '34.5837', lon: '138.2259' },
  { prefecture: '愛知県', location: 'aichi', lat: '35.1049', lon: '136.5429' },
  { prefecture: '三重県', location: 'mie', lat: '34.4349', lon: '136.3031' },
  { prefecture: '滋賀県', location: 'shiga', lat: '35.0016', lon: '135.5206' },
  { prefecture: '京都府', location: 'kyoto', lat: '35.0116', lon: '135.4520' },
  { prefecture: '大阪府', location: 'osaka', lat: '34.4111', lon: '135.3112' },
  { prefecture: '兵庫県', location: 'hyogo', lat: '34.4129', lon: '135.1059' },
  { prefecture: '奈良県', location: 'nara', lat: '34.4107', lon: '135.4958' },
  { prefecture: '和歌山県', location: 'wakayama', lat: '34.1334', lon: '135.1003' },
  { prefecture: '鳥取県', location: 'tottori', lat: '35.3012', lon: '134.1418' },
  { prefecture: '島根県', location: 'shimane', lat: '35.2820', lon: '133.0302' },
  { prefecture: '岡山県', location: 'okayama', lat: '34.3942', lon: '133.5606' },
  { prefecture: '広島県', location: 'hiroshima', lat: '34.2348', lon: '132.2735' },
  { prefecture: '山口県', location: 'yamaguchi', lat: '34.1109', lon: '131.2817' },
  { prefecture: '徳島県', location: 'tokushima', lat: '34.0357', lon: '134.3334' },
  { prefecture: '香川県', location:   'kagawa', lat: '34.2024', lon: '134.0236' },
  { prefecture: '愛媛県', location: 'ehime', lat: '33.5030', lon: '132.4558' },
  { prefecture: '高知県', location: 'kochi', lat: '33.3335', lon: '133.3152' },
  { prefecture: '福岡県', location: 'fukuoka', lat: '33.3623', lon: '130.2505' },
  { prefecture: '佐賀県', location: 'saga', lat: '33.1458', lon: '130.1757' },
  { prefecture: '長崎県', location: 'nagasaki', lat: '32.4500', lon: '129.5202' },
  { prefecture: '熊本県', location: 'kumamoto', lat: '32.4723', lon: '130.4430' },
  { prefecture: '大分県', location: 'oita', lat: '33.1417', lon: '131.3645' },
  { prefecture: '宮崎県', location: 'miyazaki', lat: '31.5440', lon: '131.2526' },
  { prefecture: '鹿児島県', location: 'kagoshima', lat: '31.3337', lon: '130.3329' },
  { prefecture: '沖縄県', location: 'okinawa', lat: '26.1245', lon: '127.4051' },
];

// 複数範囲のspreadsheetの内容を書き込みする https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate?hl=ja
async function updateSsValues(sheets, range, values) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      valueInputOption: 'USER_ENTERED', // Userの入力値と同様に扱う
      data: [
        {
          range,
          values,
        },
      ],
    },
  });
}

// Weather APIを使って、現在の天気情報を取得
async function fetchData({ location, rows, logger }) {
  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location.lat},${location.lon}&lang=ja`;
  try {
    const response = await fetch(apiUrl);
    const responseData = await response.json();

    const tempC = responseData.current.temp_c;
    // https://www.weatherapi.com/docs/weather_conditions.json を参考
    const conditionText = responseData.current.condition.text;
    const { lat, lon } = responseData.location;

    rows.push([location.prefecture, tempC, conditionText, lat, lon]);
  } catch (error) {
    logger.debug('Error weather api fetch:', error);
    return null;
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GoogleサービスアカウントのJSONキーをシークレットから取得
  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const jsonKeySecrets = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const jsonKey = JSON.parse(jsonKeySecrets);

  // Google Drive APIの初期化
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();

  // spreadsheetを取得
  const sheets = google.sheets({ version: 'v4', auth: jwtClient });

  const rows = [['prefecture', 'temp_c', 'tenki', 'lat', 'lon']];

  try {
    await Promise.all(LOCATIONS.map(location => fetchData({ location, rows, logger })));
    await updateSsValues(sheets, `${SHEET_NAME}!1:${LOCATIONS.length + 1}`, rows);
    logger.debug('Data fetch completed:', rows);
    res.status(200).send({ message: 'Success' });
  } catch (error) {
    logger.debug('Data fetch Failed:', error);
    res.status(500).send({ message: 'Data fetch Failed' });
  }
}