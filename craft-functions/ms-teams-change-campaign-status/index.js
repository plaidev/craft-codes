import api from 'api';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_SECRET_NAME = '<% KARTE_APP_SECRET_NAME %>';
const TEAMS_OUTGOING_WEBHOOK_SECRET_NAME = '<% TEAMS_OUTGOING_WEBHOOK_SECRET_NAME %>';
const karteApiClient = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;
  const headers = req.headers;
  const body = req.body;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const secrets = await secret.get({ keys: [KARTE_APP_SECRET_NAME, TEAMS_OUTGOING_WEBHOOK_SECRET_NAME] });
  const token = secrets[KARTE_APP_SECRET_NAME];
  const teamsToken = secrets[TEAMS_OUTGOING_WEBHOOK_SECRET_NAME];
  karteApiClient.auth(token);
  
  function teamsMessage(text) {
    return { type: 'message', text };
  }

  try {
    const authorization = headers.authorization?.split(' ')[1];

    const bufSecret = Buffer.from(teamsToken, 'base64');
    const msgBuf = Buffer.from(JSON.stringify(body), 'utf8');
    const msgHash =
      'HMAC ' +
      crypto.createHmac('sha256', bufSecret).update(msgBuf).digest('base64');

    if (msgHash !== authorization) {
      res.status(401).send(teamsMessage(`提供された認証情報が無効です。正しい認証情報を提供して再度試してください。`));
      return;
    }

    const text = body.text;
    const campaignID = text.match(/(?<![a-f0-9])[a-f0-9]{24}(?![a-f0-9])/g);

    if (!campaignID) {
      res.status(400).send(teamsMessage(`入力データ内に接客サービスIDが見つかりませんでした。`));
      return;
    }
    
    let status;
    if (text.includes("true")) {
      status = true;
    } else if (text.includes("false")) {
      status = false;
    } else {
      res.status(400).send(teamsMessage(`入力データ内にtrue/falseが見つかりませんでした。`));
      return;
    }

    const response = await karteApiClient.postV2betaActionCampaignToggleenabled({
      id: campaignID[0],
      enabled: status
    });

    if (response.status === 200) {
      res.status(200).send(teamsMessage(`接客のステータスが変わりました。</br>接客ID：${campaignID[0]}</br>ステータス：${status}`));
    }
  } catch (e) {
    logger.error(e);
    res.status(400).send(teamsMessage(`無効なリクエストです。入力データを確認し、再度試してください。`));
  }
}