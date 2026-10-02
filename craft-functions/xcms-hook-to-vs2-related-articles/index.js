import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_MODEL_ID = '<% TARGET_MODEL_ID %>';
const VS2_COLLECTION_ID = '<% VS2_COLLECTION_ID %>';
const CMS_FIELD_TITLE = '<% CMS_FIELD_TITLE %>';
const CMS_FIELD_DESCRIPTION = '<% CMS_FIELD_DESCRIPTION %>';
const CMS_FIELD_CONTENT = '<% CMS_FIELD_CONTENT %>';
const CMS_FIELD_RELATED = '<% CMS_FIELD_RELATED %>';
const RELATED_COUNT = Number('<% RELATED_COUNT %>');
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SEARCH_MAX_RETRIES = 5;
const SEARCH_RETRY_DELAY_MS = 3000;
const RETRY_TIMEOUT_SEC = 3600;
const CMS_SPEC_URI = '@dev-karte/v1.0#1g9n3z10mdh7d91y';

// Keys are the fields in the Vector Search 2.0 collection; values are CMS field IDs.
const VS2_FIELD_MAPPING = {
  title: CMS_FIELD_TITLE,
  description: CMS_FIELD_DESCRIPTION,
  content: CMS_FIELD_CONTENT,
};

const cmsClient = api(CMS_SPEC_URI);

function getEventType(data) {
  return data?.jsonPayload?.event_type;
}

function getContentId(data) {
  return data?.jsonPayload?.data?.id || data?.jsonPayload?.data?.sys?.raw?.contentId;
}

function getTextValue(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.text || value.html || '';
  return '';
}

function getRelatedIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => (typeof item === 'string' ? item : item?.contentId || item?.id))
    .filter(Boolean);
}

function hasUnpublishedDraft(content) {
  const raw = content?.sys?.raw || {};
  return Boolean(raw.draftRevisionId || raw.hasDraft || content?.sys?.hasDraft);
}

function isPublished(content) {
  return Boolean(content?.sys?.raw?.publishedRevisionId);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function throwSuitableError({ err, RetryableError }) {
  const status = err.status || err.response?.status;
  const message = err.message || 'Unknown error';
  if ((status >= 500 && status < 600) || [408, 429].includes(status)) {
    throw new RetryableError(`[retry] ${message}`, RETRY_TIMEOUT_SEC);
  }
  throw err;
}

async function fetchContent({ modelId, contentId, logger }) {
  const result = await cmsClient.postV2betaCmsContentGet({ modelId, contentId });
  logger.debug(`Fetched CMS content: ${contentId}`);
  return result.data;
}

async function fetchAllContents({ modelId, logger }) {
  const items = [];
  const pageSize = 1000;
  for (let skip = 0; ; skip += pageSize) {
    const result = await cmsClient.postV2betaCmsContentList({
      modelId,
      order: ['-sys.raw.updatedAt'],
      skip,
      limit: pageSize,
    });
    const page = result.data?.items || [];
    items.push(...page);
    if (page.length < pageSize) break;
  }
  logger.debug(`Fetched ${items.length} CMS contents`);
  return items;
}

function toVectorData(content) {
  return Object.entries(VS2_FIELD_MAPPING).reduce((data, [vectorField, cmsField]) => {
    data[vectorField] = getTextValue(content[cmsField]);
    return data;
  }, {});
}

async function replaceVectorDocument({ vectorSearch2, content, contentId }) {
  try {
    await vectorSearch2.get({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
    await vectorSearch2.delete({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status !== 404) throw err;
  }

  // Auto Embeddings run on create. Recreate existing records to refresh their embeddings.
  await vectorSearch2.create({
    collectionId: VS2_COLLECTION_ID,
    dataObjectId: contentId,
    data: toVectorData(content),
  });
}

async function searchRelated({ vectorSearch2, content, contentId, count, logger }) {
  const text = Object.values(VS2_FIELD_MAPPING)
    .map(field => getTextValue(content[field]))
    .filter(Boolean)
    .join('\n');
  if (!text.trim() || count < 1) return [];

  for (let attempt = 1; attempt <= SEARCH_MAX_RETRIES; attempt += 1) {
    const { results = [] } = await vectorSearch2.search({
      collectionId: VS2_COLLECTION_ID,
      query: { vectorField: 'embedding', text },
      topK: count + 1,
      outputFields: { dataFields: Object.keys(VS2_FIELD_MAPPING), vectorFields: [] },
    });
    const ids = results
      .map(result => result.dataObject?.dataObjectId)
      .filter(id => id && id !== contentId);
    if (ids.length >= count || attempt === SEARCH_MAX_RETRIES) return ids.slice(0, count);
    logger.debug(`Vector Search results not ready; retry ${attempt}/${SEARCH_MAX_RETRIES}`);
    await sleep(SEARCH_RETRY_DELAY_MS);
  }
  return [];
}

async function writeRelated({ contentId, relatedIds, logger }) {
  await cmsClient.postV2betaCmsContentPatch({
    modelId: TARGET_MODEL_ID,
    contentId,
    kickHookV2: false,
    operations: [{ op: 'replace', path: `/${CMS_FIELD_RELATED}`, value: relatedIds }],
  });
  await cmsClient.postV2betaCmsContentPublish({
    modelId: TARGET_MODEL_ID,
    contentId,
    kickHookV2: false,
  });
  logger.debug(`Updated related articles for ${contentId}: ${relatedIds.join(', ')}`);
}

async function processPublished({ contentId, vectorSearch2, logger }) {
  const content = await fetchContent({ modelId: TARGET_MODEL_ID, contentId, logger });
  if (!content || !isPublished(content)) {
    logger.warn(`Content is not published; skipping: ${contentId}`);
    return;
  }
  if (hasUnpublishedDraft(content)) {
    logger.warn(`Content has an unpublished draft; skipping to protect it: ${contentId}`);
    return;
  }

  await replaceVectorDocument({ vectorSearch2, content, contentId });
  const relatedIds = await searchRelated({
    vectorSearch2,
    content,
    contentId,
    count: RELATED_COUNT,
    logger,
  });
  await writeRelated({ contentId, relatedIds, logger });

  // Add the new article to the related list of its nearest published neighbors.
  for (const relatedId of relatedIds) {
    const relatedContent = await fetchContent({
      modelId: TARGET_MODEL_ID,
      contentId: relatedId,
      logger,
    });
    if (!relatedContent || !isPublished(relatedContent) || hasUnpublishedDraft(relatedContent)) {
      logger.debug(`Skipping neighbor with unpublished draft or no published revision: ${relatedId}`);
      continue;
    }
    const current = getRelatedIds(relatedContent[CMS_FIELD_RELATED]).filter(id => id !== contentId);
    await writeRelated({
      contentId: relatedId,
      relatedIds: [contentId, ...current].slice(0, RELATED_COUNT),
      logger,
    });
  }
}

async function processUnpublished({ contentId, vectorSearch2, logger }) {
  try {
    await vectorSearch2.delete({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
  } catch (err) {
    const status = err.status || err.response?.status;
    if (status !== 404) throw err;
    logger.debug(`Vector document was already absent: ${contentId}`);
  }

  const contents = await fetchAllContents({ modelId: TARGET_MODEL_ID, logger });
  const publishedContents = contents.filter(isPublished);
  const publishedIds = new Set(publishedContents.map(item => item.id));
  const affected = publishedContents.filter(content =>
    getRelatedIds(content[CMS_FIELD_RELATED]).includes(contentId)
  );

  for (const content of affected) {
    const remaining = getRelatedIds(content[CMS_FIELD_RELATED]).filter(id => id !== contentId);
    if (hasUnpublishedDraft(content)) {
      logger.debug(`Skipping content with unpublished draft: ${content.id}`);
      continue;
    }
    const replacements = await searchRelated({
      vectorSearch2,
      content,
      contentId: content.id,
      count: RELATED_COUNT,
      logger,
    });
    const next = [...new Set([...remaining, ...replacements.filter(id => publishedIds.has(id))])]
      .filter(id => id !== content.id && id !== contentId)
      .slice(0, RELATED_COUNT);
    await writeRelated({ contentId: content.id, relatedIds: next, logger });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, vectorSearch2, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const eventType = getEventType(data);
  if (!['cms/content/publish', 'cms/content/unpublish'].includes(eventType)) {
    logger.debug(`Skipping unsupported event: ${eventType}`);
    return;
  }

  const modelId = data?.jsonPayload?.data?.sys?.modelId || data?.jsonPayload?.data?.sys?.raw?.modelId;
  if (modelId !== TARGET_MODEL_ID) return;
  const contentId = getContentId(data);
  if (!contentId) {
    logger.warn('Hook payload does not contain a content ID');
    return;
  }

  try {
    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];
    if (!token) throw new Error(`Secret is empty: ${KARTE_APP_TOKEN_SECRET}`);
    cmsClient.auth(token);

    if (eventType === 'cms/content/unpublish') {
      await processUnpublished({ contentId, vectorSearch2, logger });
    } else {
      await processPublished({ contentId, vectorSearch2, logger });
    }
    logger.log(`Completed ${eventType} processing for ${contentId}`);
  } catch (err) {
    throwSuitableError({ err, RetryableError });
  }
}
