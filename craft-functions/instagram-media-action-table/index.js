import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INSTAGRAM_ACCESS_TOKEN_SECRET = '<% INSTAGRAM_ACCESS_TOKEN_SECRET %>';
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '<% INSTAGRAM_BUSINESS_ACCOUNT_ID %>';
const GRAPH_API_VERSION = '<% GRAPH_API_VERSION %>';
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>'; // アクションテーブルの名称
const KARTE_API_TOKEN_SECRET = '<% KARTE_API_TOKEN_SECRET %>'; // API v2アプリのトークンを登録したシークレット
const MAX_RETRIES = '<% MAX_RETRIES %>'; // リトライ回数の最大値
const RETRY_DELAY = '<% RETRY_DELAY %>'; // 何ミリ秒後にリトライするかを指定

const sdkInstance = api('@dev-karte/v1.0#7djuwulvxfdhn1');

// データ取得関数
async function fetchData(url, logger, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    throw new Error(`Error fetching data from ${url}: ${error.message}`);
  }
}

async function fetchMediaIds(
  accessToken,
  graphApiVersion,
  businessAccountId,
  logger,
  fetchImpl = fetch
) {
  const url = `https://graph.facebook.com/${graphApiVersion}/${businessAccountId}/media?fields=id&access_token=${accessToken}`;
  try {
    return (await fetchData(url, logger, fetchImpl)).data.map(item => item.id);
  } catch (error) {
    logger.error(`Error in fetchMediaIds: ${error.message}`, {
      functionName: 'fetchMediaIds',
      url,
      error,
    });
    throw error;
  }
}

async function fetchMediaDetails(accessToken, graphApiVersion, mediaId, logger, fetchImpl = fetch) {
  const url = `https://graph.facebook.com/${graphApiVersion}/${mediaId}/?fields=id,media_type,media_product_type,permalink,thumbnail_url,media_url,caption,like_count,comments_count,timestamp&access_token=${accessToken}`;
  try {
    return await fetchData(url, logger, fetchImpl);
  } catch (error) {
    logger.error(`Error in fetchMediaDetails for ID ${mediaId}: ${error.message}`, {
      functionName: 'fetchMediaDetails',
      mediaId,
      url,
      error,
    });
    throw error;
  }
}

function isRetryableError(err) {
  return err.response && (err.response.status >= 500 || err.response.status === 429);
}

async function upsertActionTableRecords(instance, data, logger, retries = 0) {
  try {
    await instance.postV2betaActionActiontableRecordsUpsert({
      table: ACTION_TABLE_ID,
      data,
    });
  } catch (err) {
    if (retries < MAX_RETRIES && isRetryableError(err)) {
      logger.warn(`Retrying upsert action table records (retry ${retries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return upsertActionTableRecords(instance, data, logger, retries + 1);
    }
    logger.error(`Failed to upsert action table records after ${retries} retries: ${err.message}`);
    throw err;
  }
}

async function processBatch(instance, batchData, logger) {
  const upsertPromises = batchData.map(record =>
    upsertActionTableRecords(instance, record, logger)
  );
  await Promise.all(upsertPromises);
}

async function processAllBatches(instance, mediaDetailsArray, logger) {
  const processBatchWithDelay = async (batch, index) => {
    await processBatch(instance, batch, logger);
    logger.log(`Batch ${index + 1} processed successfully`);

    // RETRY_DELAY分待つ
    if (index + 1 < Math.ceil(mediaDetailsArray.length / 10)) {
      logger.log(`Waiting for ${RETRY_DELAY / 1000 / 60} minutes before processing next batch...`);
      await new Promise(resolve => {
        setTimeout(resolve, RETRY_DELAY);
      });
    }
  };

  const batchPromises = [];
  for (let i = 0; i < mediaDetailsArray.length; i += 10) {
    const batchData = mediaDetailsArray.slice(i, i + 10);
    batchPromises.push(processBatchWithDelay(batchData, i / 10));
  }

  await Promise.all(batchPromises);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [INSTAGRAM_ACCESS_TOKEN_SECRET, KARTE_API_TOKEN_SECRET],
    });
    const accessToken = secrets[INSTAGRAM_ACCESS_TOKEN_SECRET];
    const karteToken = secrets[KARTE_API_TOKEN_SECRET];
    sdkInstance.auth(karteToken);

    const mediaIds = await fetchMediaIds(
      accessToken,
      GRAPH_API_VERSION,
      INSTAGRAM_BUSINESS_ACCOUNT_ID,
      logger,
      fetch
    );

    const mediaDetailsPromises = mediaIds.map(mediaId =>
      fetchMediaDetails(accessToken, GRAPH_API_VERSION, mediaId, logger, fetch)
    );
    const mediaDetailsArray = await Promise.all(mediaDetailsPromises);

    const upsertData = mediaDetailsArray.map(mediaDetails => ({
      media_id: mediaDetails.id,
      media_type: mediaDetails.media_type,
      media_product_type: mediaDetails.media_product_type,
      permalink: mediaDetails.permalink,
      media_url: mediaDetails.media_url,
      caption: mediaDetails.caption,
      like_count: mediaDetails.like_count,
      comments_count: mediaDetails.comments_count,
      timestamp: mediaDetails.timestamp,
    }));

    await processAllBatches(sdkInstance, upsertData, logger);

    logger.log('All media records processed successfully');
  } catch (error) {
    logger.error(`Error processing media records: ${error.message}`);
  }
}
