import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';
const ALLOWED_ORIGIN = '<% ALLOWED_ORIGIN %>';

function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

function componentKvsKey(componentId) {
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${componentId}`);
  return `${hash}-${solutionId}-${componentId}`;
}

async function fetchComponent({ componentId, kvs, logger }) {
  const key = componentKvsKey(componentId);
  try {
    const v = await kvs.get({ key });
    if (!v || !v[key]) {
      throw new Error(`not found in kvs.`);
    }
    logger.debug(`[fetchComponent] succeeded. key: ${key}`);

    const c = v[key].value;
    c.data = JSON.parse(Buffer.from(c.data_base64, 'base64').toString());
    // 期待されるプロパティ: c.component_id, c.type, c.updated_at, c.data
    return c;
  } catch (err) {
    logger.error(
      `[fetchComponent] error. componentId: ${componentId}, key: ${key}, error: ${err.toString()}`
    );
    return { error: `fail to fetch component. componentId: ${componentId}` };
  }
}

async function fetchComponents({ componentIds, kvs, logger }) {
  const promises = componentIds.map(componentId => fetchComponent({ componentId, kvs, logger }));
  const results = await Promise.allSettled(promises);
  const components = results.map(r => r.value);
  return { components };
}

export default async function (data, { MODULES }) {
  const { kvs, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;

  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', true);
    return res.status(204).send('');
  }

  const body = req.body;

  if (typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  const { componentIds } = body;

  if (!componentIds)
    return res.status(400).json({ error: 'componentIds is required in the request body.' });

  const { components, error: fetchError } = await fetchComponents({
    componentIds,
    kvs,
    logger,
  });
  if (fetchError) {
    return res.status(500).json({ error: fetchError });
  }
  return res.json({ components });
}
