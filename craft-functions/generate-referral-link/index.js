import { randomUUID } from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const TARGET_FUNCTION_ID = '<% TARGET_FUNCTION_ID %>';
const KARTE_EVENT_NAME = '<% KARTE_EVENT_NAME %>';

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, craftFunctions } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const srcOrigin = req.get('origin');
  const origins = ALLOWED_ORIGINS.split(',').map(o => o.trim());
  if (origins.includes(srcOrigin)) {
    res.set('Access-Control-Allow-Origin', srcOrigin);
  }

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { user_id: userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const referralCode = randomUUID();

    await craftFunctions.invoke({
      functionId: TARGET_FUNCTION_ID,
      data: {
        apiUrl: 'https://api.karte.io/v2/track/event/write',
        tokenSecretName: KARTE_APP_TOKEN_SECRET,
        parameters: {
          keys: { user_id: userId },
          event: {
            event_name: KARTE_EVENT_NAME,
            values: { referral_code: referralCode },
          },
        },
      },
    });

    return res.status(200).json({
      referral_code: referralCode,
    });
  } catch (error) {
    logger.error('error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
