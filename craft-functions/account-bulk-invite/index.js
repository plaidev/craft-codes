import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET_NAME = '<% KARTE_APP_TOKEN_SECRET_NAME %>';
const karteApiClient = api('@dev-karte/v1.0#kw2clsjsddl8');

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET_NAME] });
  const token = secrets[KARTE_APP_TOKEN_SECRET_NAME];

  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  const values = data.jsonPayload.data.value;
  const fileSettings = values.trim().split(/\s*,\s*/);
  const email = fileSettings[0];
  const roleId = fileSettings[1];

  karteApiClient.auth(token);

  try {
    const response = await karteApiClient.postV2betaAccountCreate({
      email,
      role_id: roleId,
    });
    logger.info('Invite account success:', response.data);
  } catch (error) {
    logger.error('Error inviting account:', error.message);
  }
}
