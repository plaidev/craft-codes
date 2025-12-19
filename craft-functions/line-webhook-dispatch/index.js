import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_CHANNEL_SECRET_KEY = '<% LINE_CHANNEL_SECRET_KEY %>';
const TARGET_URLS = '<% TARGET_URLS %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';

function verifySignature(lineChannelSecret, lineSignature, body) {
  const computedSignature = crypto
    .createHmac('SHA256', lineChannelSecret)
    .update(JSON.stringify(body))
    .digest('base64');
  return lineSignature === computedSignature;
}

async function invokeTarget(url, { craftFunctions, targetFunctionId, signature, body, logger }) {
  try {
    await craftFunctions.invoke({
      functionId: targetFunctionId,
      data: {
        targetUrl: url,
        headers: {
          'x-line-signature': signature,
        },
        body,
      },
    });
    logger.debug(`Invoke success for: ${url}`);
  } catch (err) {
    logger.error(`Failed to invoke target for ${url}:`, err);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, craftFunctions } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  const secrets = await secret.get({ keys: [LINE_CHANNEL_SECRET_KEY] });
  const lineChannelSecret = secrets[LINE_CHANNEL_SECRET_KEY];
  const lineSignature = req.headers['x-line-signature'];

  const isValidSignature = verifySignature(lineChannelSecret, lineSignature, req.body);

  if (!isValidSignature) {
    logger.warn('署名が一致しません。');
    res.status(403).send('Forbidden');
    return;
  }

  const targets = TARGET_URLS.split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  logger.debug(`署名検証に成功しました。${targets.length} 件の宛先へ転送を開始します。`);

  const invokePromises = targets.map(url =>
    invokeTarget(url, {
      craftFunctions,
      targetFunctionId: TARGET_FUNCTION_ID,
      signature: lineSignature,
      body: req.body,
      logger,
    })
  );

  await Promise.all(invokePromises);

  res.status(200).send('OK');
}
