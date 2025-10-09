import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_MODEL_ID = '<% TARGET_MODEL_ID %>';
const RAG_CORPUS_ID = '<% RAG_CORPUS_ID %>';
const SITE_NAME = '<% SITE_NAME %>';
const SITE_DIR_PATH = '<% SITE_DIR_PATH %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CMS_CONTENT_FIELDS = '<% CMS_CONTENT_FIELDS %>';
const RETRY_TIMEOUT_SEC = 3600;
const CMS_SPEC_URI = '@dev-karte/v1.0#1g9n3z10mdh7d91y';
const CRAFT_SPEC_URI = '@dev-karte/v1.0#l10f37mfxgrjj4';

function isTargetEventType(eventType) {
  const targetEventTypes = [
    'cms/content/publish',
    'cms/content/unpublish', // 公開中のコンテンツは削除できないので、unpublishがあればdeleteは不要
  ];

  return targetEventTypes.includes(eventType);
}

function normalizeDirPath(dirPath) {
  // パスの末尾にスラッシュがない場合は追加
  return dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
}

function generateContentPath(contentId) {
  const normalizedDirPath = normalizeDirPath(SITE_DIR_PATH);
  return `${normalizedDirPath}${contentId}.md`;
}

function parseCmsContentToMarkdown(content) {
  const fieldNames = CMS_CONTENT_FIELDS.split(',').map(field => field.trim());
  const markdown = fieldNames
    .map(fieldName => {
      const fieldData = content[fieldName];

      // フィールドデータがオブジェクトの場合は.htmlプロパティを、それ以外の場合は直接値を取得
      const fieldValue =
        fieldData && typeof fieldData === 'object' ? fieldData?.html || '' : fieldData || '';

      return `# ${fieldName}\n${fieldValue}`;
    })
    .join('\n\n');

  return markdown;
}

function throwSuitableError({ msg, status, RetryableError, retryTimeoutSec }) {
  const isRetryable = status && ((status >= 500 && status < 600) || [408, 429].includes(status));

  if (isRetryable) {
    throw new RetryableError(`[retry] ${msg}`, retryTimeoutSec);
  }
  throw new Error(msg);
}

async function getAuthToken(secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  return secrets[KARTE_APP_TOKEN_SECRET];
}

async function fetchCmsContent(token, modelId, contentId, logger, shortEventType) {
  try {
    const cms = api(CMS_SPEC_URI);
    cms.auth(token);

    const result = await cms.postV2betaCmsContentGet({ modelId, contentId });

    const { data: content } = result;

    // 公開状態でない場合はnullを返す
    const publishedRevisionId = content?.sys?.raw?.publishedRevisionId;
    if (!publishedRevisionId) {
      logger.debug(`[skip] Content is not published, contentId: ${contentId}`);
      return null;
    }

    return content;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to fetch CMS content for contentId: ${contentId}. error: ${msg}`;
    throw err;
  }
}

async function uploadContentToSites(token, content, contentId, logger, shortEventType) {
  try {
    const craft = api(CRAFT_SPEC_URI);
    craft.auth(token);

    // Markdownコンテンツを生成
    const markdownContent = parseCmsContentToMarkdown(content);
    const base64Content = Buffer.from(markdownContent).toString('base64');
    const path = generateContentPath(contentId);

    await craft.postV2betaCraftSitesContentUpload({
      kickHookV2: false,
      siteName: SITE_NAME,
      path,
      content: base64Content,
    });

    logger.debug(
      `[@${shortEventType}] Content uploaded to Craft Sites: ${path}, contentId: ${contentId}`
    );
    return path;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to upload content to Craft Sites for contentId: ${contentId}. error: ${msg}`;
    throw err;
  }
}

async function deleteContentFromSites(token, contentId, logger, shortEventType) {
  try {
    const craft = api(CRAFT_SPEC_URI);
    craft.auth(token);

    const path = generateContentPath(contentId);

    await craft.postV2betaCraftSitesContentFileRemove({
      kickHookV2: false,
      path,
      siteName: SITE_NAME,
    });

    logger.debug(
      `[@${shortEventType}] Content deleted from Craft Sites: ${path}, contentId: ${contentId}`
    );
    return path;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to delete content from Craft Sites for contentId: ${contentId}. error: ${msg}`;
    if (err.status === 404) {
      const path = generateContentPath(contentId);
      logger.warn(`${err.message}`);
      return path;
    }

    throw err;
  }
}

async function importToRag(token, path, contentId, logger, shortEventType) {
  try {
    const craft = api(CRAFT_SPEC_URI);
    craft.auth(token);

    const { data: ragResult } = await craft.postV2betaCraftRagImportbyfile({
      siteName: SITE_NAME,
      path,
      corpusId: RAG_CORPUS_ID,
    });

    logger.debug(
      `[@${shortEventType}] Content imported to RAG successfully, contentId: ${contentId}, path: ${path}`
    );
    return ragResult;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to import content to RAG for contentId: ${contentId}. error: ${msg}`;
    throw err;
  }
}

async function deleteFromRag(token, contentId, logger, shortEventType) {
  try {
    const craft = api(CRAFT_SPEC_URI);
    craft.auth(token);

    const path = generateContentPath(contentId);

    // pathからRAGファイルを取得
    const { data: fileResult } = await craft.postV2betaCraftRagGetfilebypath({
      corpusId: RAG_CORPUS_ID,
      path,
      siteName: SITE_NAME,
    });

    if (!fileResult?.ragFile?.id) {
      logger.warn(
        `[@${shortEventType}] RAG file not found for path: ${path}, contentId: ${contentId}`
      );
      return;
    }

    // ファイルIDを取得してRAGから削除
    const ragFileId = fileResult.ragFile.id;
    await craft.postV2betaCraftRagDeletefiles({
      fileIds: [ragFileId],
      corpusId: RAG_CORPUS_ID,
    });

    logger.debug(
      `[@${shortEventType}] Content deleted from RAG successfully, contentId: ${contentId}, path: ${path}, ragFileId: ${ragFileId}`
    );
    return ragFileId;
  } catch (err) {
    const msg = err.message || 'Unknown error';
    err.message = `[@${shortEventType}] Failed to delete content from RAG for contentId: ${contentId}. error: ${msg}`;
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
    return;
  }

  const { id: contentId } = data.jsonPayload.data;

  try {
    const token = await getAuthToken(secret);

    if (eventType === 'cms/content/unpublish') {
      // unpublishの場合はファイル削除とRAGからの削除を行う
      await deleteContentFromSites(token, contentId, logger, shortEventType);
      await deleteFromRag(token, contentId, logger, shortEventType);
      logger.log(
        `[@${shortEventType}] Content deletion completed successfully, contentId: ${contentId}`
      );
      return;
    }

    // publish等の場合は通常の同期処理
    const content = await fetchCmsContent(token, modelId, contentId, logger, shortEventType);

    // コンテンツが公開状態でない場合は処理をスキップ
    if (!content) {
      return;
    }

    const path = await uploadContentToSites(token, content, contentId, logger, shortEventType);
    await importToRag(token, path, contentId, logger, shortEventType);

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
