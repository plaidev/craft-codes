import { google } from 'googleapis';
import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const GA4_PROPERTY_ID = '<% GA4_PROPERTY_ID %>';
const CV_EVENTS_AND_LIMITS_SETTING = '<% CV_EVENTS_AND_LIMITS_SETTING %>';

// 日本の祝日を取得する関数
async function getJapaneseHolidays() {
  const url = 'https://holidays-jp.github.io/api/v1/date.json';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`祝日のデータを取得できませんでした。: ${response.status}`);
  }
  const holidays = await response.json();
  return Object.keys(holidays); // 祝日の日付のリストを返す
}

// 平日かどうかを判断する関数
function isWeekendOrHoliday(date, holidays) {
  const dayOfWeek = date.getDay();
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD形式
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 土曜日は6、日曜日は0
  const isHoliday = holidays.includes(formattedDate);
  return isWeekend || isHoliday;
}

// コンバージョンイベントのデータを取得する関数
async function getConversionEventMetrics(auth, date, eventName, logger) {
  const analyticsDataClient = google.analyticsdata({
    version: 'v1beta',
    auth,
  });

  const formattedDate = date.toISOString().split('T')[0];

  try {
    const eventResponse = await analyticsDataClient.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [
          {
            startDate: formattedDate,
            endDate: formattedDate,
          },
        ],
        dimensions: [
          {
            name: 'eventName',
          },
        ],
        metrics: [
          {
            name: 'eventCount',
          },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: eventName,
            },
          },
        },
      },
    });

    const eventCount = eventResponse.data.rows?.[0].metricValues[0].value ?? '0';

    return {
      eventCount: parseInt(eventCount, 10),
    };
  } catch (error) {
    logger.error(`コンバージョンイベント "${eventName}" のデータを取得できませんでした。:`, error);
    throw error;
  }
}

// サイトのセッション数を取得する関数
async function getSessionsMetrics(auth, date, logger) {
  const analyticsDataClient = google.analyticsdata({
    version: 'v1beta',
    auth,
  });

  const formattedDate = date.toISOString().split('T')[0];

  try {
    const sessionResponse = await analyticsDataClient.properties.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [
          {
            startDate: formattedDate,
            endDate: formattedDate,
          },
        ],
        metrics: [
          {
            name: 'sessions',
          },
        ],
      },
    });

    const sessions = sessionResponse.data.rows?.[0].metricValues[0].value ?? '0';

    return {
      sessions: parseInt(sessions, 10),
    };
  } catch (error) {
    logger.error('サイトのセッション数を取得できませんでした。:', error);
    throw error;
  }
}

// 各イベントのメトリクスを並列で取得する関数
async function fetchAllEventMetrics(auth, date, conversionEventsConfig, logger) {
  const promises = conversionEventsConfig.map(eventConfig =>
    getConversionEventMetrics(auth, date, eventConfig.eventName, logger)
      .then(metrics => ({ eventName: eventConfig.eventName, metrics }))
      .catch(error => {
        logger.error(
          `イベント "${eventConfig.eventName}" のデータ取得中にエラーが発生しました: ${error}`
        );
        // エラーが発生しても他のプロミスの処理を続けるためにnullのメトリクスを返す
        return { eventName: eventConfig.eventName, metrics: null };
      })
  );

  const results = await Promise.all(promises);
  const eventMetrics = results.reduce((acc, { eventName, metrics }) => {
    if (metrics) {
      acc[eventName] = metrics;
    }
    return acc;
  }, {});

  return eventMetrics;
}

function parseConversionEventsConfig(configStr) {
  const eventPairs = configStr.split(',');
  const config = eventPairs
    .map(pair => {
      const [eventName, cvrStr] = pair.split(':');
      const cvrLowerLimit = parseFloat(cvrStr);
      if (!Number.isNaN(cvrLowerLimit)) {
        return { eventName, cvrLowerLimit };
      }
      return null;
    })
    .filter(item => item !== null);

  return config;
}

// メッセージを組み立てる関数
function buildSlackMessage(
  date,
  isHolidayPeriod,
  sessionMetrics,
  eventMetrics,
  conversionEventsConfig
) {
  const formattedDate = date.toISOString().split('T')[0];
  let message = `${formattedDate} のコンバージョンイベント集計\n\n`;

  if (isHolidayPeriod) {
    message += `※この日は休日です。\n\n`;
  }

  const cvrMessages = []; // CVRに関するメッセージを格納する配列

  // 各イベントについてメッセージを組み立てる
  conversionEventsConfig.forEach(eventConfig => {
    const eventName = eventConfig.eventName;
    const metrics = eventMetrics[eventName];
    if (!metrics) return;

    const eventCount = metrics.eventCount;
    const sessions = sessionMetrics.sessions;
    const conversionRate = sessions > 0 ? (eventCount / sessions) * 100 : 0;
    const cvrLowerLimit = eventConfig.cvrLowerLimit;

    message += `${eventName}\n CV数：${eventCount}、セッション数：${sessions}、CVR：${conversionRate.toFixed(1)}%\n\n`;

    // 休日ではない場合にのみCVRが下限値を下回った場合のメッセージを追加
    if (!isHolidayPeriod && conversionRate < cvrLowerLimit) {
      cvrMessages.push(`注意: ${eventName}イベントのCVRが下限値を下回っています:pleading_face:\n`);
    }
  });

  // 休日ではない場合にCVRの結果に基づいてメッセージに文言を追加
  if (!isHolidayPeriod) {
    if (cvrMessages.length > 0) {
      // CVRが下限値を下回っているイベントのメッセージを追加
      message += `\n${cvrMessages.join('\n')}`;
    } else {
      // 全てのCVRが下限値を上回っている場合のメッセージを追加
      message += '\n全てのコンバージョンイベントのCVRが下限値を上回っています:hugging_face:\n';
    }
  }

  return message;
}

async function sendSlackMessage(channelId, message, { slackClient, logger }) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });
  } catch (error) {
    logger.error('Slackへのメッセージ送信時にエラーが発生しました:', error.message);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({
    keys: [SERVICE_ACCOUNT_KEY_SECRET, SLACK_TOKEN_SECRET],
  });

  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token);

  // Google Analytics APIへの認証を設定
  const auth = new google.auth.GoogleAuth({
    credentials: saKeyJson,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const holidays = await getJapaneseHolidays();
  const isHolidayPeriod = isWeekendOrHoliday(yesterday, holidays);

  const sessionMetrics = await getSessionsMetrics(auth, yesterday, logger);
  const conversionEventsConfig = parseConversionEventsConfig(CV_EVENTS_AND_LIMITS_SETTING);

  // 各イベントのメトリクスを取得
  const eventMetrics = await fetchAllEventMetrics(auth, yesterday, conversionEventsConfig, logger);

  const message = buildSlackMessage(
    yesterday,
    isHolidayPeriod,
    sessionMetrics,
    eventMetrics,
    conversionEventsConfig
  );

  await sendSlackMessage(SLACK_CHANNEL_ID, message, { slackClient, logger });
}
