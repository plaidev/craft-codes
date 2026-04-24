const LOG_LEVEL = '<% LOG_LEVEL %>';
const ACCESS_TOKEN = '<% ACCESS_TOKEN %>';
const COLLECTION_NAME = '<% COLLECTION_NAME %>';

function authenticate(req) {
  const [, token] = (req.headers.authorization || '').split('Bearer ');
  return token?.trim() === ACCESS_TOKEN;
}

function parseSearchParams(query) {
  const { category, minPrice, maxPrice, tag, sortBy, sortOrder, take, cursor } = query;

  const where = {};
  if (category) where.category = category;
  if (minPrice != null || maxPrice != null) {
    where.price = {};
    if (minPrice != null) {
      const num = Number(minPrice);
      if (Number.isNaN(num)) return { error: 'Invalid minPrice' };
      where.price.gte = num;
    }
    if (maxPrice != null) {
      const num = Number(maxPrice);
      if (Number.isNaN(num)) return { error: 'Invalid maxPrice' };
      where.price.lte = num;
    }
    if (where.price.gte != null && where.price.lte != null && where.price.gte > where.price.lte) {
      return { error: 'minPrice must be less than or equal to maxPrice' };
    }
  }
  if (tag) where.tags = { has: tag };

  const parsedTake = take != null ? Number(take) : 20;
  if (Number.isNaN(parsedTake) || parsedTake < 1) {
    return { error: 'take must be a positive number' };
  }

  const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

  return {
    collectionName: COLLECTION_NAME,
    where,
    orderBy,
    take: Math.min(parsedTake, 100),
    cursor: cursor || undefined,
  };
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { docDb, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const params = parseSearchParams(req.query);
  if (params.error) {
    return res.status(400).json({ error: params.error });
  }

  try {
    const result = await docDb.find(params);

    logger.log(`Found ${result.data.length} items in ${COLLECTION_NAME}`);

    return res.json({
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    logger.error('Search failed:', error);
    const statusCode = error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
    return res.status(statusCode).json({ error: error.message });
  }
}
