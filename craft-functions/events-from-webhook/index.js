import api from 'api';

const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME %>';
const VALUES_FIELDS = '<% VALUES_FIELDS %>';
const USER_ID_FIELD = '<% USER_ID_FIELD %>';
const VISTOR_ID_PREFIX = '<% VISTOR_ID_PREFIX %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const { req, res } = data;
  const payload = req.body.payload;
  const userId = payload[USER_ID_FIELD];

  const values = {};
  const fields = VALUES_FIELDS.split(',');
  fields.forEach(field => {
    values[field] = payload[field];
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    await karteApiClient.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: `${VISTOR_ID_PREFIX}-${userId}` },
      event: {
        event_name: EVENT_NAME,
        values,
      },
    });
    logger.log(`Event sent successfully. event_name: ${EVENT_NAME}`);
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
}