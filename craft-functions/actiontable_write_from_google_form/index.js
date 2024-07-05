import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SECRET_NAME = '<% SECRET_NAME %>';
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
const TABLE_ID = '<% TABLE_ID %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const { req, res } = data;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [SECRET_NAME] });
  const token = secrets[SECRET_NAME];
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
      table: TABLE_ID,
      data: {
        pageurl: pageUrl,
        salescount: salesCount,
        others,
      },
    });
    logger.log(`${TABLE_ID} is updated`);
    res.status(200).send({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).send({ message: 'Error occurred' });
  }
}