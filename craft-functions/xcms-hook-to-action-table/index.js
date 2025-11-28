import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_MODEL_ID = '<% TARGET_MODEL_ID %>';
const ACTION_TABLE_ID = '<% ACTION_TABLE_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const TARGET_CMS_FIELDS = '<% TARGET_CMS_FIELDS %>';
const RETRY_TIMEOUT_SEC = 3600;

const cmsClient = api('@dev-karte/v1.0#dkmlqq5ormgswj37t');
const actionTableClient = api('@dev-karte/v1.0#1esei2umf20oay1');

/**
 * @param {string} eventType
 * @returns {boolean}
 */
function isTargetEventType(eventType) {
  const targetEventTypes = ['cms/content/publish', 'cms/content/unpublish'];
  return targetEventTypes.includes(eventType);
}

/**
 * @param {object} params
 * @param {string} params.msg
 * @param {number} params.status
 * @param {Error} params.RetryableError
 * @param {number} params.retryTimeoutSec
 */
function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

/**
 * @param {object} secret
 * @returns {Promise<string>}
 */
async function getAuthToken(secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  return secrets[KARTE_APP_TOKEN_SECRET];
}

/**
 * @param {string} token
 * @param {string} modelId
 * @param {string} contentId
 * @param {object} logger
 * @param {string} shortEventType
 * @returns {Promise<object | null>}
 */
async function fetchCmsContent(token, modelId, contentId, logger, shortEventType) {
  try {
    cmsClient.auth(token);
    const result = await cmsClient.postV2betaCmsContentGet({ modelId, contentId });
    return result.data;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to fetch CMS content for contentId: ${contentId}. error: ${msg}`;
    throw err;
  }
}

/**
 * @param {object} content
 * @param {object} logger
 * @param {string} shortEventType
 */

async function upsertToActionTable(content, logger, shortEventType) {
  let payload;
  try {
    const targetFields = TARGET_CMS_FIELDS.split(',').map(f => f.trim());

    const data = {
      content_id: content.id,
    };

    targetFields.forEach(field => {
      const value = content[field];

      if (value && typeof value === 'object' && value.src) {
        data[field] = value.src;
      } else {
        data[field] = value;
      }
    });

    payload = {
      table: ACTION_TABLE_ID,
      data,
    };

    logger.debug(`[@${shortEventType}] Upserting record with payload: ${JSON.stringify(payload)}`);

    await actionTableClient.postV2betaActionActiontableRecordsUpsert(payload);

    logger.debug(
      `[@${shortEventType}] Content upserted to Action Table: ${ACTION_TABLE_ID}, contentId: ${content.id}`
    );
  } catch (err) {
    const status = err.status || 'N/A';
    const originalMessage = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to upsert content to Action Table for contentId: ${content.id}. status: ${status}, error: ${originalMessage}`;
    throw err;
  }
}

/**
 * @param {string} contentId
 * @param {object} logger
 * @param {string} shortEventType
 */

async function deleteFromActionTable(contentId, logger, shortEventType) {
  let payload;
  try {
    payload = {
      table: ACTION_TABLE_ID,
      keys: [contentId],
    };

    logger.debug(`[@${shortEventType}] Deleting record with payload: ${JSON.stringify(payload)}`);

    await actionTableClient.postV2betaActionActiontableRecordsDelete(payload);

    logger.debug(
      `[@${shortEventType}] Content deleted from Action Table: ${ACTION_TABLE_ID}, contentId: ${contentId}`
    );
  } catch (err) {
    const status = err.status || 'N/A';
    const originalMessage = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to delete content from Action Table for contentId: ${contentId}. status: ${status}, error: ${originalMessage}`;
    throw err;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const eventType = data.jsonPayload.event_type;
  const shortEventType = eventType ? eventType.split('/').pop() : 'unknown';

  if (!isTargetEventType(eventType)) {
    logger.debug(`[skip] not a target event type: ${eventType}`);
    return;
  }

  const { modelId } = data.jsonPayload.data.sys;
  if (modelId !== TARGET_MODEL_ID) {
    logger.debug(`[skip] not a target model: ${modelId}`);
    return;
  }

  const { id: contentId } = data.jsonPayload.data;

  try {
    const token = await getAuthToken(secret);
    actionTableClient.auth(token);

    if (eventType === 'cms/content/unpublish') {
      await deleteFromActionTable(contentId, logger, shortEventType);
      logger.log(
        `[@${shortEventType}] Content deletion completed successfully, contentId: ${contentId}`
      );
      return;
    }

    const content = await fetchCmsContent(token, modelId, contentId, logger, shortEventType);

    if (!content) {
      logger.debug(`[@skip] No content data found for contentId: ${contentId}`);
      return;
    }

    await upsertToActionTable(content, logger, shortEventType);

    logger.log(`[@${shortEventType}] completed successfully, contentId: ${contentId}`);
  } catch (err) {
    throwSuitableError({
      msg: err.message,
      status: err.status,
      RetryableError,
      retryTimeoutSec: RETRY_TIMEOUT_SEC,
    });
  }
}
