import api from 'api';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_SECRET_NAME = '<% KARTE_APP_SECRET_NAME %>';
const TEAMS_OUTGOING_WEBHOOK_SECRET_NAME = '<% TEAMS_OUTGOING_WEBHOOK_SECRET_NAME %>';
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

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

  const { body, headers } = data.jsonPayload.data.hook_data;
  const secrets = await secret.get({ keys: [KARTE_APP_SECRET_NAME, TEAMS_OUTGOING_WEBHOOK_SECRET_NAME] });
  const token = secrets[KARTE_APP_SECRET_NAME];
  const teamsToken = secrets[TEAMS_OUTGOING_WEBHOOK_SECRET_NAME];
  karteApiClient.auth(token);
  
  function teamsMessage(text) {
    return { type: 'message', text };
  }

  try {
    const { authorization } = headers;

    const bufSecret = Buffer.from(teamsToken, 'base64');
    const msgBuf = Buffer.from(JSON.stringify(body), 'utf8');
    const msgHash =
      'HMAC ' +
      crypto.createHmac('sha256', bufSecret).update(msgBuf).digest('base64');

    if (msgHash !== authorization) {
      return teamsMessage(`提供された認証情報が無効です。正しい認証情報を提供して再度試してください。`);
    }

    const text = body.text;
    const campaignID = text.match(/(?<![a-f0-9])[a-f0-9]{24}(?![a-f0-9])/g);

    if (!campaignID) return teamsMessage(`入力データ内に接客サービスIDが見つかりませんでした。`);
    
    let status;
    if (text.includes("true")) {
      status = true;
    } else if (text.includes("false")) {
      status = false;
    } else {
      return teamsMessage(`入力データ内にtrue/falseが見つかりませんでした。`);
    }

    const res = await karteApiClient.postV2betaActionCampaignToggleenabled({
      id: campaignID[0],
      enabled: status
    });

    if (res.status === 200) {
      return teamsMessage(`接客のステータスが変わりました。</br>接客ID：${campaignID[0]}</br>ステータス：${status}`);
    }
  } catch (e) {
    logger.error(e);
    return teamsMessage(`無効なリクエストです。入力データを確認し、再度試してください。`);
  }
}