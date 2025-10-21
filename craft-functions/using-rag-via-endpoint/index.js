const LOG_LEVEL = '<% LOG_LEVEL %>';
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';
const RAG_CORPUS_ID = '<% RAG_CORPUS_ID %>';
const AI_MODEL = '<% AI_MODEL %>';
const SYSTEM_PROMPT = '<% SYSTEM_PROMPT %>';

async function retrieveContents(rag, query, threshold) {
  const vectorDistanceThreshold = threshold || 0.8;

  const results = await rag.retrieveContexts({
    corpusId: RAG_CORPUS_ID,
    text: query,
    vectorDistanceThreshold,
  });

  return results.map(item => ({
    text: item.text,
    score: item.score,
    // filePath: item.filePath // ファイルパスを結果に含めたい場合はコメントアウトを外してください
  }));
}

async function generateAnswer(aiModules, query, threshold) {
  const vectorDistanceThreshold = threshold || 0.8;

  const params = {
    contents: [{ role: 'user', parts: [{ text: query }] }],
    model: AI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    craftExtra: {
      ragOptions: {
        corpusId: RAG_CORPUS_ID,
        vectorDistanceThreshold,
      },
    },
  };

  const response = await aiModules.gcpGeminiGenerateContent(params);
  return response.candidates[0].content.parts[0].text;
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());

  if (origins.includes(origin) || origins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return true;
  }

  return false;
}

function validateRequest(req, res, logger) {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const isOriginAllowed = setCorsHeaders(res, origin, ALLOWED_ORIGINS);
    if (isOriginAllowed) {
      res.status(204).send('');
    } else {
      logger.warn(`Origin not allowed: ${origin}`);
      res.status(403).json({ error: 'Origin not allowed' });
    }
    return false;
  }

  if (req.method !== 'POST') {
    logger.warn(`Invalid request method: ${req.method}`);
    res.status(405).json({ error: 'Method Not Allowed. Only POST requests are supported.' });
    return false;
  }

  if (origin) {
    setCorsHeaders(res, origin, ALLOWED_ORIGINS);
  } else {
    // originがない場合は全て許可する設定があるかチェック
    setCorsHeaders(res, '*', ALLOWED_ORIGINS);
  }

  const headers = req.headers;
  if (!headers['content-type']) {
    logger.warn('Content-Type header is missing');
    res.status(400).json({ error: 'Content-Type header is missing' });
    return false;
  }

  return true;
}

export default async function (data, { MODULES }) {
  const { initLogger, rag, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { res, req } = data;

  if (!validateRequest(req, res, logger)) {
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const { text, type, threshold } = body;

  if (!text) {
    logger.warn('Missing required parameter: text');
    res.status(400).json({ error: 'Missing required parameter: text' });
    return;
  }

  try {
    let result;

    if (type === 'retrieve') {
      result = await retrieveContents(rag, text, threshold);
    } else {
      result = await generateAnswer(aiModules, text, threshold);
    }

    res.json({ result });
  } catch (error) {
    logger.error(`Error processing request. error: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}
