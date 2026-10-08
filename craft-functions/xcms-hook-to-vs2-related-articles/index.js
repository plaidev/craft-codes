import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_MODEL_ID = '<% TARGET_MODEL_ID %>';
const CMS_FIELD_TITLE = '<% CMS_FIELD_TITLE %>';
const CMS_FIELD_DESCRIPTION = '<% CMS_FIELD_DESCRIPTION %>';
const CMS_FIELD_CONTENT = '<% CMS_FIELD_CONTENT %>';
const CMS_FIELD_RELATED = '<% CMS_FIELD_RELATED %>';
const VS2_COLLECTION_ID = '<% VS2_COLLECTION_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
// VS2のデータフィールドとCMSフィールドの対応。VS2のベクタースキーマ（textTemplate）のAuto Embedding対象と一致させる。
const VS2_FIELD_MAPPING = {
  title: CMS_FIELD_TITLE,
  description: CMS_FIELD_DESCRIPTION,
  content: CMS_FIELD_CONTENT,
};
const EMBEDDING_SOURCE_FIELDS = Object.keys(VS2_FIELD_MAPPING);
const RELATED_COUNT = parseInt('<% RELATED_COUNT %>', 10) || 10;
// RetryableErrorとして再実行基盤に委ねる最大期間
const RETRY_TIMEOUT_SEC = 3600;
// 検索結果が空の場合の再試行間隔（embedding生成完了を待つ）
const SEARCH_RETRY_DELAY_MS = 2000;
const SEARCH_MAX_RETRIES = 2;
const CMS_LIST_PAGE_SIZE = 1000;
// Craft Cross CMS API仕様URIのハッシュ部分はDeveloper Portalのリファレンスページで確認する
// https://developers.karte.io/reference/post_v2beta-cms-content-get
const CMS_SPEC_URI = '@dev-karte/v1.0#7pblxhpmo2hfu7z';
const TARGET_EVENT_TYPES = ['cms/content/publish', 'cms/content/unpublish'];

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

// エラーのHTTPステータスを取り出す。モジュールにより格納先が異なるため複数の場所を見る
function getErrorStatus(err) {
  return err?.status ?? err?.statusCode ?? err?.response?.status;
}

// 5xx・408・429 は一時的なエラーとみなし、RetryableErrorで再試行に回す
function isRetryableStatus(status) {
  return Boolean(status) && ((status >= 500 && status < 600) || [408, 429].includes(status));
}

function getErrorMessage(err) {
  return err instanceof Error ? err.message : String(err ?? '');
}

// VS2は存在しないdataObjectIdに404ではなく400 Invalid dataObjectIdを返すことがある
function isVs2NotFoundError(err) {
  const status = getErrorStatus(err);
  const text = `${getErrorMessage(err)} ${JSON.stringify(err?.data ?? '')}`;
  return (
    status === 404 ||
    /not[\s_]?found/i.test(text) ||
    /Invalid dataObjectId/i.test(text)
  );
}

function derivePublishState(content) {
  const raw = content?.sys?.raw;
  if (!raw?.publishedRevisionId) return 'unpublished';
  if (raw.revisionId && raw.revisionId !== raw.publishedRevisionId) return 'published_with_draft';
  return 'published_no_draft';
}

function dedupeContentIds(ids) {
  const seen = new Set();
  return ids.filter(id => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function parseRelatedList(raw) {
  if (!Array.isArray(raw)) return [];
  return dedupeContentIds(raw.filter(id => typeof id === 'string' && id));
}

function hasRelatedFieldChanged(nextRelated, existingRelated) {
  return JSON.stringify(nextRelated) !== JSON.stringify(parseRelatedList(existingRelated));
}

async function getAuthToken(secretModule) {
  const { [KARTE_APP_TOKEN_SECRET]: token } = await secretModule.get({
    keys: [KARTE_APP_TOKEN_SECRET],
  });
  if (!token) throw new Error(`Secret "${KARTE_APP_TOKEN_SECRET}" is not set`);
  return token;
}

function createCmsClient(token) {
  const client = api(CMS_SPEC_URI);
  client.auth(token);
  return client;
}

async function fetchCmsContent(cmsClient, contentId, logger, { requirePublished = true } = {}) {
  const result = await cmsClient.postV2betaCmsContentGet({ modelId: TARGET_MODEL_ID, contentId });
  const { data: content } = result;

  if (requirePublished && !content?.sys?.raw?.publishedRevisionId) {
    logger.debug(`[skip] Content is not published, contentId: ${contentId}`);
    return null;
  }

  return content;
}

async function fetchPublishStateAndRelated(cmsClient, contentId) {
  const result = await cmsClient.postV2betaCmsContentGet({ modelId: TARGET_MODEL_ID, contentId });
  const content = result.data;
  return {
    state: derivePublishState(content),
    existingRelated: content?.[CMS_FIELD_RELATED] ?? null,
  };
}

async function updateCmsRelatedArticles(cmsClient, contentId, relatedContentIds) {
  const uniqueRelatedContentIds = dedupeContentIds(relatedContentIds);
  await cmsClient.postV2betaCmsContentPatch({
    modelId: TARGET_MODEL_ID,
    contentId,
    operations: [
      { op: 'replace', path: `/${CMS_FIELD_RELATED}`, value: uniqueRelatedContentIds },
    ],
  });
  await cmsClient.postV2betaCmsContentPublish({
    modelId: TARGET_MODEL_ID,
    contentId,
    // 関連記事更新によるpublishで再度hookが起動し無限ループするのを防ぐ
    kickHookV2: false,
  });
}

async function getVs2Object(vectorSearch2, contentId) {
  try {
    return await vectorSearch2.get({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
  } catch (e) {
    if (isVs2NotFoundError(e)) return null;
    throw e;
  }
}

function buildVs2Data(content) {
  return Object.fromEntries(
    Object.entries(VS2_FIELD_MAPPING).map(([vs2Key, cmsField]) => [vs2Key, content[cmsField] ?? ''])
  );
}

function isEmbeddingSourceChanged(oldData, newData) {
  return EMBEDDING_SOURCE_FIELDS.some(f => (oldData?.[f] ?? '') !== (newData?.[f] ?? ''));
}

// createを実行する。409時はAuto Embedding再生成のためdelete→createにフォールバックする
async function recreateVs2Object(vectorSearch2, contentId, data, logger, logContext) {
  try {
    await vectorSearch2.delete({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
  } catch (e) {
    if (!isVs2NotFoundError(e)) throw e;
  }

  try {
    await vectorSearch2.create({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId, data });
    return 'recreated';
  } catch (e) {
    logger.error(`${logContext} VS2 recreate failed after delete: ${contentId}`);
    if (e instanceof Error) e.forceRetry = true;
    throw e;
  }
}

async function createOrUpdateOnConflict(vectorSearch2, contentId, data, createdLabel, logger) {
  try {
    await vectorSearch2.create({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId, data });
    return createdLabel;
  } catch (e) {
    if (getErrorStatus(e) === 409 || /already exists/i.test(e?.message || '')) {
      const existing = await getVs2Object(vectorSearch2, contentId);
      if (existing && !isEmbeddingSourceChanged(existing.data ?? {}, data)) {
        return 'unchanged';
      }
      return recreateVs2Object(vectorSearch2, contentId, data, logger, '[@publish]');
    }
    logger.error(`[@publish] VS2 create failed: ${contentId}`);
    throw e;
  }
}

// Vector Search 2.0にデータを保存する
// updateではAuto Embeddingが再生成されないため、内容が変わった記事はcreateで再生成する
async function saveVs2Object(vectorSearch2, contentId, data, logger) {
  const existing = await getVs2Object(vectorSearch2, contentId);

  // 未登録: 新規作成。getの取りこぼしや競合で既に存在していた場合はdelete→createにフォールバックする
  if (!existing) {
    return createOrUpdateOnConflict(vectorSearch2, contentId, data, 'created', logger);
  }

  const existingData = existing.data ?? {};

  // embeddingに使うフィールドが変わった場合は、再生成のためdelete→createで作り直す
  if (isEmbeddingSourceChanged(existingData, data)) {
    return recreateVs2Object(vectorSearch2, contentId, data, logger, '[@publish]');
  }

  return 'unchanged';
}

function buildSemanticSearchQuery(title, description) {
  return `${title ?? ''} ${description ?? ''}`;
}

function parseSearchResults(results, excludeContentId, { limit } = {}) {
  const seenContentIds = new Set();
  const entries = (results || [])
    .filter(
      r =>
        r?.dataObject?.dataObjectId &&
        r.dataObject.dataObjectId !== excludeContentId &&
        Number.isFinite(r.distance)
    )
    .map(r => ({
      contentId: r.dataObject.dataObjectId,
      distance: r.distance,
    }))
    .sort((a, b) => a.distance - b.distance)
    .filter(entry => {
      if (!entry.contentId || seenContentIds.has(entry.contentId)) return false;
      seenContentIds.add(entry.contentId);
      return true;
    });

  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
}

function buildRelatedList(results, excludeContentId) {
  return parseSearchResults(results, excludeContentId, { limit: RELATED_COUNT });
}

function toRelatedContentIds(related) {
  return dedupeContentIds(related.map(item => item.contentId).filter(Boolean));
}

// 自分自身が結果に含まれる可能性があるため +1 で多めに取得する
async function searchRelatedArticlesWithRetry({ contentId, title, description }, vectorSearch2, logger) {
  for (let attempt = 0; attempt <= SEARCH_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      logger.warn(
        `[@publish] No related articles yet, retrying (${attempt}/${SEARCH_MAX_RETRIES})...`
      );
      await sleep(SEARCH_RETRY_DELAY_MS);
    }

    const searchResult = await vectorSearch2.search({
      collectionId: VS2_COLLECTION_ID,
      // 検索クエリは記事の主題を表すtitle + descriptionに絞る（contentまで含めると本文中の細かい語に引っ張られるため）
      query: { vectorField: 'embedding', text: buildSemanticSearchQuery(title, description) },
      topK: RELATED_COUNT + 1,
    });

    const related = buildRelatedList(searchResult.results || [], contentId);
    if (related.length > 0) return related;
  }

  return [];
}

async function searchRelatedEntriesFromArticle(
  { contentId, title, description },
  vectorSearch2,
  topK
) {
  const searchResult = await vectorSearch2.search({
    collectionId: VS2_COLLECTION_ID,
    query: { vectorField: 'embedding', text: buildSemanticSearchQuery(title, description) },
    topK,
  });

  return parseSearchResults(searchResult.results, contentId);
}

function sortContentIdsByDistance(contentIds, distanceMap, distanceFallbackById = new Map()) {
  return dedupeContentIds(contentIds)
    .map(id => ({
      contentId: id,
      distance: distanceMap.get(id) ?? distanceFallbackById.get(id) ?? Infinity,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, RELATED_COUNT)
    .map(entry => entry.contentId);
}

// 非公開で減った分を RELATED_COUNT まで補充し、対象記事から見た類似度順に並べ替える
async function replenishRelatedListAfterRemoval(
  articleContentId,
  filtered,
  removedContentId,
  vs2Object,
  vectorSearch2
) {
  const shortage = RELATED_COUNT - filtered.length;
  if (shortage <= 0) return filtered;

  const { title, description } = vs2Object.data ?? {};
  const excludeSet = new Set([...filtered, removedContentId]);
  const entries = await searchRelatedEntriesFromArticle(
    { contentId: articleContentId, title, description },
    vectorSearch2,
    RELATED_COUNT + filtered.length + shortage + 2
  );
  const distanceMap = new Map(entries.map(entry => [entry.contentId, entry.distance]));

  const replacementIds = entries
    .filter(entry => !excludeSet.has(entry.contentId))
    .slice(0, shortage)
    .map(entry => entry.contentId);
  if (replacementIds.length === 0) return filtered;

  return sortContentIdsByDistance([...filtered, ...replacementIds], distanceMap);
}

/**
 * 既存の関連記事リストに trigger 記事を、類似度に応じた位置で差し込む。
 * 対象記事の視点で VS2 検索した distance を優先し、未取得分は triggerDistance を使う。
 */
async function mergeRelatedListWithTrigger(
  relatedContentId,
  triggerContentId,
  triggerDistance,
  existingRelated,
  vectorSearch2,
  vs2Object
) {
  if (!Number.isFinite(triggerDistance) || !vs2Object) return null;

  const existingIds = parseRelatedList(existingRelated);
  const { title, description } = vs2Object.data ?? {};
  const entries = await searchRelatedEntriesFromArticle(
    { contentId: relatedContentId, title, description },
    vectorSearch2,
    RELATED_COUNT + existingIds.length + 2
  );
  const distanceMap = new Map(entries.map(entry => [entry.contentId, entry.distance]));

  const merged = sortContentIdsByDistance(
    [...existingIds, triggerContentId],
    distanceMap,
    new Map([[triggerContentId, triggerDistance]])
  );

  if (!merged.includes(triggerContentId)) return null;

  return merged;
}

async function refreshReverseRelatedArticle({
  triggerContentId,
  relatedContentId,
  triggerDistance,
  cmsClient,
  vectorSearch2,
  logger,
  logPrefix,
}) {
  if (!Number.isFinite(triggerDistance)) return;

  const { state, existingRelated } = await fetchPublishStateAndRelated(cmsClient, relatedContentId);

  if (state !== 'published_no_draft') {
    logger.warn(`[${logPrefix}] Skipping ${relatedContentId}: ${state}`);
    return;
  }

  const vs2Object = await getVs2Object(vectorSearch2, relatedContentId);
  if (!vs2Object) return;

  const nextRelated = await mergeRelatedListWithTrigger(
    relatedContentId,
    triggerContentId,
    triggerDistance,
    existingRelated,
    vectorSearch2,
    vs2Object
  );

  if (!nextRelated) return;

  if (!hasRelatedFieldChanged(nextRelated, existingRelated)) return;

  await updateCmsRelatedArticles(cmsClient, relatedContentId, nextRelated);
  logger.log(
    `[${logPrefix}] Updated relatedArticles for ${relatedContentId}: [${nextRelated.join(', ')}]`
  );
}

async function reverseRecalculateRelatedArticles({
  triggerContentId,
  reverseTargetIds,
  distanceByContentId,
  cmsClient,
  vectorSearch2,
  logger,
  logPrefix,
}) {
  if (reverseTargetIds.length === 0) return;

  let firstRetryableError = null;
  await Promise.all(
    reverseTargetIds.map(async relatedContentId => {
      try {
        await refreshReverseRelatedArticle({
          triggerContentId,
          relatedContentId,
          triggerDistance: distanceByContentId.get(relatedContentId),
          cmsClient,
          vectorSearch2,
          logger,
          logPrefix,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logger.warn(`[${logPrefix}] Failed to update for ${relatedContentId}: ${message}`);
        if (isRetryableStatus(getErrorStatus(e))) {
          firstRetryableError = firstRetryableError || e;
        }
      }
    })
  );
  if (firstRetryableError) throw firstRetryableError;
}

async function removeFromSingleRelatedArticle(removedContentId, article, cmsClient, vectorSearch2, logger, logPrefix) {
  const { state, existingRelated } = await fetchPublishStateAndRelated(
    cmsClient,
    article.contentId
  );

  if (state !== 'published_no_draft') {
    logger.warn(`[${logPrefix}] Skipping ${article.contentId}: ${state}`);
    return;
  }

  const existing = parseRelatedList(existingRelated);
  const filtered = existing.filter(contentId => contentId !== removedContentId);

  if (filtered.length === existing.length) return;

  let nextRelated = filtered;

  const vs2Object = await getVs2Object(vectorSearch2, article.contentId);
  if (vs2Object) {
    nextRelated = await replenishRelatedListAfterRemoval(
      article.contentId,
      filtered,
      removedContentId,
      vs2Object,
      vectorSearch2
    );
  }

  if (!hasRelatedFieldChanged(nextRelated, existingRelated)) return;

  await updateCmsRelatedArticles(cmsClient, article.contentId, nextRelated);
  logger.log(
    `[${logPrefix}] Updated relatedArticles for ${article.contentId}: [${nextRelated.join(', ')}]`
  );
}

async function reverseRemoveFromRelatedArticles(removedContentId, affectedArticles, cmsClient, vectorSearch2, logger, logPrefix) {
  let firstRetryableError = null;
  await Promise.all(
    affectedArticles.map(async article => {
      try {
        await removeFromSingleRelatedArticle(removedContentId, article, cmsClient, vectorSearch2, logger, logPrefix);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logger.warn(`[${logPrefix}] Failed to update for ${article.contentId}: ${message}`);
        if (isRetryableStatus(getErrorStatus(e))) {
          firstRetryableError = firstRetryableError || e;
        }
      }
    })
  );
  if (firstRetryableError) throw firstRetryableError;
}

// 指定記事を relatedArticles に含む記事を CMS から逆引きする
async function searchArticlesReferencingContent(contentId, cmsClient) {
  const affectedArticles = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await cmsClient.postV2betaCmsContentList({
      modelId: TARGET_MODEL_ID,
      filter: { [CMS_FIELD_RELATED]: { $in: [contentId] } },
      skip,
      limit: CMS_LIST_PAGE_SIZE,
      select: ['id'],
    });

    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];
    items.forEach(item => {
      if (item.id) affectedArticles.push({ contentId: item.id });
    });
    hasMore = items.length === CMS_LIST_PAGE_SIZE;
    skip += CMS_LIST_PAGE_SIZE;
  }

  return affectedArticles;
}

async function deleteVs2ObjectForUnpublish(vectorSearch2, contentId, logger) {
  try {
    await vectorSearch2.delete({ collectionId: VS2_COLLECTION_ID, dataObjectId: contentId });
    logger.log(`[@unpublish] VS2 deleted: ${contentId}`);
  } catch (e) {
    if (isVs2NotFoundError(e)) {
      return;
    }
    throw e;
  }
}

// 更新はpublishを伴うため、編集途中の下書きを巻き込まないよう公開済み・下書きなしのみ更新する
async function updateTriggerRelatedArticlesIfNeeded(
  { contentId, triggerState, existingRelated },
  related,
  cmsClient,
  logger
) {
  if (triggerState !== 'published_no_draft') {
    logger.warn(
      `[@publish] Skipping trigger article relatedArticles update (has draft): ${contentId}`
    );
    return;
  }

  if (!hasRelatedFieldChanged(related, existingRelated)) {
    logger.log(`[@publish] relatedArticles unchanged, skipping: ${contentId}`);
    return;
  }

  await updateCmsRelatedArticles(cmsClient, contentId, related);
  logger.log(`[@publish] Updated relatedArticles for ${contentId}: [${related.join(', ')}]`);
}

async function computeAndWriteRelatedArticles(
  { contentId, triggerState, title, description, existingRelated },
  vectorSearch2,
  cmsClient,
  logger
) {
  const related = await searchRelatedArticlesWithRetry(
    { contentId, title, description },
    vectorSearch2,
    logger
  );
  const newRelatedIds = toRelatedContentIds(related);
  const oldRelatedIds = parseRelatedList(existingRelated);
  const shouldUpdateRelated = related.length > 0 || oldRelatedIds.length === 0;

  if (!shouldUpdateRelated) {
    logger.warn(
      `[@publish] No related articles found after retries, keeping existing relatedArticles: ${contentId}`
    );
    return;
  }

  if (triggerState !== 'published_no_draft') {
    logger.warn(`[@publish] Skipping relatedArticles updates (has draft): ${contentId}`);
    return;
  }

  const distanceByContentId = new Map(related.map(entry => [entry.contentId, entry.distance]));
  const newRelatedIdSet = new Set(newRelatedIds);
  const removedReverseIds = oldRelatedIds.filter(id => !newRelatedIdSet.has(id));

  if (removedReverseIds.length > 0) {
    await reverseRemoveFromRelatedArticles(
      contentId,
      removedReverseIds.map(id => ({ contentId: id })),
      cmsClient,
      vectorSearch2,
      logger,
      '@reverse-remove'
    );
  }

  await updateTriggerRelatedArticlesIfNeeded(
    { contentId, triggerState, existingRelated },
    newRelatedIds,
    cmsClient,
    logger
  );

  await reverseRecalculateRelatedArticles({
    triggerContentId: contentId,
    reverseTargetIds: newRelatedIds,
    distanceByContentId,
    cmsClient,
    vectorSearch2,
    logger,
    logPrefix: '@reverse',
  });
}

async function handlePublish(contentId, cmsClient, vectorSearch2, logger) {
  const content = await fetchCmsContent(cmsClient, contentId, logger);
  if (!content) return;

  const triggerState = derivePublishState(content);
  const vs2Data = buildVs2Data(content);

  const vs2Action = await saveVs2Object(vectorSearch2, contentId, vs2Data, logger);
  logger.log(`[@publish] VS2 ${vs2Action}: ${contentId}`);

  await computeAndWriteRelatedArticles(
    {
      contentId,
      triggerState,
      title: vs2Data.title,
      description: vs2Data.description,
      existingRelated: content[CMS_FIELD_RELATED] ?? null,
    },
    vectorSearch2,
    cmsClient,
    logger
  );
}

async function handleUnpublish(contentId, cmsClient, vectorSearch2, logger) {
  const affectedArticles = await searchArticlesReferencingContent(contentId, cmsClient);

  await deleteVs2ObjectForUnpublish(vectorSearch2, contentId, logger);

  await reverseRemoveFromRelatedArticles(
    contentId,
    affectedArticles,
    cmsClient,
    vectorSearch2,
    logger,
    '@unpublish-reverse'
  );

  logger.log(`[@unpublish] completed: ${contentId}`);
}

function handleError(err, logger, RetryableError) {
  const status = getErrorStatus(err);
  const message = err instanceof Error ? err.message : String(err);
  const errData = err?.data;
  logger.error(`[error] status=${status} ${message}`, errData ? JSON.stringify(errData) : '');
  // forceRetry（delete後のcreate失敗）もRetryableErrorへ変換。恒久エラーはRETRY_TIMEOUT_SECで打ち切り
  if (err?.forceRetry || isRetryableStatus(status)) {
    throw new RetryableError(`[retry] ${message}`, RETRY_TIMEOUT_SEC);
  }
  throw err;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, vectorSearch2, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const eventType = data.jsonPayload.event_type;
  if (!TARGET_EVENT_TYPES.includes(eventType)) {
    logger.debug(`[skip] not a target event type: ${eventType}`);
    return;
  }

  const { modelId } = data.jsonPayload.data.sys;
  if (modelId !== TARGET_MODEL_ID) {
    logger.debug(`[skip] modelId mismatch: ${modelId}`);
    return;
  }

  const { id: contentId } = data.jsonPayload.data;

  try {
    const token = await getAuthToken(secret);
    const cmsClient = createCmsClient(token);

    if (eventType === 'cms/content/unpublish') {
      await handleUnpublish(contentId, cmsClient, vectorSearch2, logger);
      return;
    }

    await handlePublish(contentId, cmsClient, vectorSearch2, logger);
  } catch (err) {
    handleError(err, logger, RetryableError);
  }
}
