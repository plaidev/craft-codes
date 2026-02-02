import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import BM25Vectorizer from 'wink-nlp/utilities/bm25-vectorizer.js';

const nlp = winkNLP(model);
const its = nlp.its;

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';
const ENDPOINT_ID = '<% ENDPOINT_ID %>';
const DIMENSION_NUM = Number('<% DIMENSION_NUM %>');
const PARTITION_NAME = '<% PARTITION_NAME %>';
const BM25_MODEL_URL = '<% BM25_MODEL_URL %>';
const USE_MULTI_EMBEDDING = true; // データ投入時と同じ設定にする

async function getBM25Model(logger) {
  try {
    logger.debug('Fetching BM25 model from URL');
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

function getSparseEmbedding({ text, bm25VectorModel }) {
  const doc = nlp.readDoc(text);
  const bm25Model = BM25Vectorizer();
  bm25Model.loadModel(bm25VectorModel);
  const bm25Vector = bm25Model.vectorOf(doc.tokens().out(its.normal));

  const values = [];
  const dimensions = [];

  bm25Vector.forEach((value, index) => {
    if (value > 0) {
      values.push(value);
      dimensions.push(index);
    }
  });

  return { values, dimensions };
}

/**
 * リストごとの重み付き RRF + 類似度スコア融合
 * @param {Array<Array<{ id: string, score: number }>>} rankedLists - 各ランキングリスト
 * @param {object} options
 * @param {number[]} options.listWeights - 各リストの重み（合計が1でなくてもよい）
 * @param {number} [options.k=60] - RRFの定数
 * @param {number} [options.alpha=0.5] - 順位と類似度スコアの比率
 * @param {number} [options.topN] - 上位N件のみ返す（省略可）
 * @returns {Array<{ id: string, score: number }>}
 */
function weightedRrfMerge(rankedLists, { listWeights = [], k = 60, alpha = 0.5, topN } = {}) {
  if (listWeights.length !== rankedLists.length) {
    throw new Error('listWeights の長さが rankedLists と一致していません');
  }

  const scores = {};

  for (let i = 0; i < rankedLists.length; i++) {
    const list = rankedLists[i];
    const weight = listWeights[i];

    // 最大スコアを取得して正規化（類似度スコアがバラついていても使えるように）
    const maxSim = Math.max(...list.map(item => item.score || 0)) || 1;

    list.forEach((item, index) => {
      const id = item.id;
      const rank = index + 1;
      const sim = item.score || 0;
      const normalizedSim = sim / maxSim;

      const rrfPart = 1 / (k + rank);
      const finalScore = weight * (alpha * rrfPart + (1 - alpha) * normalizedSim);

      if (!scores[id]) {
        scores[id] = 0;
      }
      scores[id] += finalScore;
    });
  }

  const merged = Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  return topN ? merged.slice(0, topN) : merged;
}

async function getTextEmbedding(text, aiModules, logger) {
  try {
    if (USE_MULTI_EMBEDDING) {
      logger.debug(
        `Generating text embeddings using gcpEmbeddingsMulti. dimension: ${DIMENSION_NUM}`
      );
      const embeddingParams = {
        dimension: DIMENSION_NUM,
        text,
      };
      const result = await aiModules.gcpEmbeddingsMulti(embeddingParams);
      return result.predictions[0].textEmbedding;
    }

    logger.debug(`Generating text embeddings using gcpEmbeddingsText. dimension: ${DIMENSION_NUM}`);
    const result = await aiModules.gcpEmbeddingsText({
      instances: [
        {
          content: text,
          task_type: 'RETRIEVAL_QUERY',
        },
      ],
      parameters: {
        outputDimensionality: DIMENSION_NUM,
      },
    });
    return result.predictions[0].embeddings.values;
  } catch (error) {
    logger.error('Failed to get text embedding:', error);
    throw error;
  }
}

function processVectorSearchResponse(response) {
  return (
    response?.nearestNeighbors?.[0]?.neighbors?.map(n => {
      const { distance, datapoint } = n;
      return {
        id: datapoint.datapointId,
        score: distance,
      };
    }) || []
  );
}

function createDatapoint(featureVector, restricts, sparseEmbedding = null) {
  const datapoint = {
    feature_vector: featureVector,
    neighborCount: 10,
    restricts,
  };

  if (sparseEmbedding) {
    datapoint.sparse_embedding = sparseEmbedding;
  }

  return datapoint;
}

async function searchVectorData(
  featureVector,
  sparseEmbedding,
  filters,
  sparseRrf,
  imageOutputWeight,
  vectorSearch,
  logger
) {
  try {
    const restricts = filters
      ? filters.map(filter => ({
          namespace: filter.namespace,
          allow_list: filter.allow_list || [],
          deny_list: filter.deny_list || [],
        }))
      : [];

    // テキストデータに対する検索クエリ
    let textQueries;
    if (sparseEmbedding && sparseRrf !== 1) {
      textQueries = [
        {
          datapoint: createDatapoint(featureVector, restricts, sparseEmbedding),
          rrf: { alpha: sparseRrf || 0.5 },
        },
      ];
    } else {
      textQueries = [
        {
          datapoint: createDatapoint(featureVector, restricts),
        },
      ];
    }
    const searchPromises = [
      vectorSearch.findNeighbors({
        indexEndpointId: ENDPOINT_ID,
        queries: textQueries,
        partition: `${PARTITION_NAME}_text`,
      }),
    ];

    // 画像データに対する検索クエリ
    let imageQueries = null;
    if (imageOutputWeight > 0) {
      imageQueries = [
        {
          datapoint: createDatapoint(featureVector, restricts),
        },
      ];
    }
    if (imageQueries) {
      searchPromises.push(
        vectorSearch.findNeighbors({
          indexEndpointId: ENDPOINT_ID,
          queries: imageQueries,
          partition: `${PARTITION_NAME}_image`,
        })
      );
    }

    const searchResults = await Promise.all(searchPromises);
    const textResponse = searchResults[0];
    const imageResponse = searchResults[1] || null;

    const textResults = processVectorSearchResponse(textResponse);
    const imageResults = processVectorSearchResponse(imageResponse);

    logger.debug(`Text search results: ${JSON.stringify(textResults)}`);
    logger.debug(`Image search results: ${JSON.stringify(imageResults)}`);

    let mergedResults;
    if (imageOutputWeight > 0 && imageResults.length > 0) {
      mergedResults = weightedRrfMerge([textResults, imageResults], {
        listWeights: [1 - imageOutputWeight, imageOutputWeight],
        topN: 10,
      });
    } else {
      mergedResults = textResults.slice(0, 10).map(item => ({ id: item.id, score: item.score }));
    }

    logger.debug(`mergedResults: ${JSON.stringify(mergedResults)}`);

    const finalResults = mergedResults.map(item => ({
      distance: item.score,
      datapoint: {
        datapointId: item.id,
      },
    }));

    return finalResults;
  } catch (error) {
    logger.error('Failed to search vector data:', error);
    throw error;
  }
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());

  if (origins.includes(origin) || origins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return true;
  }

  return false;
}

function validateRequest(req, res) {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const isOriginAllowed = setCorsHeaders(res, origin, ALLOWED_ORIGINS);
    if (isOriginAllowed) {
      res.status(200).end();
    } else {
      res.status(403).json({ error: 'Origin not allowed' });
    }
    return false;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return false;
  }

  if (origin) {
    setCorsHeaders(res, origin, ALLOWED_ORIGINS);
  }

  const headers = req.headers;
  if (!headers['content-type']) {
    res.status(400).json({ error: 'Content-Type header is missing' });
    return false;
  }

  return true;
}

export default async function (data, { MODULES }) {
  const { res, req } = data;
  const { aiModules, vectorSearch, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (!validateRequest(req, res)) {
    return;
  }

  const { query, filters, sparseRrf = 1, imageOutputWeight = 0 } = req.body;

  if (!query) {
    res.status(400).json({ error: "Missing 'query' parameter" });
    return;
  }

  try {
    logger.debug(
      `try embeddings. query: ${query}, filters: ${JSON.stringify(filters)}, sparseRrf: ${sparseRrf}, imageOutputWeight: ${imageOutputWeight}`
    );
    // セマンティック検索用に、検索クエリ文字列をデンスベクトルに変換
    const embeddingValues = await getTextEmbedding(query, aiModules, logger);

    // キーワード検索を使う場合は、検索クエリ文字列をスパースベクトルに変換
    let sparseEmbedding = null;
    if (BM25_MODEL_URL && sparseRrf !== 1) {
      try {
        logger.debug('Generating sparse embedding');
        const bm25Model = await getBM25Model(logger);
        sparseEmbedding = getSparseEmbedding({
          text: query,
          bm25VectorModel: bm25Model,
        });
        logger.debug(
          `Sparse embedding generated. values: ${sparseEmbedding.values.length}, dimensions: ${sparseEmbedding.dimensions.length}`
        );
      } catch (err) {
        logger.warn(
          `Failed to generate sparse embedding: ${err.message}. Continuing without sparse embedding.`
        );
      }
    }

    logger.debug(
      `try searchVectorData. query: ${query}, filters: ${JSON.stringify(filters)}, sparseRrf: ${sparseRrf}, imageOutputWeight: ${imageOutputWeight}`
    );
    const results = await searchVectorData(
      embeddingValues,
      sparseEmbedding,
      filters,
      sparseRrf,
      imageOutputWeight,
      vectorSearch,
      logger
    );

    logger.log('Search completed successfully', {
      query,
      resultsCount: results.length,
    });

    res.status(200).json({
      query,
      results,
    });
  } catch (error) {
    logger.error('Search failed:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to search data';
    res.status(statusCode).json({ error: errorMessage });
  }
}
