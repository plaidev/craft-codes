import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import BM25Vectorizer from 'wink-nlp/utilities/bm25-vectorizer.js';

const nlp = winkNLP(model);
const its = nlp.its;

const LOG_LEVEL = '<% LOG_LEVEL %>';
const INDEX_ID = '<% INDEX_ID %>';
const DIMENSION_NUM = Number('<% DIMENSION_NUM %>');
const HEADER_COLUMNS = '<% HEADER_COLUMNS %>';
const ID_FIELD = '<% ID_FIELD %>';
const TEXT_FIELDS = '<% TEXT_FIELDS %>';
const NAMESPACE_FIELDS = '<% NAMESPACE_FIELDS %>';
const IMAGE_URL_FIELD = '<% IMAGE_URL_FIELD %>';
const BM25_MODEL_URL = '<% BM25_MODEL_URL %>';
const PARTITION_NAME = '<% PARTITION_NAME %>';
const USE_MULTI_EMBEDDING = true; // 画像を利用せず gcpEmbeddingsText() を使いたい場合は false を設定
const RETRY_TIMEOUT_SEC = 3600;
const DELETE_FLAG_FIELD = '__delete';

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

function parseColumnsConfig(headerColumns) {
  return headerColumns
    .split(',')
    .map(v => v.trim())
    .filter(v => v);
}

function isValidImageURL(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}
const HEADER_COLUMNS_CONFIG = parseColumnsConfig(HEADER_COLUMNS);

function parseDatahubRow(value) {
  const splitData = value.split(',');
  const obj = HEADER_COLUMNS_CONFIG.reduce((acc, column, j) => {
    acc[column] = splitData[j];
    return acc;
  }, {});

  return obj;
}

function buildContentText(rowData, textFields) {
  if (!textFields) return '';

  const fields = textFields
    .split(',')
    .map(field => field.trim())
    .filter(field => field);

  return fields
    .map(field => {
      const value = rowData[field] || '';
      return `${field}: ${value}`;
    })
    .join('\n');
}

function buildNamespaceRestricts(rowData, namespaceFields) {
  if (!namespaceFields) return [];

  const fields = namespaceFields
    .split(',')
    .map(field => field.trim())
    .filter(field => field);

  return fields
    .filter(field => rowData[field])
    .map(field => {
      const values = rowData[field]
        .split('|')
        .map(value => value.trim())
        .filter(value => value);

      return {
        namespace: field,
        allow_list: values,
        deny_list: [],
      };
    });
}

async function getBM25Model(logger) {
  try {
    const response = await fetch(BM25_MODEL_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch BM25 model: ${response.status} ${response.statusText}`);
    }

    const bm25Model = await response.text();
    logger.debug('BM25 model fetched successfully');
    return bm25Model;
  } catch (err) {
    logger.error(`Failed to fetch BM25 model: ${err.message}`);
    throw err;
  }
}

async function fetchImageAsBase64(imageURL, logger) {
  try {
    const response = await fetch(imageURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    logger.debug('Image fetched and encoded to base64 successfully');
    return base64String;
  } catch (err) {
    logger.error(`Failed to fetch image: ${err.message}`);
    throw err;
  }
}

async function getSparseEmbedding(text, logger) {
  try {
    const bm25Model = await getBM25Model(logger);
    const doc = nlp.readDoc(text);
    const bm25VectorModel = BM25Vectorizer();
    bm25VectorModel.loadModel(bm25Model);
    const bm25Vector = bm25VectorModel.vectorOf(doc.tokens().out(its.normal));

    const values = [];
    const dimensions = [];

    bm25Vector.forEach((value, index) => {
      if (value > 0) {
        values.push(value);
        dimensions.push(index);
      }
    });

    logger.debug(
      `Sparse embedding generated. values: ${values.length}, dimensions: ${dimensions.length}`
    );
    return { values, dimensions };
  } catch (err) {
    logger.warn(
      `Failed to generate sparse embedding: ${err.message}. Continuing without sparse embedding.`
    );
    return null;
  }
}

async function processImageData(imageURL, logger) {
  if (!IMAGE_URL_FIELD || !imageURL) {
    return null;
  }

  if (!USE_MULTI_EMBEDDING) {
    logger.error(
      `Image URL field is provided but USE_MULTI_EMBEDDING is false. Image processing will be skipped. Set USE_MULTI_EMBEDDING to true to enable image embedding.`
    );
    return null;
  }

  if (!isValidImageURL(imageURL)) {
    logger.warn(`Invalid image URL provided: ${imageURL}. Skipping image processing.`);
    return null;
  }

  try {
    return await fetchImageAsBase64(imageURL, logger);
  } catch (err) {
    logger.warn(
      `Failed to fetch image from URL: ${imageURL}. Error: ${err.message}. Continuing without image.`
    );
    return null;
  }
}

async function generateTextEmbedding(text, aiModules, logger) {
  try {
    if (USE_MULTI_EMBEDDING) {
      logger.debug(
        `Generating text embeddings using gcpEmbeddingsMulti. dimension: ${DIMENSION_NUM}`
      );
      const result = await aiModules.gcpEmbeddingsMulti({
        text,
        dimension: DIMENSION_NUM,
      });
      return result.predictions[0].textEmbedding;
    }

    logger.debug(`Generating text embeddings using gcpEmbeddingsText. dimension: ${DIMENSION_NUM}`);
    const result = await aiModules.gcpEmbeddingsText({
      instances: [
        {
          content: text,
          task_type: 'SEMANTIC_SIMILARITY', // レコメンデーションではなくドキュメント検索の場合は 'RETRIEVAL_DOCUMENT' を推奨
        },
      ],
      parameters: {
        outputDimensionality: DIMENSION_NUM,
      },
    });
    return result.predictions[0].embeddings.values;
  } catch (err) {
    logger.error(`Failed to generate text embeddings: ${err.message}`);
    throw err;
  }
}

async function generateEmbeddings(text, image, aiModules, logger) {
  try {
    if (!text && !image) {
      throw new Error('Either text or image data must be provided');
    }

    const results = {};

    // テキストのみの場合
    if (text && !image) {
      results.text = await generateTextEmbedding(text, aiModules, logger);
      logger.debug(
        `Embedding generation succeeded. results.text.length: ${results.text ? results.text.length : 0}`
      );
      return results;
    }

    // 画像がある場合（テキストあり・なし両方対応）
    if (!USE_MULTI_EMBEDDING) {
      throw new Error('Image embedding requires USE_MULTI_EMBEDDING to be true');
    }

    const embeddingParams = {
      bytesBase64Encoded: image,
      dimension: DIMENSION_NUM,
    };

    // テキストもある場合は同時に処理
    if (text) {
      embeddingParams.text = text;
    }
    logger.debug(
      `Generating embeddings using gcpEmbeddingsMulti. dimension: ${DIMENSION_NUM}, target: ${text ? 'text and image' : 'image only'}`
    );

    const result = await aiModules.gcpEmbeddingsMulti(embeddingParams);

    if (text) {
      results.text = result.predictions[0].textEmbedding;
    }
    results.image = result.predictions[0].imageEmbedding;

    logger.debug(
      `Embedding generation succeeded. results.text.length: ${results.text ? results.text.length : 0}, results.image.length: ${results.image ? results.image.length : 0}`
    );
    return results;
  } catch (err) {
    logger.error(`Failed to generate embeddings: ${err.message}`);
    throw err;
  }
}

async function upsertToVectorSearch(
  datapointId,
  featureVector,
  sparseEmbedding,
  restricts,
  partition,
  vectorSearch,
  logger
) {
  try {
    const datapoint = {
      datapoint_id: datapointId,
      feature_vector: featureVector,
      restricts,
    };

    if (sparseEmbedding && sparseEmbedding.values && sparseEmbedding.dimensions) {
      datapoint.sparse_embedding = sparseEmbedding;
    }

    const datapoints = [datapoint];

    await vectorSearch.upsert({ indexId: INDEX_ID, datapoints, partition });

    const restrictsInfo = restricts.map(r => `${r.namespace}=${r.allow_list.join('|')}`).join(', ');
    logger.debug(
      `Vector search upsert succeeded. datapointId: ${datapointId}, partition: ${partition}, restricts: ${restrictsInfo}`
    );
  } catch (err) {
    logger.error(`Failed to upsert to vector search: ${err.message}`);
    throw err;
  }
}

async function removeDatapoints(datapointId, vectorSearch, logger, RetryableError) {
  try {
    const datapointIds = [datapointId];

    if (TEXT_FIELDS) {
      await vectorSearch.remove({
        indexId: INDEX_ID,
        datapointIds,
        partition: `${PARTITION_NAME}_text`,
      });
    }

    if (IMAGE_URL_FIELD) {
      await vectorSearch.remove({
        indexId: INDEX_ID,
        datapointIds,
        partition: `${PARTITION_NAME}_image`,
      });
    }

    logger.log(`Successfully removed datapoints. originalId: ${datapointId}`);
  } catch (err) {
    logger.error(`Failed to remove datapoints. Error: ${err.message}`);
    const msg = `Failed to remove Datahub data. Error: ${err.message}`;
    throwSuitableError({
      msg,
      status: err.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, aiModules, vectorSearch, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error(new Error('invalid data.kind value'));
    return;
  }

  const { value } = data.jsonPayload.data;
  const rowData = parseDatahubRow(value);

  if (!rowData[ID_FIELD]) {
    logger.error(`ID field '${ID_FIELD}' not found in the data`);
    return;
  }
  const datapointId = rowData[ID_FIELD];

  // 削除フラグが立っている場合は削除処理を実行
  if (rowData[DELETE_FLAG_FIELD] && rowData[DELETE_FLAG_FIELD].toLowerCase() === 'true') {
    await removeDatapoints(datapointId, vectorSearch, logger, RetryableError);
    return;
  }

  // テキストデータを構築
  let contentText = null;
  if (TEXT_FIELDS) {
    contentText = buildContentText(rowData, TEXT_FIELDS).trim();
  }

  // 画像データを取得
  let bytesBase64Encoded = null;
  if (IMAGE_URL_FIELD) {
    bytesBase64Encoded = await processImageData(rowData[IMAGE_URL_FIELD], logger);
  }

  if (!contentText && !bytesBase64Encoded) {
    logger.warn(`No text or image data available for processing. datapointId: ${datapointId}`);
    return;
  }

  // フィルタリング条件を構築
  const restricts = buildNamespaceRestricts(rowData, NAMESPACE_FIELDS);

  // スパースベクトルを作成
  let sparseEmbedding;
  if (BM25_MODEL_URL) {
    sparseEmbedding = await getSparseEmbedding(contentText, logger);
  }

  try {
    // 埋め込みベクトルを生成
    const embeddingResults = await generateEmbeddings(
      contentText,
      bytesBase64Encoded,
      aiModules,
      logger
    );

    const promises = [];

    // テキストデータをVector Searchに登録
    if (embeddingResults.text) {
      const textPartition = `${PARTITION_NAME}_text`;
      promises.push(
        upsertToVectorSearch(
          datapointId,
          embeddingResults.text,
          sparseEmbedding,
          restricts,
          textPartition,
          vectorSearch,
          logger
        )
      );
    }

    // 画像データをVector Searchに登録
    if (embeddingResults.image) {
      const imagePartition = `${PARTITION_NAME}_image`;
      promises.push(
        upsertToVectorSearch(
          datapointId,
          embeddingResults.image,
          null, // 画像embeddingにはスパース埋め込みは使用しない
          restricts,
          imagePartition,
          vectorSearch,
          logger
        )
      );
    }

    await Promise.all(promises);
  } catch (err) {
    const msg = `Failed to process Datahub data. Error: ${err.message}`;
    throwSuitableError({
      msg,
      status: err.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }
}
