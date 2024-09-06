import api from 'api';

const insight = api('@dev-karte/v1.0#1jvnhd6llgekil84');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

function validateInput(body) {
  const { userId, eventName, values } = body;

  if (!userId) {
    return { error: 'no user_id' };
  }
  if (!eventName) {
    return { error: 'no event_name' };
  }

  let parsedValues;
  try {
    parsedValues = typeof values === 'string' ? JSON.parse(values) : values;
  } catch (e) {
    return { error: 'invalid values format' };
  }

  return { userId, eventName, values: parsedValues };
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  insight.auth(token);

  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const validationResult = validateInput(body);

  if (validationResult.error) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { userId, eventName, values } = validationResult;

  try {
    const response = await insight.postV2TrackEventWrite({
      keys: { userId },
      event: {
        eventName,
        values,
      },
    });

    const timestamp = Date.now();

    if (response.status !== 200) {
      logger.error(`${response.status}: ${response}`);
      return res.status(response.status).json({ error: response });
    }

    res.status(200).json({ result: 'イベント送信に成功', error: null, timestamp });
  } catch (e) {
    const errStr = JSON.stringify(e);
    logger.error(errStr);
    res.status(500).json({ error: errStr });
  }
}
