const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';

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

    const payload = {
      tableId: REF_TABLE_ID,
      rowKey: { tracking_id: trackingId },
      values: {
        event_name: eventName,
        cv_timestamp: timestamp,
      },
    };

    await craftFunctions.invoke({
      functionId: TARGET_FUNCTION_ID,
      data: payload,
    });

    logger.debug(`Function invoke succeeded: ${TARGET_FUNCTION_ID}`);
    return res.status(200).send('Success');
  } catch (err) {
    logger.error('Function invoke failed:', err);
    return res.status(500).send('Server Error');
  }
}
