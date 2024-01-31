import { google } from 'googleapis';
import { auth } from 'google-auth-library';
import { WebClient } from '@slack/web-api';
import { subDays, format } from 'date-fns';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SITE_URL = '<% SITE_URL %>';
const PAGE_URL = '<% PAGE_URL %>';
const RANK_DIFFERENCE_TO_NOTIFY = '<% RANK_DIFFERENCE_TO_NOTIFY %>';
const DAY_BEFORE_END_DATE = '<% DAY_BEFORE_END_DATE %>';

// Search Consoleの認証処理
async function createSearchConsoleClient(saKeyJson) {
  const client = auth.fromJSON(saKeyJson);
  client.scopes = ['https://www.googleapis.com/auth/webmasters'];
  await client.authorize();

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth: client
  });

  return searchConsole;
}

// 特定のページにおける、その日の掲載順位を取得する関数
async function getPageRankingOnDate(searchConsole, siteUrl, pageUrl, targetDate, logger) {
  try {
    const request = {
      siteUrl,
      requestBody: {
        startDate: targetDate,
        endDate: targetDate,
        dimensions: ['date', 'page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'equals',
                expression: pageUrl,
              },
            ],
          },
        ],
        rowLimit: 1,
      },
    };

    const response = await searchConsole.searchanalytics.query(request);

    if (!response.data.rows || response.data.rows.length === 0) {
      return null;
    }

    return response.data.rows[0].position;
  } catch (err) {
    // エラーが発生した場合の処理
    logger.error(err);
    return null;
  }
}

// 開始日と終了日の取得を行う関数
function getStartDateAndEndDate(dayBeforeEndDate) {
  const today = new Date();
  // 最新の掲載順位が入っている3日前の日付をendDateとして取得
  const endDate = format(subDays(today, 3), 'yyyy-MM-dd');
  // 掲載順位の比較対象とするstartDateを最新の日付から逆算して取得
  const startDate = format(subDays(new Date(endDate), dayBeforeEndDate), 'yyyy-MM-dd');

  return { startDate, endDate };
}

// Slackへメッセージを送信する関数
async function sendSlackMessage(channelId, message, { slackClient }) {
    await slackClient.chat.postMessage({
        channel: channelId,
        text: message,
    });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // Search ConsoleとSlackのシークレットを取得
  const secrets = await secret.get({
    keys: [
      SERVICE_ACCOUNT_KEY_SECRET,
      SLACK_TOKEN_SECRET
      ],
  });

  const saKeyJson = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
  const searchConsole = await createSearchConsoleClient(saKeyJson);

  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token);

  const { startDate, endDate } = getStartDateAndEndDate(DAY_BEFORE_END_DATE);

  const startDatePageRanking = await getPageRankingOnDate(searchConsole, SITE_URL, PAGE_URL, startDate);
  const endDatePageRanking = await getPageRankingOnDate(searchConsole, SITE_URL, PAGE_URL, endDate);

  if (startDatePageRanking === null || endDatePageRanking === null) {
    logger.warn('開始日または終了日の掲載順位が取得できませんでした。');
    return;
  }

  const changePageRanking = Math.abs(startDatePageRanking - endDatePageRanking).toFixed(1);

  if (changePageRanking < RANK_DIFFERENCE_TO_NOTIFY) {
    return;
  }

  // 掲載順位の変動が閾値以上の場合、Slack通知用のメッセージを作成する
  const message = `ページの掲載順位が大きく変動しました。
  対象ページ: ${PAGE_URL}
  ${startDate} の順位: ${startDatePageRanking.toFixed(1)} 位
  ${endDate} の順位: ${endDatePageRanking.toFixed(1)} 位
  変動幅: ${changePageRanking} 位`;

  await sendSlackMessage(SLACK_CHANNEL_ID, message, { slackClient });

}