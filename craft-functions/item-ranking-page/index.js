import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const RANKING_SITE_NAME = '<% RANKING_SITE_NAME %>';
const RANKING_JSON_PATH = '<% RANKING_JSON_PATH %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

async function updateRanking(products, sites) {
  const content = JSON.stringify({
    updated_at: new Date().getTime(),
    products,
  });
  const encodedContent = Buffer.from(content).toString('base64');

  await sites.postV2betaCraftSitesContentUpload({
    siteName: RANKING_SITE_NAME,
    path: RANKING_JSON_PATH,
    content: encodedContent,
  });

  // CDNキャッシュを削除
  await sites.postV2betaCraftSitesContentInvalidate({
    siteName: RANKING_SITE_NAME,
    pathPattern: RANKING_JSON_PATH,
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const productsBase64 = data.jsonPayload.data.value;
  let products;

  try {
    const productsJson = Buffer.from(productsBase64, 'base64');
    products = JSON.parse(productsJson);
  } catch (err) {
    logger.error(`Failed to parse products data. error: ${err}`);
    return;
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const sites = api('@dev-karte/v1.0#3q52o2glxb1kejp');
  sites.auth(token);

  try {
    await updateRanking(products, sites);
    logger.log(`update ranking succeeded.`);
  } catch (err) {
    logger.error(`Failed to update ranking. error: ${err}`);
  }
}
