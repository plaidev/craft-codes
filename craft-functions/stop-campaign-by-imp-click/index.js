import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>';
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
const COUNTER_EXPIRE_SECONDS = Number('<% COUNTER_EXPIRE_SECONDS %>');

function paramErr(msg) {
  return { error: msg };
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, counter } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { campaignId, limitNumber } = req.body;

  if (!campaignId.match(/^[a-f0-9]{24}$/)) {
    res.status(400).send(paramErr('invalid campaignId.'));
    return;
  }
  if (!limitNumber) {
    res.status(400).send(paramErr('limitNumber is required in the request body.'));
    return;
  }

  const key = `${COUNTER_KEY_PREFIX}_${campaignId}`;

  try {
    const incrementRes = await counter.increment({
      key,
      secondsToExpire: COUNTER_EXPIRE_SECONDS,
    });
    logger.debug('接客ID:', campaignId, ',回数:', incrementRes, ',上限:', limitNumber);

    if (incrementRes < limitNumber) {
      res.status(200).send({ result: 'increment succeeded.' });
      return;
    }

    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];
    karteApiClient.auth(token);

    const apiRes = await karteApiClient.postV2betaActionCampaignToggleenabled({
      id: campaignId,
      enabled: false,
    });
    if (apiRes.status === 200) {
      logger.log('Campaign has been successfully stopped.');
      res.status(200).send({ result: 'Campaign has been successfully stopped.' });
    } else {
      res.status(apiRes.status).send({ error: 'Failed to stop campaign.' });
    }
  } catch (err) {
    res.status(500).send({ error: `write answer error: ${err}` });
  }
}