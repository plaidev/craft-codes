import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const APP_TOKEN_SECRET = '<% APP_TOKEN_SECRET %>'; // シークレット名を指定する
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>'; // Craft Counterのkeyのprefix
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
const COUNTER_EXPIRE_SECONDS = Number('<% COUNTER_EXPIRE_SECONDS %>'); // 集計の保持期間（秒）

function paramErr(param) {
  return { craft_status_code: 400, error: `"${msg}"` }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, counter } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});

  if (data.kind !== 'karte/track-hook') {
    logger.error(new Error('invalid kind'));
    return;
  }
  if (
    data.jsonPayload.name !== 'craft-hook' ||
    data.jsonPayload.data.plugin_name !== 'craft'
  ) {
    logger.error(new Error('invalid kind'));
    return;
  }

  const { campaignId, limitNumber } = data.jsonPayload.data.hook_data.body;

  if (!campaignId.match(/^[a-f0-9]{24}$/)) {
    return paramErr('invalid campaignId.');
  }
  if (!limitNumber) return paramErr('limitNumber is required in the request body.');

  const key = COUNTER_KEY_PREFIX + campaignId;

  try {
    const incrementRes = await counter.increment({ 
      key: key,
      secondsToExpire: COUNTER_EXPIRE_SECONDS,
    }); 
    logger.debug("接客ID:", campaignId,",回数:",incrementRes,",上限:",limitNumber); 

    if (incrementRes < limitNumber) {
      return { craft_status_code: 200, result: "increment succeeded." };
    }

    const secrets = await secret.get({ keys: [APP_TOKEN_SECRET] });
    const token = secrets[APP_TOKEN_SECRET];
    karteApiClient.auth(token);
  
    const res = await karteApiClient.postV2betaActionCampaignToggleenabled({
      id: campaignId,
      enabled: false
    });
    if (res.status === 200) {
        logger.log("Campaign has been successfully stopped.")
    }
  } catch (err) {
    return { craft_status_code: 500, error: `write answer error: ${err}` };
  }
}