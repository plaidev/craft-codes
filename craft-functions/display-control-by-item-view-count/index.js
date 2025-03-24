const LOG_LEVEL = '<% LOG_LEVEL %>';
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>';

export default async function (data, { MODULES }) {
  const { req, res } = data;

  // CORSを許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { userId, itemId } = req.query;
  if (!userId || !itemId) {
    res.status(400).json({ error: 'Missing required parameters: userId and/or itemId' });
    return;
  }
  const { initLogger, counter } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // user_id + item_idでkeyの作成
  const key = `${COUNTER_KEY_PREFIX}_${userId}_${itemId}`;

  try {
    // countを自動的に１ずつ増やしていく
    const count = await counter.increment({ key });
    res.status(200).json({ count });
  } catch (e) {
    logger.error('error', e.message);
    res.status(500).json({ error: e });
  }
}
