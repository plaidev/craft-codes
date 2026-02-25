import { createHash } from 'crypto';
import retry from 'async-retry';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const DEFAULT_REDIRECT_URL = '<% DEFAULT_REDIRECT_URL %>';
const RETRY_TIMEOUT_SEC = Number('<% RETRY_TIMEOUT_SEC %>');
const SOLUTION_ID = '<% SOLUTION_ID %>';

function generateHashPrefix(key) {
  const hashBase64 = createHash('sha256').update(key).digest('base64');
  return hashBase64.substring(4, 12);
}

function generateKvsKey(solutionId, shortId) {
  const recordName = shortId;
  const baseKey = `${solutionId}-${recordName}`;
  const hash = generateHashPrefix(baseKey);
  return `${hash}-${baseKey}`;
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs, craftFunctions } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  const shortId = req.query.code;

  if (!shortId || shortId.includes('functions')) {
    return res.status(400).send('Invalid Short ID');
  }

  const kvsKey = generateKvsKey(SOLUTION_ID, shortId);

  try {
    const record = await retry(
      async bail => {
        const result = await kvs.get({ keys: [kvsKey] });
        const item = result[kvsKey];

        if (!item || !item.value || !item.value.url) {
          bail(new Error(`KVS内に有効なデータが見つかりません: ${kvsKey}`));
          return;
        }
        return item;
      },
      {
        retries: 5,
        minTimeout: 500,
        factor: 2,
        onRetry: err => {
          logger.warn(`KVS get retry...: ${err.message}`);
        },
      }
    );

    const targetUrl = record.value.url;

    if (REF_TABLE_ID && REF_TABLE_ID !== '') {
      try {
        const timestamp = Date.now();
        const dateTimestamp = new Date(timestamp).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        });

        await craftFunctions.invoke({
          functionId: TARGET_FUNCTION_ID,
          data: {
            apiUrl: 'https://api.karte.io/v2beta/track/refTable/row/upsert',
            tokenSecretName: KARTE_APP_TOKEN_SECRET,
            retryTimeoutSec: RETRY_TIMEOUT_SEC,
            parameters: {
              id: REF_TABLE_ID,
              rowKey: { log_id: `${shortId}_${timestamp}` },
              values: {
                short_id: shortId,
                target_url: targetUrl,
                click_at: dateTimestamp,
                user_agent: req.headers['user-agent'],
              },
            },
          },
        });
        logger.log(`トラッキング成功: ${shortId}`);
      } catch (invokeError) {
        logger.error('トラッキングFunction呼び出しエラー:', invokeError);
      }
    }

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.redirect(302, targetUrl);
  } catch (error) {
    logger.error('リダイレクト処理エラー:', error.message);
    return res.redirect(DEFAULT_REDIRECT_URL);
  }
}
