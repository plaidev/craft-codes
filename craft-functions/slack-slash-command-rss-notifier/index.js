import { parseStringPromise } from 'xml2js';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const RETRY_THRESHOLD_AGE = 1800; // 30分
const BASE_RSS_URL = 'https://news.yahoo.co.jp/rss/topics';
// https://news.yahoo.co.jp/rss で有効なカテゴリー
const ALLOWED_CATEGORIES = [
  'top-picks', // 主要
  'domestic', // 国内
  'world', // 国際
  'business', // 経済
  'entertainment', // エンタメ
  'sports', // スポーツ
  'it', // IT
  'science', // 科学
  'local' // 地域
];

async function parseRSS(xmlText) {
  try {
    const result = await parseStringPromise(xmlText);
    const items = result.rss.channel[0].item.map(item => ({
      title: item.title[0],
      link: item.link[0]
    }));
    
    return items;
  } catch (error) {
    throw new Error(`RSSパースエラー: ${error.message}`);
  }
}

async function fetchRSSItems(url) {
  const response = await fetch(url);

  let err;
  if (!response.ok) {
    const status = response.status;
    const responseText = await response.text();
    if (status >= 500 && status < 600) {
      err = new Error(`RSS取得の一時的なエラー: ${status}`);
      err.isTemporary = true;
      err.httpStatusCode = status;
    } else {
      err = new Error(`RSS取得エラー: ${status} ${responseText}`);
      err.isTemporary = false;
      err.httpStatusCode = status;
    }
    throw err;
  }

  const xmlText = await response.text();
  return parseRSS(xmlText);
}

function formatItems(items) {
  return items
    .map((item, idx) => `${idx + 1}. ${item.title}\nリンク：${item.link}`)
    .join('\n\n');
}

function validateRequest(requestRssCategory) {
  if (!ALLOWED_CATEGORIES.includes(requestRssCategory)) {
    throw new Error(`無効なカテゴリです: ${requestRssCategory}。次のいずれかを選択してください: ${ALLOWED_CATEGORIES.join('、')}`);
  }
}

async function postToSlack(responseTargetUrl, message) {
  const response = await fetch(responseTargetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });

  if (!response.ok) {
    const status = response.status;
    const responseText = await response.text();

    let err;
    if (status >= 500 && status < 600) {
      err = new Error(`Slack投稿の一時的なエラー: ${status}`);
      err.isTemporary = true;
      err.httpStatusCode = status;
    } else {
      err = new Error(`Slack投稿エラー: ${status} ${responseText}`);
      err.isTemporary = false;
      err.httpStatusCode = status;
    }
    throw err;
  }

  return response.status;
}

export default async function (data, { MODULES }) {
  const { initLogger, RetryableError } = MODULES;
  const { jsonPayload } = data;
  const { responseTargetUrl, requestText: requestRssCategory } = jsonPayload.data;
  const rssFeedUrl = `${ BASE_RSS_URL }/${ requestRssCategory }.xml`;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    // リクエストのバリデーションチェック
    validateRequest(requestRssCategory);
    
    // RSSフィードから結果を取得
    const items = await fetchRSSItems(rssFeedUrl);
    
    const formattedText = formatItems(items);
    
    await postToSlack(responseTargetUrl, formattedText);

    return { 
      statusCode: 200, 
      body: { status: 'success' } 
    };
  } catch(error) {

    if (error.isTemporary === true) {
      throw new RetryableError(`一時的なエラーのためリトライ` , RETRY_THRESHOLD_AGE);
    }

    try {
      await postToSlack(responseTargetUrl, error.message);
      logger.error(`Slackへエラーメッセージを投稿: ${error.message}`);
    } catch (postError) {
      logger.error(`Slackへのエラーメッセージ投稿失敗: ${postError.message}`);
    }

    return {
      statusCode: error.statusCode || 500,
      body: { status: 'error', message: error.message }
    };
  }
}
