import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const LINE_LOGIN_CHANNEL_ID = '<% LINE_LOGIN_CHANNEL_ID %>';
const KARTE_EVENT_NAME = '<% KARTE_EVENT_NAME %>';

async function verifyIdToken(idToken, lineLoginChannelId, logger) {
  try {
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: lineLoginChannelId,
      }),
    });

    if (!verifyResponse.ok) {
      const err = await verifyResponse.text();
      throw new Error(
        `Failed to verify token: status: ${verifyResponse.statusText}, error: ${err}`
      );
    }

    const verifyData = await verifyResponse.json();
    return verifyData.sub;
  } catch (error) {
    logger.error(`Error verifying ID token: ${error.message}`);
    throw error;
  }
}

async function upsertKarteRefTable({ sdk, tableId, rowKey, values, logger }) {
  try {
    await sdk.postV2betaTrackReftableRowUpsert({
      id: tableId,
      rowKey,
      values,
    });
    logger.log(`Upserted ref table successfully`);
  } catch (error) {
    logger.error(`Error upserting KARTE ref table: ${error.message}`);
    throw error;
  }
}

async function sendKarteEvent({ sdk, visitorId, eventName, eventValues, logger }) {
  try {
    await sdk.postV2betaTrackEventWriteandexecaction({
      keys: { visitor_id: visitorId },
      event: {
        event_name: eventName,
        values: eventValues,
      },
    });
    logger.log('Send event to KARTE successfully');
  } catch (error) {
    logger.error('Failed to send event to KARTE:', error);
    throw new Error('Failed to send event to KARTE');
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;
  const sdk = api('@dev-karte/v1.0#emcs633m3nxep4d');

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET],
  });
  const karteToken = secrets[KARTE_APP_TOKEN_SECRET];
  sdk.auth(karteToken);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { idToken, utmParams, visitorId, isFriend } = req.body;

  if (!idToken || !visitorId || typeof isFriend === 'undefined') {
    logger.error('Missing required data: idToken, visitorId, or isFriend');
    res.status(400).json({ error: 'Invalid request: Missing required data' });
    return;
  }

  try {
    const lineId = await verifyIdToken(idToken, LINE_LOGIN_CHANNEL_ID, logger);

    await upsertKarteRefTable({
      sdk,
      tableId: REF_TABLE_ID,
      rowKey: { user_id: `vis-${visitorId}` },
      values: {
        line_id: lineId,
        utm_source: utmParams?.source || null,
        utm_medium: utmParams?.medium || null,
        utm_campaign: utmParams?.campaign || null,
        is_friend: isFriend,
      },
      logger,
    });

    await sendKarteEvent({
      sdk,
      visitorId,
      eventName: KARTE_EVENT_NAME,
      eventValues: {
        line_id: lineId,
        utm_source: utmParams?.source || null,
        utm_medium: utmParams?.medium || null,
        utm_campaign: utmParams?.campaign || null,
        is_friend: isFriend,
      },
      logger,
    });

    res.status(200).json({ message: 'Data & event successfully sent to KARTE' });
  } catch (error) {
    logger.error(`Error processing request: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}
