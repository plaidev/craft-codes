import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const X_BEARER_TOKEN_SECRET = '<% X_BEARER_TOKEN_SECRET %>';
const SEARCH_WORD = '<%SEARCH_WORD%>';
const MINUTES_AGO = '<%MINUTES_AGO%>';
const MAX_RESULTS = '<%MAX_RESULTS%>';
const POST_THRESHOLD = '<%POST_THRESHOLD%>';
const X_API_BASE_URL = 'https://api.twitter.com/2/tweets/search/recent';

function calculateXSearchStartTime(minutesAgo) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function buildXSearchUrl({ query, startTime, maxResults, nextToken }) {
  const url = new URL(X_API_BASE_URL);
  url.searchParams.append('query', query);
  url.searchParams.append('start_time', startTime);
  url.searchParams.append('max_results', maxResults);

  if (nextToken) {
    url.searchParams.append('next_token', nextToken);
  }

  return url.toString();
}

function outputRateLimitLog(response, logger) {
  const rateLimit = {
    limit: response.headers.get('x-rate-limit-limit'),
    remaining: response.headers.get('x-rate-limit-remaining'),
    reset: response.headers.get('x-rate-limit-reset'),
  };
  logger.debug(
    `Rate Limit - Limit: ${rateLimit.limit}, Remaining: ${rateLimit.remaining}, Reset: ${rateLimit.reset}`
  );
}

async function searchPosts({
  xBearerToken,
  searchQuery,
  startTime,
  maxResults,
  nextToken,
  logger,
}) {
  const requestUrl = buildXSearchUrl({ searchQuery, startTime, maxResults, nextToken });
  logger.debug(`Request URL: ${requestUrl}`);
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${xBearerToken}`,
    },
  });
  if (!response.ok) {
    outputRateLimitLog(response, logger);
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }
  return response.json();
}

async function fetchPostCount({ xBearerToken, searchQuery, startTime, maxResults, logger }) {
  let totalPosts = 0;
  let nextToken = null;
  do {
    const response = await searchPosts({
      xBearerToken,
      searchQuery,
      startTime,
      maxResults,
      nextToken,
      logger,
    });
    totalPosts += response.meta.result_count;
    nextToken = response.meta.next_token || null;
    logger.log(`Fetched ${response.meta.result_count} posts, total so far: ${totalPosts}`);
  } while (nextToken && totalPosts < POST_THRESHOLD * 100);
  logger.debug(`Total post count: ${totalPosts}`);
  return totalPosts;
}

async function postMessageToSlack({
  slackClient,
  totalPosts,
  postThreshold,
  slackChannelId,
  logger,
}) {
  let slackMessage;

  if (totalPosts > postThreshold * 100) {
    slackMessage = `🚀 やったーーー😆「${SEARCH_WORD}」に関する投稿が大バズり中！なんと、指定した値の100倍(${
      postThreshold * 100
    }件)の投稿数を突破しました🎉\n\n直近${MINUTES_AGO}分の投稿数は驚異の${totalPosts}件です！📮`;
  } else if (totalPosts > postThreshold * 10) {
    slackMessage = `🔥 いい感じ！😁「${SEARCH_WORD}」に関する投稿が急増してるよ！指定した値の10倍(${
      postThreshold * 10
    }件)の投稿数を突破しました🎉\n\n直近${MINUTES_AGO}分の投稿数は${totalPosts}件です！📮`;
  } else if (totalPosts > postThreshold) {
    slackMessage = `📈 「${SEARCH_WORD}」での投稿が盛り上がってるよ！指定した値の${postThreshold}件を超えました🎉\n\n直近${MINUTES_AGO}分の投稿数は${totalPosts}件です！📮`;
  }

  if (slackMessage) {
    await slackClient.chat.postMessage({
      channel: slackChannelId,
      text: slackMessage,
    });
    logger.log('Slack notification sent');
  } else {
    logger.log(
      `Post count did not exceed the threshold, no notification sent\nPost count was ${totalPosts}`
    );
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({
    keys: [SLACK_TOKEN_SECRET, X_BEARER_TOKEN_SECRET],
  });
  const slackToken = secrets[SLACK_TOKEN_SECRET];
  const xBearerToken = secrets[X_BEARER_TOKEN_SECRET];
  const slackChannelId = SLACK_CHANNEL_ID;
  const slackClient = new WebClient(slackToken);
  const searchQuery = SEARCH_WORD;
  const startTime = calculateXSearchStartTime(MINUTES_AGO);
  const maxResults = MAX_RESULTS;
  const postThreshold = POST_THRESHOLD;
  let totalPosts = 0;

  logger.log(`Starting process to search posts with SEARCH_WORD ${searchQuery}`);

  try {
    totalPosts = await fetchPostCount({ xBearerToken, searchQuery, startTime, maxResults, logger });
    await postMessageToSlack({ slackClient, totalPosts, postThreshold, slackChannelId, logger });
  } catch (error) {
    logger.error(`Error occurred: ${error.message}`);
  }
}
