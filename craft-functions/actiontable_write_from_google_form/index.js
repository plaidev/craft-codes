import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const { req, res } = data;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const pageUrl = req.body.PageURL;
  const salesCount = req.body.SalesCount;
  const others = req.body.Others;

  try {
    await karteApiClient.postV2betaActionActiontableRecordsUpsert({
      table: ACTION_TABLE_ID,
      data: {
        pageurl: pageUrl,
        salescount: salesCount,
        others,
      },
    });
    logger.log(`${ACTION_TABLE_ID} is updated`);
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ message: 'Error occurred' });
  }
}
