import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_ACCESS_TOKEN_SECRET = '<% INSTAGRAM_ACCESS_TOKEN_SECRET %>';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '<% INSTAGRAM_BUSINESS_ACCOUNT_ID %>';
const GRAPH_API_VERSION = '<% GRAPH_API_VERSION %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const SHEET_NAME = '<% SHEET_NAME %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';

const HEADERS = {
  header1: [['集計開始日時', '集計終了日時']],
  header2: [
    [
      'フォロワー数',
      'フォロワー増減数',
      '投稿数',
      'リーチしたアカウント数',
      'インプレッション数',
      'プロフィール閲覧数',
      'Webサイトクリック数',
    ],
  ],
  header3: [
    [
      'アクションを実行したアカウント数',
      'インタラクション数',
      'いいね数',
      'コメント数',
      '保存数',
      '返信数',
      'シェア数',
    ],
  ],
  engagedAudienceHeader: [['エンゲージメントのあるオーディエンスの利用者層']],
  demographicsHeader: [['国', '', '地域', '', '年代層', '', '性別']],
  reachedAudienceHeader: [['リーチしたオーディエンスの利用者層']],
  followerAudienceHeader: [['フォロワーの利用者層']],
};

const RANGES = {
  header1: `${SHEET_NAME}!A1:B1`,
  header2: `${SHEET_NAME}!A3:G3`,
  header3: `${SHEET_NAME}!A5:G5`,
  engagedAudienceHeader: `${SHEET_NAME}!A8`,
  demographicsHeader: `${SHEET_NAME}!A9:G9`,
  reachedAudienceHeader: `${SHEET_NAME}!A17`,
  reachedDemographicsHeader: `${SHEET_NAME}!A18:G18`,
  followerAudienceHeader: `${SHEET_NAME}!A26`,
  followerDemographicsHeader: `${SHEET_NAME}!A27:G27`,
};

const AUDIENCE_METRICS = [
  'engaged_audience_demographics',
  'reached_audience_demographics',
  'follower_demographics',
];
const BREAKDOWNS = ['country', 'city', 'age', 'gender'];

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

// 共通のfetch処理関数
async function fetchFromApi(url, logger) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${JSON.stringify(errorDetails)}`
      );
    }
    return await response.json();
  } catch (error) {
    logger.error(`Fetch error for URL ${url}: ${error.message}`);
    throw error;
  }
}

// オーディエンス属性データを取得する関数（サブ関数）
async function fetchDemographics(insightsUrl, logger) {
  const result = await fetchFromApi(insightsUrl, logger);

  if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
    throw new Error('Demographics data not found: No data array in the response');
  }
  const totalValue = result.data[0].total_value;
  if (
    !totalValue ||
    !totalValue.breakdowns ||
    !Array.isArray(totalValue.breakdowns) ||
    totalValue.breakdowns.length === 0
  ) {
    throw new Error('Demographics data not found: No breakdowns in the response');
  }
  const breakdownResults = totalValue.breakdowns[0].results;
  if (!Array.isArray(breakdownResults)) {
    throw new Error('Demographics data not found: No results array in the breakdowns');
  }
  return breakdownResults.map(d => ({
    dimensionValues: d.dimension_values,
    value: d.value,
  }));
}

// フォロワー数と投稿数を取得する関数
async function fetchFollowerAndMediaCount(accessToken, businessAccountId, graphApiVersion, logger) {
  const fields = 'followers_count,media_count';
  const url = `https://graph.facebook.com/${graphApiVersion}/${businessAccountId}?fields=${fields}&access_token=${accessToken}`;

  const result = await fetchFromApi(url, logger);

  const { followers_count: followersCount, media_count: mediaCount } = result;
  if (followersCount == null || mediaCount == null) {
    throw new Error('Followers count or media count not found in the response');
  }

  return { followersCount, mediaCount };
}

// インタラクションデータを取得する関数
async function fetchInteractionData({
  accessToken,
  businessAccountId,
  graphApiVersion,
  sinceUnixTime,
  untilUnixTime,
  logger,
}) {
  const metrics =
    'impressions,reach,total_interactions,accounts_engaged,likes,comments,saves,shares,replies,follows_and_unfollows,website_clicks,profile_views';
  const metricTypeParam = '&metric_type=total_value';
  const insightsUrl = `https://graph.facebook.com/${graphApiVersion}/${businessAccountId}/insights?metric=${metrics}&period=day&since=${sinceUnixTime}&until=${untilUnixTime}&access_token=${accessToken}${metricTypeParam}`;

  const insightsResult = await fetchFromApi(insightsUrl, logger);

  const { data: insightsData } = insightsResult;
  if (!insightsData || !Array.isArray(insightsData) || insightsData.length === 0) {
    throw new Error('Interaction data not found in the response');
  }

  const interactionData = metrics.split(',').reduce((acc, metric) => {
    acc[metric] = 0;
    return acc;
  }, {});

  insightsData.forEach(metric => {
    const value = metric.total_value ? metric.total_value.value : 0;
    interactionData[metric.name] = value;
  });

  return interactionData;
}

// オーディエンス属性データを取得する関数
async function fetchDemographicsData(accessToken, businessAccountId, graphApiVersion, logger) {
  const metricBreakdownMapping = {
    engaged_audience_demographics: [
      'engagedAudienceCountry',
      'engagedAudienceCity',
      'engagedAudienceAge',
      'engagedAudienceGender',
    ],
    reached_audience_demographics: [
      'reachedAudienceCountry',
      'reachedAudienceCity',
      'reachedAudienceAge',
      'reachedAudienceGender',
    ],
    follower_demographics: [
      'followerAudienceCountry',
      'followerAudienceCity',
      'followerAudienceAge',
      'followerAudienceGender',
    ],
  };

  const demographicsData = Object.values(metricBreakdownMapping)
    .flat()
    .reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

  // メトリクスごとにAPIリクエストを行う関数
  const fetchDemographicsForMetric = async (metric, breakdown) => {
    const audienceUrl = `https://graph.facebook.com/${graphApiVersion}/${businessAccountId}/insights?metric=${metric}&period=lifetime&timeframe=this_month&breakdown=${breakdown}&metric_type=total_value&access_token=${accessToken}`;
    const result = await fetchDemographics(audienceUrl, logger);
    if (!result || !Array.isArray(result)) {
      throw new Error(
        `Demographics data for ${metric} with ${breakdown} breakdown not found in the response`
      );
    }
    return result;
  };

  // メトリクスとブレークダウンの組み合わせに対してAPIリクエストを行い、データを設定する関数
  const setDemographicsData = async (metric, breakdown, key) => {
    const result = await fetchDemographicsForMetric(metric, breakdown);
    demographicsData[key] = result;
  };

  // すべてのメトリクスとブレークダウンの組み合わせに対してAPIリクエストを行う
  const promises = AUDIENCE_METRICS.flatMap(metric =>
    BREAKDOWNS.map((breakdown, breakdownIndex) => {
      const key = metricBreakdownMapping[metric][breakdownIndex];
      return setDemographicsData(metric, breakdown, key);
    })
  );

  await Promise.all(promises);

  return demographicsData;
}

// スプレッドシートにヘッダーと取得したデータを書き込む関数
async function writeHeaders(
  sheets,
  spreadsheetId,
  sheetName,
  sinceFormattedJST,
  untilFormattedJST
) {
  const requests = [
    {
      range: RANGES.header1,
      values: HEADERS.header1,
    },
    {
      range: `${sheetName}!A2:B2`,
      values: [[sinceFormattedJST, untilFormattedJST]],
    },
    {
      range: RANGES.header2,
      values: HEADERS.header2,
    },
    {
      range: RANGES.header3,
      values: HEADERS.header3,
    },
    {
      range: RANGES.engagedAudienceHeader,
      values: HEADERS.engagedAudienceHeader,
    },
    {
      range: RANGES.demographicsHeader,
      values: HEADERS.demographicsHeader,
    },
    {
      range: RANGES.reachedAudienceHeader,
      values: HEADERS.reachedAudienceHeader,
    },
    {
      range: RANGES.reachedDemographicsHeader,
      values: HEADERS.demographicsHeader,
    },
    {
      range: RANGES.followerAudienceHeader,
      values: HEADERS.followerAudienceHeader,
    },
    {
      range: RANGES.followerDemographicsHeader,
      values: HEADERS.demographicsHeader,
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: requests,
    },
  });
}

// オーディエンスデータをソートして取得する関数
function getSortedAudienceData(data, sortBy) {
  return data
    .map(d => ({
      dimensionValues: d.dimensionValues[0],
      value: d.value || 0,
    }))
    .sort(sortBy);
}

// ソート関数を定義
function countrySort(a, b) {
  return b.value - a.value || a.dimensionValues.localeCompare(b.dimensionValues);
}

function ageSort(a, b) {
  return a.dimensionValues.localeCompare(b.dimensionValues, undefined, { numeric: true });
}

function genderSort(a, b) {
  return ['F', 'M', 'U'].indexOf(a.dimensionValues) - ['F', 'M', 'U'].indexOf(b.dimensionValues);
}

// sinceUnixTimeとuntilUnixTimeを計算する関数
function calculateUnixTimes(daysBeforeEndDate) {
  const now = new Date();
  const since = new Date();
  since.setDate(now.getDate() - daysBeforeEndDate);

  const sinceUnixTime = Math.floor(since.getTime() / 1000);
  const untilUnixTime = Math.floor(now.getTime() / 1000);

  return { sinceUnixTime, untilUnixTime };
}

// JSTに変換する関数
function convertToJST(date) {
  const jstOffset = 9 * 60; // JSTはUTC+9時間
  return new Date(date.getTime() + jstOffset * 60000)
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);
}

// 性別の値を日本語に変換する関数
function convertGenderToJapanese(gender) {
  if (gender === 'F') return '女性';
  if (gender === 'M') return '男性';
  return '不明';
}

// データを処理してリクエストを生成する関数
function createAudienceRequests({ sheetName, data, sortFunction, rangeStart, colStart }) {
  return getSortedAudienceData(data, sortFunction)
    .slice(0, 6)
    .map((entry, index) => ({
      range: `${sheetName}!${colStart}${rangeStart + index}:${String.fromCharCode(colStart.charCodeAt(0) + 1)}${rangeStart + index}`,
      values: [[entry.dimensionValues, entry.value]],
    }));
}

// ジェンダーデータを処理してリクエストを生成する関数
function createGenderRequests({ sheetName, data, sortFunction, rangeStart, colStart }) {
  return getSortedAudienceData(data, sortFunction)
    .slice(0, 6)
    .map((entry, index) => ({
      range: `${sheetName}!${colStart}${rangeStart + index}:${String.fromCharCode(colStart.charCodeAt(0) + 1)}${rangeStart + index}`,
      values: [[convertGenderToJapanese(entry.dimensionValues), entry.value]],
    }));
}

// 基本データのリクエストを生成する関数
function createBasicDataRequests({ sheetName, data }) {
  const {
    followersCount,
    mediaCount,
    impressions,
    reach,
    totalInteractions,
    accountsEngaged,
    likes,
    comments,
    saves,
    shares,
    replies,
    followsAndUnfollows,
    websiteClicks,
    profileViews,
  } = data;
  return [
    { range: `${sheetName}!A4`, values: [[followersCount]] },
    { range: `${sheetName}!C4`, values: [[mediaCount]] },
    { range: `${sheetName}!E4`, values: [[impressions]] },
    { range: `${sheetName}!D4`, values: [[reach]] },
    { range: `${sheetName}!B6`, values: [[totalInteractions]] },
    { range: `${sheetName}!A6`, values: [[accountsEngaged]] },
    { range: `${sheetName}!C6`, values: [[likes]] },
    { range: `${sheetName}!D6`, values: [[comments]] },
    { range: `${sheetName}!E6`, values: [[saves]] },
    { range: `${sheetName}!G6`, values: [[shares]] },
    { range: `${sheetName}!F6`, values: [[replies]] },
    { range: `${sheetName}!B4`, values: [[followsAndUnfollows]] },
    { range: `${sheetName}!G4`, values: [[websiteClicks]] },
    { range: `${sheetName}!F4`, values: [[profileViews]] },
  ];
}

// demographicsデータのリクエストを生成する関数
function createDemographicsRequests({ sheetName, demographicsData }) {
  const {
    engagedAudienceCountry,
    engagedAudienceCity,
    engagedAudienceAge,
    engagedAudienceGender,
    reachedAudienceCountry,
    reachedAudienceCity,
    reachedAudienceAge,
    reachedAudienceGender,
    followerAudienceCountry,
    followerAudienceCity,
    followerAudienceAge,
    followerAudienceGender,
  } = demographicsData;
  return [
    ...createAudienceRequests({
      sheetName,
      data: engagedAudienceCountry,
      sortFunction: countrySort,
      rangeStart: 10,
      colStart: 'A',
    }),
    ...createAudienceRequests({
      sheetName,
      data: engagedAudienceCity,
      sortFunction: countrySort,
      rangeStart: 10,
      colStart: 'C',
    }),
    ...createAudienceRequests({
      sheetName,
      data: engagedAudienceAge,
      sortFunction: ageSort,
      rangeStart: 10,
      colStart: 'E',
    }),
    ...createGenderRequests({
      sheetName,
      data: engagedAudienceGender,
      sortFunction: genderSort,
      rangeStart: 10,
      colStart: 'G',
    }),
    ...createAudienceRequests({
      sheetName,
      data: reachedAudienceCountry,
      sortFunction: countrySort,
      rangeStart: 19,
      colStart: 'A',
    }),
    ...createAudienceRequests({
      sheetName,
      data: reachedAudienceCity,
      sortFunction: countrySort,
      rangeStart: 19,
      colStart: 'C',
    }),
    ...createAudienceRequests({
      sheetName,
      data: reachedAudienceAge,
      sortFunction: ageSort,
      rangeStart: 19,
      colStart: 'E',
    }),
    ...createGenderRequests({
      sheetName,
      data: reachedAudienceGender,
      sortFunction: genderSort,
      rangeStart: 19,
      colStart: 'G',
    }),
    ...createAudienceRequests({
      sheetName,
      data: followerAudienceCountry,
      sortFunction: countrySort,
      rangeStart: 28,
      colStart: 'A',
    }),
    ...createAudienceRequests({
      sheetName,
      data: followerAudienceCity,
      sortFunction: countrySort,
      rangeStart: 28,
      colStart: 'C',
    }),
    ...createAudienceRequests({
      sheetName,
      data: followerAudienceAge,
      sortFunction: ageSort,
      rangeStart: 28,
      colStart: 'E',
    }),
    ...createGenderRequests({
      sheetName,
      data: followerAudienceGender,
      sortFunction: genderSort,
      rangeStart: 28,
      colStart: 'G',
    }),
  ];
}

// スプレッドシートに取得したデータを書き込む関数
async function writeDataToSpreadsheet({
  sheets,
  spreadsheetId,
  sheetName,
  data,
  demographicsData,
}) {
  const basicDataRequests = createBasicDataRequests({ sheetName, data });
  const demographicsRequests = createDemographicsRequests({ sheetName, demographicsData });
  const requests = [...basicDataRequests, ...demographicsRequests];
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: requests,
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({
    keys: [SERVICE_ACCOUNT_KEY_SECRET, INSTAGRAM_ACCESS_TOKEN_SECRET],
  });
  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const sheets = await createSheetsClient(saKeyJson);
  const accessToken = secrets[INSTAGRAM_ACCESS_TOKEN_SECRET];

  try {
    const { followersCount, mediaCount } = await fetchFollowerAndMediaCount(
      accessToken,
      INSTAGRAM_BUSINESS_ACCOUNT_ID,
      GRAPH_API_VERSION,
      logger
    );

    const { sinceUnixTime, untilUnixTime } = calculateUnixTimes(DAY_BEFORE_END_DATE);

    const interactionData = await fetchInteractionData({
      accessToken,
      businessAccountId: INSTAGRAM_BUSINESS_ACCOUNT_ID,
      graphApiVersion: GRAPH_API_VERSION,
      sinceUnixTime,
      untilUnixTime,
      logger,
    });

    const demographicsData = await fetchDemographicsData(
      accessToken,
      INSTAGRAM_BUSINESS_ACCOUNT_ID,
      GRAPH_API_VERSION,
      logger
    );

    interactionData.followersCount = followersCount;
    interactionData.mediaCount = mediaCount;

    const since = new Date(sinceUnixTime * 1000);
    const until = new Date(untilUnixTime * 1000);

    const sinceFormattedJST = convertToJST(since);
    const untilFormattedJST = convertToJST(until);

    await writeHeaders(sheets, SPREADSHEET_ID, SHEET_NAME, sinceFormattedJST, untilFormattedJST);
    await writeDataToSpreadsheet({
      sheets,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      data: interactionData,
      demographicsData,
    });
  } catch (error) {
    logger.error('Error fetching data from Instagram Graph API:', error);
  }
}
