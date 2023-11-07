import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const APP_TOKEN_SECRET = '<% APP_TOKEN_SECRET %>';
const EVENT_NAME = '<% EVENT_NAME %>';
const ACCOUNTENGAGEMENT_CLIENT_ID = '<% ACCOUNTENGAGEMENT_CLIENT_ID %>';
const ACCOUNTENGAGEMENT_CLIENT_SECRET = '<% ACCOUNTENGAGEMENT_CLIENT_SECRET %>';
const ACCOUNTENGAGEMENT_USERNAME = '<% ACCOUNTENGAGEMENT_USERNAME %>';
const ACCOUNTENGAGEMENT_PASSWORD = '<% ACCOUNTENGAGEMENT_PASSWORD %>';
const ACCOUNTENGAGEMENT_BUSINESS_UNIT_ID = '<% ACCOUNTENGAGEMENT_BUSINESS_UNIT_ID %>';
const PROSPECTFIELDS = '<% PROSPECTFIELDS %>';

const karteApiClient = api('@dev-karte/v1.0#1jvnhd6llgekil84');

// SalesforceのOAuth認証
async function authenticateSalesforce(clientId, clientSecret, username, password, logger) {
  const authUrl = 'https://login.salesforce.com/services/oauth2/token';
  try {
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=password&client_id=${clientId}&client_secret=${clientSecret}&username=${username}&password=${password}`,
    });
    if (authResponse.status !== 200) {
      throw new Error(`Status Code: ${authResponse.status} msg: ${authResponse.message}`);
    }
    return await authResponse.json();
  } catch (err) {
    logger.error(`Error during Salesforce authentication: ${err}`);
    return null;
  }
}

// 各objectへGETリクエスト
async function callApi(url, method, headers, logger, objectType) {
  try {
    const response = await fetch(url, { method, headers });
    if (response.status !== 200) {
      throw new Error(
        `Request Failed for ${objectType}. Status Code: ${response.status} msg: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (err) {
    logger.error(`API Request Error. ${err}`);
    return null;
  }
}

// visitor object取得
async function getAeVisitor(aeCookie, unitId, accessToken, logger) {
  const visitorGetUrl = 'https://pi.pardot.com/api/v5/objects/visitors/';
  return callApi(
    `${visitorGetUrl}${aeCookie}?fields=id,prospectId`,
    'GET',
    {
      'content-type': 'application/json',
      'Pardot-Business-Unit-Id': unitId,
      Authorization: `Bearer ${accessToken}`,
    },
    logger,
    'Visitor Object'
  );
}

// prospect object取得
async function getAeProspect(prospectId, unitId, accessToken, logger) {
  const prospectGetUrl = 'https://pi.pardot.com/api/v5/objects/prospects/';
  return callApi(
    `${prospectGetUrl}${prospectId}?fields=id,${PROSPECTFIELDS}`,
    'GET',
    {
      'content-type': 'application/json',
      'Pardot-Business-Unit-Id': unitId,
      Authorization: `Bearer ${accessToken}`,
    },
    logger,
    'Prospect Object'
  );
}

// KARTEへのイベント送信
async function sendEventToKarte(visitorId, aeProspectResponse, logger) {
  const values = {};
  const fields = PROSPECTFIELDS.split(',');
  fields.forEach(field => {
    values[field] = aeProspectResponse[field];
  });
  try {
    await karteApiClient.postV2TrackEventWrite({
      keys: { visitor_id: visitorId },
      event: {
        values,
        event_name: EVENT_NAME,
      },
    });
    logger.log(`Event sent successfully.`);
  } catch (err) {
    logger.error(`Error during KARTE event sending: ${err}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // validation
  if (data.kind !== 'karte/action') {
    logger.log(`invalid kind ${data.kind}`);
    return;
  }

  const { cookie: aeCookie, visitor_id: visitorId } = data.jsonPayload.data;
  const secrets = await secret.get({ keys: [APP_TOKEN_SECRET] });
  const token = secrets[APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const {
    ACCOUNTENGAGEMENT_CLIENT_ID: clientId,
    ACCOUNTENGAGEMENT_CLIENT_SECRET: clientSecret,
    ACCOUNTENGAGEMENT_USERNAME: username,
    ACCOUNTENGAGEMENT_PASSWORD: password,
    ACCOUNTENGAGEMENT_BUSINESS_UNIT_ID: unitId,
  } = await secret.get({
    keys: [
      ACCOUNTENGAGEMENT_CLIENT_ID,
      ACCOUNTENGAGEMENT_CLIENT_SECRET,
      ACCOUNTENGAGEMENT_USERNAME,
      ACCOUNTENGAGEMENT_PASSWORD,
      ACCOUNTENGAGEMENT_BUSINESS_UNIT_ID,
    ],
  });

  const authResponse = await authenticateSalesforce(
    clientId,
    clientSecret,
    username,
    password,
    logger
  );
  if (!authResponse) return;

  const aeVisitorResponse = await getAeVisitor(aeCookie, unitId, authResponse.access_token, logger);
  if (!aeVisitorResponse || aeVisitorResponse.prospectId === null) return;

  const aeProspectResponse = await getAeProspect(
    aeVisitorResponse.prospectId,
    unitId,
    authResponse.access_token,
    logger
  );
  if (!aeProspectResponse) return;

  await sendEventToKarte(visitorId, aeProspectResponse, logger);
}
