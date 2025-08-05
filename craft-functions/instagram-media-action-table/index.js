const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_ACCESS_TOKEN_SECRET = '<% INSTAGRAM_ACCESS_TOKEN_SECRET %>';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '<% INSTAGRAM_BUSINESS_ACCOUNT_ID %>';
const GRAPH_API_VERSION = '<% GRAPH_API_VERSION %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = 3600;

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function fetchMediaIds(accessToken, graphApiVersion, businessAccountId) {
  const url = `https://graph.facebook.com/${graphApiVersion}/${businessAccountId}/media?fields=id&access_token=${accessToken}`;
  const result = await fetchData(url);
  return result.data.map(item => item.id);
}

async function fetchMediaDetails(accessToken, graphApiVersion, mediaId) {
  const url = `https://graph.facebook.com/${graphApiVersion}/${mediaId}/?fields=id,media_type,media_product_type,permalink,thumbnail_url,media_url,caption,like_count,comments_count,timestamp&access_token=${accessToken}`;
  return fetchData(url);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, craftFunctions } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [INSTAGRAM_ACCESS_TOKEN_SECRET],
    });
    const accessToken = secrets[INSTAGRAM_ACCESS_TOKEN_SECRET];

    const mediaIds = await fetchMediaIds(
      accessToken,
      GRAPH_API_VERSION,
      INSTAGRAM_BUSINESS_ACCOUNT_ID
    );

    const promises = mediaIds.map(async mediaId => {
      const mediaDetails = await fetchMediaDetails(accessToken, GRAPH_API_VERSION, mediaId);

      const fetchedAt = new Date();
      const expiredAt = new Date(fetchedAt.getTime() + 24 * 60 * 60 * 1000); // 有効期限を1日後に指定

      const parameters = {
        table: ACTION_TABLE_ID,
        data: {
          media_id: mediaDetails.id,
          media_type: mediaDetails.media_type,
          media_product_type: mediaDetails.media_product_type,
          permalink: mediaDetails.permalink,
          media_url: mediaDetails.media_url,
          caption: mediaDetails.caption,
          like_count: mediaDetails.like_count,
          comments_count: mediaDetails.comments_count,
          timestamp: mediaDetails.timestamp,
          fetched_at: fetchedAt.toISOString(),
          expired_at: expiredAt.toISOString(),
        },
      };

      await craftFunctions.invoke({
        functionId: TARGET_FUNCTION_ID,
        data: {
          apiUrl: 'https://api.karte.io/v2beta/action/actionTable/records/upsert',
          parameters,
          tokenSecretName: KARTE_APP_TOKEN_SECRET,
          retryTimeoutSec: RETRY_TIMEOUT_SEC,
        },
      });
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        logger.debug(`Media ID ${mediaIds[index]} processed successfully.`);
      } else {
        logger.error(`Media ID ${mediaIds[index]} failed: ${result.reason}`);
      }
    });

    logger.debug('All media records processed successfully.');
  } catch (error) {
    logger.error(`Error fetching media records: ${error.message}`);
    throw new Error(`Error fetching media records: ${error.message}`);
  }
}
