import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const CORS_ALLOWED_DOMAIN = '<% CORS_ALLOWED_DOMAIN %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const FORM_SITE_NAME = '<% FORM_SITE_NAME %>';
const FORM_DIR_PATH = '<% FORM_DIR_PATH %>';
const FORM_LIST_KVS_PREFIX = '<% FORM_LIST_KVS_PREFIX %>';
const PAGE_SIZE = 30;

async function updateForm(kvs, formId, title, fields, sites) {
  const path = `${FORM_DIR_PATH}/${formId}/fields.json`;

  const content = JSON.stringify({
    title,
    fields: fields.map(field => ({
      label: field.label,
      name: field.name,
      type: field.type,
      placeholder: field.placeholder,
    })),
  });
  const encodedContent = Buffer.from(content).toString('base64');

  await sites.postV2betaCraftSitesContentUpload({
    siteName: FORM_SITE_NAME,
    path,
    content: encodedContent,
  });

  // CDNキャッシュを削除
  await sites.postV2betaCraftSitesContentInvalidate({
    siteName: FORM_SITE_NAME,
    pathPattern: path,
  });
}

async function getForm(formId, sites) {
  const path = `${FORM_DIR_PATH}/${formId}/fields.json`;
  const result = await sites.postV2betaCraftSitesContentGet({
    siteName: FORM_SITE_NAME,
    path,
  });
  const formJson = Buffer.from(result.data.content, 'base64').toString('utf8');
  let form;
  try {
    form = JSON.parse(formJson);
    return form;
  } catch (e) {
    const err = new Error('content of fields.json is invalid as json.');
    err.status = 400;
    throw err;
  }
}

async function fetchAllKvsList(kvs, logger) {
  const forms = {}; 
  let startCursor = null;
  let hasMoreResults = true;
  
  try {
    while (hasMoreResults) {
      const response = await kvs.list({
        startCursor,
        pageSize: PAGE_SIZE,
        startKey: `${FORM_LIST_KVS_PREFIX}-1`,
        stopKey: `${FORM_LIST_KVS_PREFIX}-a`
      });
      
      logger.debug('kvs res:', response);
      
      if (!response || !response.item) {
        logger.warn('Unexpected response format from KVS');
        break;
      }
      
      Object.assign(forms, response.item);
      startCursor = response.endCursor;
      hasMoreResults = response.isMoreResults;
    }
  } catch (error) {
    logger.error('Error fetching KVS list:', error);
  }
  
  logger.debug('forms:', forms);
  return forms;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { req, res } = data;

  res.set('Access-Control-Allow-Origin', `https://${CORS_ALLOWED_DOMAIN}`);
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Credentials', true);
    return res.status(204).send('');
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const sites = api('@dev-karte/v1.0#3q52o2glxb1kejp');
  sites.auth(token);

  switch (req.method) {
    case 'POST': {
      const { shouldFetchList } = req.query;
      if (shouldFetchList === 'true') {
        try {
          const formList = await fetchAllKvsList(kvs, logger);
          return res.status(200).json(formList);
        } catch (err) {
          logger.error('Get list error:', err);
          return res.status(500).json({ error: 'Failed get form list.' });
        }
      }

      // フォーム更新時
      const { form_id: formId, title, fields } = req.body;

      if (!formId)
        return res.status(400).json({ error: 'form_id is required in the request body.' });
      if (!title) return res.status(400).json({ error: 'title is required in the request body.' });
      if (!fields)
        return res.status(400).json({ error: 'fields is required in the request body.' });

      try {
        await updateForm(kvs, formId, title, fields, sites);
        const message = `update form succeeded. form_id: ${formId}`;
        logger.log(message);
        return res.status(200).json({ message });
      } catch (err) {
        logger.error(`update form error. ${err}`);
        if (err.status >= 400 && err.status < 500) {
          return res.status(err.status).json({ error: err.message });
        }
        return res.status(500).json({ error: 'internal server error' });
      }
    }
    case 'GET': {
      // フォーム取得時
      const { form_id: formId } = req.query;
      if (!formId)
        return res.status(400).json({ error: 'form_id is required in the request body.' });

      try {
        const form = await getForm(formId, sites);

        logger.debug(`get form succeeded. form_id: ${formId}`);
        return res.status(200).json(form);
      } catch (err) {
        logger.error(`get form error. ${err}`);
        if (err.status >= 400 && err.status < 500) {
          return res.status(err.status).json({ error: err.message });
        }
        return res.status(500).json({ error: 'internal server error' });
      }
    }
    default:
      return res.status(405).json({ error: `${req.method} method is not allowed` });
  }
}
