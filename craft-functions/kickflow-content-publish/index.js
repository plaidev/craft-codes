import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const CONTENT_ID_FIELD_CODE = '<% CONTENT_ID_FIELD_CODE %>';

function extractContentIdFromInputs(ticketInputs, logger) {
  const idInput = ticketInputs.find(input => input.formField?.code === CONTENT_ID_FIELD_CODE);

  if (!idInput || typeof idInput.value !== 'string' || !idInput.value) {
    logger.error(`Content ID field (${CONTENT_ID_FIELD_CODE}) not found or value is invalid.`);
    return null;
  }

  const contentId = idInput.value;
  logger.debug('Extracted Content ID:', contentId);
  return contentId;
}

async function executeCmsPublish(contentId, modelId, cmsApi, logger, res) {
  try {
    const publishResponse = await cmsApi.postV2betaCmsContentPublish({
      kickHookV2: false,
      contentId,
      modelId,
    });

    logger.debug('✅ Content published successfully.', publishResponse.data);
    // 成功: HTTP 200 OK を返却 (Kickflowの要件)
    res.status(200).send({ message: 'Content published and webhook processed.' });
  } catch (err) {
    logger.error(`❌ Content publish failed for ${contentId}: ${err.message}`);
    res.status(500).send({ error: 'Publishing failed.', detail: err.message });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const { req, res } = data;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (!req || !req.body) {
    logger.error('Invalid Webhook data received (missing body).');
    return res.status(400).send({ error: 'Missing request body.' });
  }

  const webhookData = req.body;
  const eventType = webhookData.eventType;

  if (eventType !== 'ticket_approved') {
    logger.warn(`Skipping event: ${eventType}. Only 'ticket_approved' is processed.`);
    // Kickflowには正常受信を伝えるため 200 OK を返却
    return res.status(200).send({ message: `Event type ${eventType} ignored.` });
  }

  const token = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const karteApiToken = token[KARTE_APP_TOKEN_SECRET];

  const cmsApi = api('@dev-karte/v1.0#n0jmhx43zga');
  cmsApi.auth(karteApiToken);

  const ticketInputs = webhookData.data?.ticket?.inputs;

  if (!ticketInputs) {
    logger.error('Ticket inputs array not found in webhook payload. Aborting.');
    return res.status(400).send({ error: 'Missing ticket inputs in payload.' });
  }

  const contentId = extractContentIdFromInputs(ticketInputs, logger);

  if (!contentId) {
    logger.error('Content ID could not be extracted. Aborting.');
    return res.status(400).send({ error: 'Content ID extraction failed.' });
  }

  await executeCmsPublish(contentId, CMS_MODEL_ID, cmsApi, logger, res);
}
