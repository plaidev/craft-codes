import api from 'api';

const LOG_LEVEL ='<% LOG_LEVEL %>';
const REF_TABLE_ID = '<% REF_TABLE_ID %>';
const ACCESS_TOKEN_SECRET = '<% ACCESS_TOKEN_SECRET %>';
const GROUP_ID_FIELD = '<% GROUP_ID_FIELD %>';

const karteApiClient = api('@dev-karte/v1.0#yeekp16lpj2g7af');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});

  const secrets = await secret.get({keys: [ACCESS_TOKEN_SECRET]}); 
  const token = secrets[ACCESS_TOKEN_SECRET];
  karteApiClient.auth(token);

  const groupId = data.jsonPayload.data[GROUP_ID_FIELD];
  const campaignId = data.jsonPayload.data.campaign_id;

  // 回答されたアンケートの結果(has_answered_enquete_〇〇〇)をtrueとして紐付けテーブルに追加
  try {
    await karteApiClient.postV2betaTrackReftableRowUpsert({
        id: REF_TABLE_ID,
        rowKey: {[GROUP_ID_FIELD]: groupId},
        values: {[`has_answered_enquete_${campaignId}`]: true}
    });
    logger.log(`Update ref_table succeeded. ${GROUP_ID_FIELD}: ${groupId}, campaign_id: ${campaignId}`);
  } catch (e) {
    logger.error(e);
  }
}
