import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const OAUTH2_CLIENT_CREDENTIALS_SECRET = '<% OAUTH2_CLIENT_CREDENTIALS_SECRET %>';
const REFRESH_TOKEN_SECRET = '<% REFRESH_TOKEN_SECRET %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const START_YEAR = '<% START_YEAR %>';
const START_MONTH = '<% START_MONTH %>';
const END_YEAR = '<% END_YEAR %>';
const END_MONTH = '<% END_MONTH %>';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const BASE_API_V4_URL = 'https://mybusiness.googleapis.com/v4';
const BASE_API_V1_URL = 'https://businessprofileperformance.googleapis.com/v1';

const DAYS = {
  MONDAY: '月曜日',
  TUESDAY: '火曜日',
  WEDNESDAY: '水曜日',
  THURSDAY: '木曜日',
  FRIDAY: '金曜日',
  SATURDAY: '土曜日',
  SUNDAY: '日曜日',
};

const HEADER = [
  '計測開始年月',
  '計測終了年月',
  'ビジネス名',
  '電話番号',
  'ビジネスカテゴリ',
  '郵便番号',
  '都道府県',
  '住所',
  'Webサイト',
  '営業時間',
  'Google Map URL',
  '平均点数',
  'レビュー数',
  '投稿写真数',
  '上位キーワードと表示回数',
];

async function createSheetsClient(saKeyJson) {
  const authClient = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: [SHEETS_SCOPE],
  });

  const auth = await authClient.getClient();
  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  return sheets;
}

function parseOAuth2Credentials(credentialData) {
  const credentials = JSON.parse(credentialData);
  const { installed, web } = credentials;
  if (installed) return installed;
  if (web) return web;
  throw new Error('Invalid credentials format');
}

async function getAccountName(oAuth2Client) {
  const mybusinessaccountmanagement = google.mybusinessaccountmanagement('v1');
  const res = await mybusinessaccountmanagement.accounts.list({
    auth: oAuth2Client,
  });
  if (res.data.accounts && res.data.accounts.length > 0) return res.data.accounts[0].name;
  throw new Error('No accounts found');
}

async function listLocations(oAuth2Client, accountName) {
  const mybusinessbusinessinformation = google.mybusinessbusinessinformation('v1');
  const res = await mybusinessbusinessinformation.accounts.locations.list({
    auth: oAuth2Client,
    parent: accountName,
    readMask: 'name',
  });
  if (res.data.locations && res.data.locations.length > 0) return res.data.locations;
  throw new Error('No locations found');
}

async function getLocationDetails(oAuth2Client, locationName) {
  const mybusinessbusinessinformation = google.mybusinessbusinessinformation('v1');
  const res = await mybusinessbusinessinformation.locations.get({
    auth: oAuth2Client,
    name: locationName,
    readMask:
      'name,title,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours,metadata,profile,relationshipData,serviceItems',
  });
  return res.data;
}

async function listMedia(oAuth2Client, accountName, locationName) {
  const url = `${BASE_API_V4_URL}/${accountName}/${locationName}/media`;
  const res = await oAuth2Client.request({ url, method: 'GET', params: { pageSize: 1 } });
  return res.data.totalMediaItemCount || 0;
}

async function listReviews(oAuth2Client, accountName, locationName) {
  const url = `${BASE_API_V4_URL}/${accountName}/${locationName}/reviews`;
  const res = await oAuth2Client.request({ url, method: 'GET', params: { pageSize: 1 } });
  return {
    averageRating: res.data.averageRating || 0,
    totalReviewCount: res.data.totalReviewCount || 0,
    nextPageToken: res.data.nextPageToken || '',
  };
}

async function listSearchKeywordImpressions(oAuth2Client, locationName) {
  const url = `${BASE_API_V1_URL}/${locationName}/searchkeywords/impressions/monthly`;
  const res = await oAuth2Client.request({
    url,
    method: 'GET',
    params: {
      'monthlyRange.start_month.year': START_YEAR,
      'monthlyRange.start_month.month': START_MONTH,
      'monthlyRange.end_month.year': END_YEAR,
      'monthlyRange.end_month.month': END_MONTH,
      pageSize: 100,
    },
  });
  return res.data.searchKeywordsCounts ?? [];
}

async function fetchLocationDetails(oAuth2Client, accountName, location, logger) {
  try {
    const details = await getLocationDetails(oAuth2Client, location.name);
    const mediaCount = await listMedia(oAuth2Client, accountName, location.name);
    const reviews = await listReviews(oAuth2Client, accountName, location.name);
    const searchKeywordsImpressions = await listSearchKeywordImpressions(
      oAuth2Client,
      location.name
    );
    return { ...details, mediaCount, reviews, searchKeywordsImpressions };
  } catch (error) {
    logger.error(`Error fetching details for location ${location.name}: ${error.message}`, error);
    return null;
  }
}

async function getDetailedLocationsWithMediaAndReviews(
  oAuth2Client,
  accountName,
  locations,
  logger
) {
  const detailedLocations = await Promise.all(
    locations.map(location => fetchLocationDetails(oAuth2Client, accountName, location, logger))
  );

  return detailedLocations.filter(location => location !== null);
}

function formatRegularHours(regularHours) {
  if (!regularHours?.periods) return '';

  return regularHours.periods
    .map(period => {
      const openDay = DAYS[period.openDay];
      const openTime = `${period.openTime.hours}時00分`;
      const closeTime = `${period.closeTime.hours}時00分`;
      return `${openDay}: ${openTime}〜${closeTime}`;
    })
    .join(', ');
}

function formatSearchKeywordsImpressions(searchKeywordsImpressions) {
  return searchKeywordsImpressions
    .slice(0, 5)
    .map(keyword => {
      const value = keyword.insightsValue.value || keyword.insightsValue.threshold;
      return `${keyword.searchKeyword}: ${value}回`;
    })
    .join(', ');
}

function formatDataForSheet(detailedLocations) {
  const startDate = `${START_YEAR}年${START_MONTH}月`;
  const endDate = `${END_YEAR}年${END_MONTH}月`;

  return detailedLocations.map(loc => [
    startDate,
    endDate,
    loc.title,
    loc.phoneNumbers.primaryPhone || '',
    loc.categories.primaryCategory.displayName || '',
    loc.storefrontAddress.postalCode || '',
    loc.storefrontAddress.administrativeArea || '',
    (loc.storefrontAddress.addressLines ? loc.storefrontAddress.addressLines.join(' ') : '') || '',
    loc.websiteUri || '',
    formatRegularHours(loc.regularHours) || '',
    loc.metadata.mapsUri || '',
    loc.reviews.averageRating || 0,
    loc.reviews.totalReviewCount || 0,
    loc.mediaCount || 0,
    formatSearchKeywordsImpressions(loc.searchKeywordsImpressions) || '',
  ]);
}

async function writeDataToSheet(sheets, spreadsheetId, sheetName, values) {
  const request = {
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    resource: {
      values: [HEADER, ...values],
    },
  };

  await sheets.spreadsheets.values.update(request);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [OAUTH2_CLIENT_CREDENTIALS_SECRET, REFRESH_TOKEN_SECRET, SERVICE_ACCOUNT_KEY_SECRET],
    });
    const oAuth2CredentialSecretData = secrets[OAUTH2_CLIENT_CREDENTIALS_SECRET];
    const refreshToken = secrets[REFRESH_TOKEN_SECRET];
    const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
    const sheets = await createSheetsClient(saKeyJson);

    const {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: redirectUris,
    } = parseOAuth2Credentials(oAuth2CredentialSecretData);

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);

    oAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const accountName = await getAccountName(oAuth2Client);
    const locations = await listLocations(oAuth2Client, accountName);
    const detailedLocations = await getDetailedLocationsWithMediaAndReviews(
      oAuth2Client,
      accountName,
      locations,
      logger
    );

    const formattedData = formatDataForSheet(detailedLocations);
    await writeDataToSheet(sheets, SPREADSHEET_ID, SHEET_NAME, formattedData);
  } catch (error) {
    logger.error('Error:', error);
  }
}
