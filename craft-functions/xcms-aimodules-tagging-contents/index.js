import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CONTENT_CMS_MODEL_ID = '<% CONTENT_CMS_MODEL_ID %>';
const TAG_CMS_MODEL_ID = '<% TAG_CMS_MODEL_ID %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const SYSTEM_INSTRUCTION = '<% SYSTEM_INSTRUCTION %>';
const TAG_FIELD_ID = '<% TAG_FIELD_ID %>';
const TAG_NAME_FIELD_ID = '<% TAG_NAME_FIELD_ID %>';
const ARTICLE_TITLE_FIELD_ID = '<% ARTICLE_TITLE_FIELD_ID %>';
const ARTICLE_BODY_FIELD_ID = '<% ARTICLE_BODY_FIELD_ID %>';

/**
 * フィールドの型（テキスト/リッチテキスト）に関わらず文字列を取得する
 */
function getTextFieldValue(content, field) {
  const contentData = content[field];

  if (typeof contentData === 'string') {
    return contentData;
  }

  if (typeof contentData === 'object' && contentData !== null) {
    return contentData.text || '';
  }

  return '';
}

/**
 * CMSからコンテンツ詳細を取得
 */
async function fetchCmsContent({ modelId, contentId, token, logger }) {
  const cmsClient = api('@dev-karte/v1.0#1j4ack84mknxqr0g');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentGet({ modelId, contentId });
    return contentResponse.data;
  } catch (error) {
    logger.error(`[CMS Error] Failed to fetch content (${contentId}): ${error.message}`);
    throw error;
  }
}

/**
 * CMSからコンテンツ一覧を取得
 */
async function fetchCmsContentList({ modelId, token, logger }) {
  const cmsClient = api('@dev-karte/v1.0#1j4ack84mknxqr0g');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentList({
      order: ['-sys.raw.updatedAt'],
      skip: 0,
      limit: 1000,
      modelId,
    });
    return contentResponse.data;
  } catch (error) {
    logger.error(`[CMS Error] Failed to fetch content list: ${error.message}`);
    throw error;
  }
}

/**
 * AIを使用して最適なタグIDを選定する
 */
async function analyzeBestTags({ article, tagOptions, aiModules, logger }) {
  const title = getTextFieldValue(article, ARTICLE_TITLE_FIELD_ID);
  const body = getTextFieldValue(article, ARTICLE_BODY_FIELD_ID);

  const userQuery = `
【記事タイトル】: ${title}
【記事本文】: ${(body || '').substring(0, 3000)}

【タグリスト】:
${tagOptions.map(t => `ID: ${t.id}, 名称: ${t.name}`).join('\n')}
`;

  const response = await aiModules.gcpGeminiGenerateContent({
    contents: [{ role: 'user', parts: [{ text: userQuery }] }],
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          selected_tag_ids: {
            type: 'array',
            items: { type: 'string' },
            description: '記事に関連性の高いタグIDの配列（最低1つ、最大3つ）',
          },
        },
        required: ['selected_tag_ids'],
      },
      maxOutputTokens: 8192,
      temperature: 0.2,
    },
  });

  const rawResponse = response.candidates[0].content.parts[0].text;
  const jsonResponse = JSON.parse(rawResponse);
  const selectedTagIds = jsonResponse.selected_tag_ids.join(',');

  logger.log(`Selected Tag IDs: ${selectedTagIds}`);

  return selectedTagIds;
}

/**
 * CMSのコンテンツを部分更新
 */
async function patchCmsContent({ modelId, contentId, tagFieldId, tagIds, token, logger }) {
  const cmsClient = api('@dev-karte/v1.0#1j4ack84mknxqr0g');
  try {
    cmsClient.auth(token);

    const payload = {
      modelId,
      contentId,
      kickHookV2: false,
      operations: [
        {
          op: 'replace',
          path: `/${tagFieldId}`,
          value: tagIds,
        },
      ],
    };

    const response = await cmsClient.postV2betaCmsContentPatch(payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      logger.error(`[PATCH Error Detail] ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') return logger.warn('invalid trigger');

  const contentId = data.jsonPayload.data?.sys?.raw?.contentId || data.jsonPayload.data?.id;
  if (!contentId) return logger.warn('No contentId found');

  try {
    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];

    const [article, tagListResponse] = await Promise.all([
      fetchCmsContent({ modelId: CONTENT_CMS_MODEL_ID, contentId, token, logger }),
      fetchCmsContentList({ modelId: TAG_CMS_MODEL_ID, token, logger }),
    ]);

    if (article[TAG_FIELD_ID] && article[TAG_FIELD_ID].length > 0) {
      logger.log(`Content ${contentId} already has tags. Skipping AI analysis.`);
      return;
    }

    const bodyText = getTextFieldValue(article, ARTICLE_BODY_FIELD_ID);
    if (bodyText.length < 100) {
      logger.log(`Content body is too short (${bodyText.length} chars). Waiting for more content.`);
      return;
    }

    const titleText = getTextFieldValue(article, ARTICLE_TITLE_FIELD_ID);
    if (!titleText) throw new Error('Article title is missing');

    const validTags = (tagListResponse.items || []).filter(t => t[TAG_NAME_FIELD_ID]);
    const tagOptions = validTags.map(t => ({ id: t.id, name: t[TAG_NAME_FIELD_ID] }));

    const selectedTagIds = await analyzeBestTags({ article, tagOptions, aiModules, logger });

    if (!selectedTagIds) return logger.log('No tags selected by AI');

    const selectedNames = validTags
      .filter(t => selectedTagIds.split(',').includes(t.id))
      .map(t => t[TAG_NAME_FIELD_ID]);
    logger.log(`Selected Tags: ${selectedNames.join(', ')} (IDs: ${selectedTagIds})`);

    const tagIdArray = selectedTagIds.split(',').map(id => id.trim());

    await patchCmsContent({
      modelId: CONTENT_CMS_MODEL_ID,
      contentId,
      tagFieldId: TAG_FIELD_ID,
      tagIds: tagIdArray,
      token,
      logger,
    });

    logger.log('Successfully updated tags!');
  } catch (err) {
    logger.error(`Main process error: ${err.message}`);
  }
}
