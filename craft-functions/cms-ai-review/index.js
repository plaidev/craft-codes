import { WebClient } from '@slack/web-api';
import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const REVIEW_TARGET_FIELDS = '<% REVIEW_TARGET_FIELDS %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const CMS_COLLECTION_ID = '<% CMS_COLLECTION_ID %>';
const CUSTOM_REVIEW_CRITERIA = '<% CUSTOM_REVIEW_CRITERIA %>';

const COMMENT_FIELD = 'ai_review_comment';
const AI_REVIEW_ENABLED_FIELD = 'ai_review_enabled';
const CMS_SPEC_URI = '@dev-karte/v1.0#1j4ack84mknxqr0g';
const TARGET_EVENT_TYPES = ['cms/content/create', 'cms/content/update'];

// AIの役割や振る舞いを変えたい場合は、こちらを編集してください
const SYSTEM_INSTRUCTION = `あなたはプロフェッショナルな日本語コンテンツレビュアーです。
コンテンツの修正は行わず、レビューコメントのみを日本語で提供してください。
指摘は具体的かつ実用的に、該当箇所のテキストを引用して行ってください。
問題がない観点については、その旨を簡潔に記載してください。`;

// レビュー観点を変えたい場合は、こちらを編集してください（変数 CUSTOM_REVIEW_CRITERIA でも上書き可能）
const DEFAULT_REVIEW_CRITERIA = `1. 文章品質: 誤字脱字、文法ミス、表記揺れ、読みやすさ
2. SEO: タイトル長（30〜60文字推奨）、見出し構造、キーワード密度
3. コンテンツポリシー: 禁止表現、ブランドガイドライン、法的リスク表現`;

function validateRequiredVars(vars) {
  return Object.entries(vars).filter(([, value]) => !value).map(([key]) => key);
}

function getHttpStatus(error) {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return undefined;
}

function getTextFieldValue(content, field) {
  const contentData = content[field];
  if (typeof contentData === 'string') {
    return contentData;
  }
  // CMS のリッチテキストフィールドは { text: string, ... } 形式で返るため分岐が必要
  if (typeof contentData === 'object' && contentData !== null && 'text' in contentData) {
    const text = contentData.text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function isTargetEvent(data) {
  if (data.kind !== 'karte/apiv2-hook') return false;
  const eventType = data.jsonPayload?.event_type;
  return typeof eventType === 'string' && TARGET_EVENT_TYPES.includes(eventType);
}

function parseCmsPayload(data) {
  if (!data.jsonPayload) return null;
  const payload = data.jsonPayload;
  const contentId = payload.data?.id;
  const modelId = payload.data?.sys?.modelId;
  if (typeof contentId !== 'string' || typeof modelId !== 'string') {
    return null;
  }
  return payload;
}

function isAiReviewEnabled(content, fieldName) {
  return content[fieldName] === true;
}

// publishedRevisionId が存在する場合は公開済みとする（CMS API の仕様）
function isPublished(payload) {
  return !!payload.data.sys.raw?.publishedRevisionId;
}

// レビュー結果の出力項目を増減したい場合は、プロパティを追加・削除してください
function buildReviewSchema() {
  return {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        enum: ['OK', 'NG'],
        description: 'Review result',
      },
      writing_quality: {
        type: 'string',
        description: 'Comments on writing quality',
      },
      seo: { type: 'string', description: 'Comments on SEO' },
      content_policy: {
        type: 'string',
        description: 'Comments on content policy',
      },
      summary: {
        type: 'string',
        description: 'Overall summary (1-2 sentences)',
      },
    },
    required: ['result', 'writing_quality', 'seo', 'content_policy', 'summary'],
  };
}

function parseFieldList(fieldList) {
  return fieldList.split(',').map((f) => f.trim()).filter((f) => f.length > 0);
}

function buildReviewPrompt(fields, customCriteria) {
  const criteria = customCriteria?.trim() ? customCriteria : DEFAULT_REVIEW_CRITERIA;
  const contentSection = Object.entries(fields).map(([key, value]) => `# ${key}
${value}`).join('\n\n');
  return `以下の記事をレビューしてください。

${contentSection}

# レビュー観点
${criteria}

# 出力ルール
- 各観点について具体的な指摘を行ってください
- 問題がない観点はその旨を簡潔に記載してください
- 全体として問題がなければ result を "OK"、問題があれば "NG" としてください`;
}

// CMS に書き戻すレビュー結果の表示形式を変えたい場合は、こちらを編集してください
function formatReviewComment(review, reviewedAt = new Date()) {
  const jst = new Date(reviewedAt.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jst.getUTCDate()).padStart(2, '0');
  const hours = String(jst.getUTCHours()).padStart(2, '0');
  const minutes = String(jst.getUTCMinutes()).padStart(2, '0');
  const timestamp = `${year}/${month}/${day} ${hours}:${minutes}`;
  return `【結果】${review.result}
【文章品質】${review.writing_quality}
【SEO】${review.seo}
【コンテンツポリシー】${review.content_policy}
（総合）${review.summary}
（レビュー日時）${timestamp}`;
}

function buildCmsAdminUrl(cmsCollectionId, cmsModelId, contentId, karteProjectId) {
  return `https://admin.karte.io/cms/${cmsCollectionId}/models/${cmsModelId}/contents/${contentId}/edit?project=${karteProjectId}`;
}

// レビュー結果と公開状態の組み合わせで Slack 通知する・しないを変えたい場合は、こちらを編集してください
function shouldNotifySlack(result, published) {
  // 公開済みかつ問題なしの場合は通知不要（ノイズ削減）
  return !(result === 'OK' && published);
}

// Slack 通知のヘッダー文言を変えたい場合は、こちらを編集してください
function getSlackHeader(result, published) {
  if (result === 'OK' && !published) {
    return 'CMS AI レビュー: 問題ありません。公開可能です';
  }
  if (result === 'NG' && !published) {
    return 'CMS AI レビュー: 指摘事項があります。公開前に確認してください';
  }
  return 'CMS AI レビュー: 公開中の記事に指摘があります。早急に確認してください';
}

function buildSlackMessage(params) {
  const {
    result,
    isPublished: published,
    contentId,
    cmsCollectionId,
    cmsModelId,
    karteProjectId,
    reviewComment,
  } = params;
  const url = buildCmsAdminUrl(
    cmsCollectionId,
    cmsModelId,
    contentId,
    karteProjectId,
  );
  const header = getSlackHeader(result, published);
  return `${header}

コンテンツID: ${contentId}
${reviewComment}

${url}`;
}

function buildSlackErrorMessage(params) {
  const { contentId, cmsCollectionId, cmsModelId, karteProjectId, error } = params;
  const url = buildCmsAdminUrl(
    cmsCollectionId,
    cmsModelId,
    contentId,
    karteProjectId,
  );
  return `CMS AI レビュー失敗: 手動で確認してください

コンテンツID: ${contentId}
エラー: ${error.message}

${url}`;
}

async function getTokens(secret) {
  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, SLACK_TOKEN_SECRET],
  });
  return {
    karteToken: secrets[KARTE_APP_TOKEN_SECRET],
    slackToken: secrets[SLACK_TOKEN_SECRET],
  };
}

function createCmsClient(token) {
  const client = api(CMS_SPEC_URI);
  client.auth(token);
  return client;
}

async function fetchByContentId(cmsClient, modelId, contentId) {
  const response = await cmsClient.postV2betaCmsContentGet({
    modelId,
    contentId,
  });
  return response.data;
}

async function patchReviewComment(cmsClient, modelId, contentId, comment) {
  await cmsClient.postV2betaCmsContentPatch({
    modelId,
    contentId,
    // レビュー結果書き戻し後にこの Function が再実行されないよう防止
    kickHookV2: false,
    operations: [
      {
        op: 'replace',
        path: `/${COMMENT_FIELD}`,
        value: comment,
      },
    ],
  });
}

async function generateReview(aiModules, fields) {
  const response = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: [
      {
        role: 'user',
        parts: [{ text: buildReviewPrompt(fields, CUSTOM_REVIEW_CRITERIA) }],
      },
    ],
    // AI出力の安定性や長さを調整したい場合は、こちらを編集してください
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildReviewSchema(),
      // レビュー結果の一貫性を高めるため低めに設定。多様な指摘を得たい場合は値を上げてください
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });
  const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini からレスポンステキストが返されませんでした');
  }
  return JSON.parse(rawText);
}

async function sendSlackNotification(slackToken, message) {
  const client = new WebClient(slackToken);
  await client.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: message,
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const missingVars = validateRequiredVars({
    KARTE_APP_TOKEN_SECRET,
    REVIEW_TARGET_FIELDS,
    SLACK_TOKEN_SECRET,
    SLACK_CHANNEL_ID,
    KARTE_PROJECT_ID,
    CMS_COLLECTION_ID,
  });
  if (missingVars.length > 0) {
    logger.error(`以下の変数が設定されていません: ${missingVars.join(', ')}`);
    return {
      success: false,
      error: `missing_variables: ${missingVars.join(', ')}`,
    };
  }

  if (!isTargetEvent(data)) {
    return { success: true, skipped: true, reason: 'event_type' };
  }

  const cmsPayload = parseCmsPayload(data);
  if (!cmsPayload) {
    logger.warn(
      'CMS ペイロードの解析に失敗しました（contentId または modelId が不足）',
    );
    return { success: true, skipped: true, reason: 'invalid_payload' };
  }
  const {
    id: contentId,
    sys: { modelId },
  } = cmsPayload.data;

  // この時点では slackToken が未取得のため Slack 通知が不可能
  const tokens = await getTokens(secret).catch((e) => {
    logger.error(`トークンの取得に失敗しました: ${e}`);
    return null;
  });
  if (!tokens) {
    return { success: false, error: 'トークンの取得に失敗しました' };
  }
  const { karteToken, slackToken } = tokens;
  const cmsClient = createCmsClient(karteToken);

  try {
    const content = await fetchByContentId(cmsClient, modelId, contentId);

    if (!isAiReviewEnabled(content, AI_REVIEW_ENABLED_FIELD)) {
      logger.log(
        `AIレビューが無効のためスキップします: contentId=${contentId}`,
      );
      return { success: true, skipped: true, reason: 'ai_review_disabled' };
    }

    const fieldNames = parseFieldList(REVIEW_TARGET_FIELDS);
    const reviewFields = {};
    fieldNames.forEach((name) => {
      reviewFields[name] = getTextFieldValue(content, name);
    });

    const totalLength = Object.values(reviewFields).reduce(
      (sum, v) => sum + v.length,
      0,
    );
    if (totalLength === 0) {
      logger.log(
        `レビュー対象フィールドがすべて空のためスキップします: contentId=${contentId}`,
      );
      return { success: true, skipped: true, reason: 'content_empty' };
    }

    // Slack通知の緊急度を分岐するために公開状態を確認
    const published = isPublished(cmsPayload);

    const review = await generateReview(aiModules, reviewFields);
    const reviewComment = formatReviewComment(review);

    // CMS管理画面上でレビュー結果を即座に確認できるようにフィールドへ書き戻す
    await patchReviewComment(cmsClient, modelId, contentId, reviewComment);

    if (shouldNotifySlack(review.result, published)) {
      const slackMessage = buildSlackMessage({
        result: review.result,
        isPublished: published,
        contentId,
        cmsCollectionId: CMS_COLLECTION_ID,
        cmsModelId: modelId,
        karteProjectId: KARTE_PROJECT_ID,
        reviewComment,
      });
      await sendSlackNotification(slackToken, slackMessage);
    }

    logger.log(`レビュー完了: contentId=${contentId}, result=${review.result}`);
    return { success: true, contentId, result: review.result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const status = getHttpStatus(error);

    if (status === 404) {
      logger.warn(
        `コンテンツが見つかりません（削除済みの可能性があります）: contentId=${contentId}`,
      );
      return { success: true, skipped: true, reason: 'content_not_found' };
    }

    logger.error(
      `コンテンツの処理に失敗しました: contentId=${contentId}, error=${err.message}`,
    );

    try {
      const errorMessage = buildSlackErrorMessage({
        contentId,
        cmsCollectionId: CMS_COLLECTION_ID,
        cmsModelId: modelId,
        karteProjectId: KARTE_PROJECT_ID,
        error: err,
      });
      await sendSlackNotification(slackToken, errorMessage);
    } catch (slackError) {
      logger.error(`Slack エラー通知の送信に失敗しました: ${slackError}`);
    }

    return { success: false, error: err.message };
  }
}
