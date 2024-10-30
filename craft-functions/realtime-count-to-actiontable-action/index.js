import api from 'api';

const LOG_LEVEL = 'DEBUG';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>';
const TABLE_KEY = '<% TABLE_KEY %>';
const COLUMN_NAME = '<% COLUMN_NAME %>';

const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');

async function incrementAmount(data, counter, logger) {
  try {
    const changeAmount = data.jsonPayload.data.changeAmount;
    const intChangeAmount = parseInt(changeAmount, 10);

    const updatedRes = await counter.increment({ key: TABLE_KEY, changeAmount: intChangeAmount });
    return updatedRes;
  } catch (e) {
    logger.error(`Error in incrementAmount: ${e}`);
  }
}

async function upsertActiontable(logger, counter, karteClient) {
  try {
    const getRes = await counter.get({ keys: [TABLE_KEY] });

    await karteClient.postV2betaActionActiontableRecordsUpsert({
      table: ACTION_TABLE_ID,
      data: {
        key: TABLE_KEY,
        [COLUMN_NAME]: getRes,
      },
    });
    logger.log(`${ACTION_TABLE_ID} is updated`);
  } catch (e) {
    logger.error(`Error in upsertActiontable: ${e}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, counter, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  if (data.kind === 'karte/action') {
    await incrementAmount(data.jsonPayload.data.changeAmount, logger, counter);
    return;
  }

  if (data.kind === 'karte/craft-scheduler') {
    await upsertActiontable(logger, counter, karteApiClient);
  }
}
