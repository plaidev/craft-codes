import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';

function generateHashPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

function kvsKey(targetItemId) {
  const solutionId = SOLUTION_ID;
  const hash = generateHashPrefix(`${solutionId}-${targetItemId}`); // ホットスポット回避用のハッシュ値
  return `${hash}-${solutionId}-${targetItemId}`;
}

async function fetchRecommend({ targetItemId, kvs, logger }) {
  const key = kvsKey(targetItemId);
  try {
    const v = await kvs.get({ key });
    if (!v || !v[key]) {
      throw new Error('key not found in kvs');
    }
    return v[key].value;
  } catch (err) {
    logger.error(
      `fetchRecommend error. key: ${key}, targetItemId: ${targetItemId}, error: ${err.toString()}`
    );
    return { error: `recommend data not found. item_id: ${targetItemId}` };
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;

  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { kvs, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { item_id: targetItemId } = req.query;

  if (!targetItemId) {
    return res.status(400).json({ error: 'item_id is required in the request.query.' });
  }

  const r = await fetchRecommend({ targetItemId, kvs, logger });
  if (r.error) {
    return res.status(404).json({ error: r.error });
  }

  const recommendJson = Buffer.from(r.data_base64, 'base64').toString();
  let recommend;
  try {
    recommend = JSON.parse(recommendJson);
  } catch (e) {
    logger.error(`Failed to parse JSON data on kvs. item_id: ${targetItemId}`);
    return res.status(500).json({ error: `Failed to parse JSON data. item_id: ${targetItemId}` });
  }

  return res.status(200).json(recommend);
}
