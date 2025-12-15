import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SITE_NAME = '<% SITE_NAME %>';
const CRAFT_SITE_DOMAIN = '<% CRAFT_SITE_DOMAIN %>';
const UPLOAD_DIRECTORY = '<% UPLOAD_DIRECTORY %>';
const ALLOWED_ORIGIN = '<% ALLOWED_ORIGIN %>';
const AUTO_PUBLISH_AFTER_UPLOAD = '<% AUTO_PUBLISH_AFTER_UPLOAD %>';

function handleCorsPreflight(req, res, logger) {
  const srcOrigin = req.get('origin');

  if (srcOrigin === ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', srcOrigin);
  }

  if (req.method === 'OPTIONS') {
    logger.debug('Received OPTIONS (preflight) request. Responding with 204.');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '86400');
    res.status(204).send('');
    return true;
  }

  return false;
}

function validateAndPrepareData(req, logger) {
  const { filename, contentType, base64 } = req.body;

  if (!filename || !contentType || !base64) {
    logger.warn('Missing required parameters.');
    return null;
  }

  logger.log(`Received file data: Filename=${filename}, ContentType=${contentType}`);

  const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const uploadPath = `/${UPLOAD_DIRECTORY}/${datePrefix}/${filename}`;
  const fileUrl = `https://${CRAFT_SITE_DOMAIN}${uploadPath}`;

  return {
    filename,
    contentType,
    base64,
    path: uploadPath,
    url: fileUrl,
  };
}

async function executeUpload({ uploadData, appToken, autoPublish, logger }) {
  const sdk = api('@dev-karte/v1.0#l10f37mfxgrjj4');
  sdk.auth(appToken);

  logger.log(`Attempting to upload to Craft Sites path: ${uploadData.path}`);

  await sdk.postV2betaCraftSitesContentUpload({
    siteName: SITE_NAME,
    path: uploadData.path,
    content: uploadData.base64,
  });

  logger.log('File upload successful.');

  if (autoPublish) {
    await sdk.postV2betaCraftSitesContentUpdatevisibility({
      isPublic: true,
      siteName: SITE_NAME,
      path: uploadData.path,
    });

    logger.log('File visibility successfully set to Public.');
  } else {
    logger.log('[Publishing] Flag is false. File remains private.');
  }
  return {};
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  if (handleCorsPreflight(req, res, logger)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];

  const uploadData = validateAndPrepareData(req, logger);

  if (!uploadData) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    await executeUpload({
      uploadData,
      appToken,
      autoPublish: AUTO_PUBLISH_AFTER_UPLOAD,
      logger,
    });

    logger.log('Upload successful.');
    return res.status(200).json({
      message: 'Upload successful',
      url: uploadData.url,
    });
  } catch (error) {
    logger.error('Error during Craft Sites API call or visibility update:', error);
    return res.status(500).json({
      error: 'Failed to process file upload or visibility update.',
      details: error.message || error.toString(),
    });
  }
}
