import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_APP_SPEC_URI_CMS = '@dev-karte/v1.0#n0jmhx43zga';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const TARGET_CMS_MODEL_TITLE = '<% TARGET_CMS_MODEL_TITLE %>';
const TARGET_CMS_MODEL_BODY = '<% TARGET_CMS_MODEL_BODY %>';
const UPDATE_CMS_MODEL_FIELD = '<% UPDATE_CMS_MODEL_FIELD %>';
const TARGET_EVENT_TYPES = ['cms/content/create', 'cms/content/update'];

const PROMPTS = {
  template: (title, body) => `以下の記事を150文字以内で要約してください。

# 記事タイトル
${title}

# 記事本文
${body}

# 出力ルール
- 150文字以内で出力
- 要約のみ出力(前置き不要)
- 記事の要点を簡潔にまとめる`,
  /*
  template: (
    title,
    body
  ) => `以下の記事を読んで、「こんな人におすすめ！」という文章を3つ、箇条書きで生成してください。

# 記事タイトル
${title}

# 記事本文
${body}

# 出力ルール
- 以下のフォーマットで出力
- おすすめポイント1: 
- おすすめポイント2: 
- おすすめポイント3: 
`,
  */
};

async function getToken(secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  return secrets[KARTE_APP_TOKEN_SECRET];
}

async function fetchByContentId(token, contentId) {
  const client = api(KARTE_APP_SPEC_URI_CMS);
  client.auth(token);
  const response = await client.postV2betaCmsContentGet({
    modelId: CMS_MODEL_ID,
    contentId,
  });
  return response.data;
}

async function updateTargetField(token, contentId, targetKey, targetFieldValue) {
  const client = api(KARTE_APP_SPEC_URI_CMS);
  client.auth(token);
  const currentContent = await fetchByContentId(token, contentId);

  await client.postV2betaCmsContentUpdate({
    modelId: CMS_MODEL_ID,
    contentId,
    data: {
      ...currentContent,
      [targetKey]: targetFieldValue,
    },
    kickHookV2: false,
  });
}

async function generateData(aiModules, logger, title, content) {
  try {
    const res = await aiModules.gcpGeminiGenerateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: PROMPTS.template(title, content) }],
        },
      ],
    });

    return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    logger.error(`Failed to generate AI content: ${error.message}`);
    return '';
  }
}

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

function isTargetEventType(eventType) {
  return !!eventType && TARGET_EVENT_TYPES.includes(eventType);
}

/**
 * 文字列が空かどうかを判定する
 *
 * @param {string | null | undefined} data - 判定対象の文字列
 * @returns {boolean} 空の場合は true
 *
 * @remarks
 * 以下のケースを空として判定:
 * - null / undefined
 * - 空文字
 * - 半角スペースのみ
 * - 全角スペースのみ
 * - タブのみ
 * - 改行のみ
 * - フォームフィード
 * - 垂直タブ
 * - 上記の混在
 */
function isEmpty(data, logger) {
  logger.debug(`Checking if data is empty: ${data}`);
  return !data || !/[^\s\u3000]/.test(data);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const eventType = data.jsonPayload?.event_type;
  if (!isTargetEventType(eventType)) {
    return { success: true, skipped: true, reason: 'event_type' };
  }

  try {
    const contentId = data.jsonPayload?.data?.id;
    const token = await getToken(secret);
    const content = await fetchByContentId(token, contentId);

    const title = getTextFieldValue(content, TARGET_CMS_MODEL_TITLE);
    const body = getTextFieldValue(content, TARGET_CMS_MODEL_BODY);
    if (isEmpty(body, logger)) {
      await updateTargetField(token, contentId, UPDATE_CMS_MODEL_FIELD, '');
      return { success: true, skipped: true, reason: 'no_body' };
    }

    const generatedData = await generateData(aiModules, logger, title, body);
    await updateTargetField(token, contentId, UPDATE_CMS_MODEL_FIELD, generatedData);

    logger.log('Success: ', { contentId });
    return { success: true, contentId };
  } catch (error) {
    logger.error(`Failed to process content: ${error.message}`);
    return { success: false, error: error.message };
  }
}
