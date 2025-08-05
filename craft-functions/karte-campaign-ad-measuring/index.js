const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const RETRY_TIMEOUT_SEC = 3600;

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { craftFunctions, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).send('OK');
  }

  try {
    const { trackingId, timestamp, eventName } = req.body || {};

    if (!trackingId || !timestamp || !eventName) {
      logger.error('trackingId, timestamp, or eventName is missing');
      return res.status(400).send('Bad Request');
    }

    const parameters = {
      id: REF_TABLE_ID,
      rowKey: { tracking_id: trackingId },
      values: {
        event_name: eventName,
        cv_timestamp: timestamp,
      },
    };

    await craftFunctions.invoke({
      functionId: TARGET_FUNCTION_ID,
      data: {
        apiUrl: 'https://api.karte.io/v2beta/track/refTable/row/upsert',
        parameters,
        tokenSecretName: KARTE_APP_TOKEN_SECRET,
        retryTimeoutSec: RETRY_TIMEOUT_SEC,
      },
    });

    logger.debug(`Function invoke succeeded: ${TARGET_FUNCTION_ID}`);
    return res.status(200).send('Success');
  } catch (err) {
    logger.error('Function invoke failed:', err);
    return res.status(500).send('Server Error');
  }
}
