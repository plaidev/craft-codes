import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KICKFLOW_ACCESSTOKEN_SECRET = '<% KICKFLOW_ACCESSTOKEN_SECRET %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const CMS_COLLECTION_ID = '<% CMS_COLLECTION_ID %>';
const APPROVAL_FLAG_KEY = '<% APPROVAL_FLAG_KEY %>';
const KICKFLOW_WORKFLOW_ID = '<% KICKFLOW_WORKFLOW_ID %>';
const KICKFLOW_AUTHOR_TEAM_ID = '<% KICKFLOW_AUTHOR_TEAM_ID %>';
const KICKFLOW_API_URL = 'https://api.kickflow.com/v1/tickets';

async function fetchCmsContent(modelId, contentId, token, logger) {
  // KARTEのAPIクライアントを初期化
  const cmsClient = api('@dev-karte/v1.0#n0jmhx43zga');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentGet({
      modelId,
      contentId,
    });
    return contentResponse.data;
  } catch (error) {
    logger.error(`Error in fetchCmsContent: ${error.message}`);
  }
}

function buildContentUrl(contentId) {
  return `https://admin.karte.io/cms/${CMS_COLLECTION_ID}/models/${CMS_MODEL_ID}/contents/${contentId}/edit?project=${KARTE_PROJECT_ID}`;
}

/**
 * Kickflow APIへのリクエストボディのinputs配列を構築する関数
 */
function buildKickflowInputs(contentUrl, contentId) {
  // 計算フィールドや空値が必要な場合の定数
  const EMPTY_VALUE = '';

  return [
    // 1. テキスト / 日付 / 数値を入力する形式の場合はこちらを使用してください
    // 今回は例としてCMSのcontentUrlをセットしています
    { formFieldCode: '000000', value: contentUrl }, // 実際のフォームフィールドコードとバリューに書き換えてください

    // 2. 後でkickflowでの承認時に該当のコンテンツを公開するためにコンテンツIDを渡しています
    { formFieldCode: '000000', value: contentId }, // 実際のフォームフィールドコードとバリューに書き換えてください

    // 3. 汎用マスタ (generalMasterItemId を使用)から選ぶ形式の場合はこちらを使用してください
    { formFieldCode: '000000', generalMasterItemId: 'aaaaaaaa-1111-bbbb-2222-cccccccccccc' }, // 実際のフォームフィールドコードとアイテムUUIDに書き換えてください

    // 4. ユーザー選択 (userId を使用)する形式の場合はこちらを使用してください
    { formFieldCode: '000000', userId: 'aaaaaaaa-1111-bbbb-2222-cccccccccccc' }, // 実際のフォームフィールドコードとユーザーUUIDに書き換えてください

    // 5. チーム選択 (teamId を使用)する形式の場合はこちらを使用してください
    { formFieldCode: '000000', teamId: 'aaaaaaaa-1111-bbbb-2222-cccccccccccc' }, // 実際のフォームフィールドコードとチームUUIDに書き換えてください

    // 6. チケット参照 (ticketId を使用)する形式の場合はこちらを使用してください
    { formFieldCode: '000000', ticketId: 'aaaaaaaa-1111-bbbb-2222-cccccccccccc' }, // 実際のフォームフィールドコードとチケットUUIDに書き換えてください

    // 7. ファイル添付 (files を使用)する形式の場合はこちらを使用してください
    { formFieldCode: '000000', files: [] }, // 事前にファイルのアップロード用APIを実行し、署名済みIDの配列を入力してください

    // 8. 自動入力されるフィールドの場合はこちらを使用してください
    { formFieldCode: '000000', value: EMPTY_VALUE }, // チケット作成APIを利用する際は、自動入力フィールドもリクエストボディに含める必要があります
  ];
}

async function executeKickflowApi(ticketTitle, inputs, token, logger) {
  const requestBody = {
    status: 'in_progress',
    workflowId: KICKFLOW_WORKFLOW_ID,
    authorTeamId: KICKFLOW_AUTHOR_TEAM_ID,
    title: ticketTitle,
    inputs,
  };

  const response = await fetch(KICKFLOW_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    logger.error('❌ Kickflow API Error Response:', errorData);
    throw new Error(`Kickflow API Error: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  logger.debug('✅ Kickflow ticket created successfully:', { ticketId: responseData.id });
  return responseData;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.debug('Invalid trigger. This function only supports karte/hook trigger.');
    return;
  }

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, KICKFLOW_ACCESSTOKEN_SECRET],
  });
  const karteAppToken = secrets[KARTE_APP_TOKEN_SECRET];
  const kickflowAccessToken = secrets[KICKFLOW_ACCESSTOKEN_SECRET];

  const cmsHookData = data.jsonPayload.data;
  const contentId = cmsHookData?.sys?.raw?.contentId;

  if (!contentId) {
    logger.debug('contentId not found. Aborting.');
    return;
  }

  const contentData = await fetchCmsContent(CMS_MODEL_ID, contentId, karteAppToken, logger);

  const approvalFlagValue = contentData ? contentData[APPROVAL_FLAG_KEY] : undefined;

  if (approvalFlagValue !== true) {
    logger.warn(
      `Approval flag check failed. (${APPROVAL_FLAG_KEY}: ${approvalFlagValue}). Aborting ticket creation.`
    );
    return;
  }

  const ticketTitle = `CMS承認依頼: ${cmsHookData.id}`;
  const contentEditUrl = buildContentUrl(contentId);

  const inputs = buildKickflowInputs(contentEditUrl, contentId);

  try {
    const result = await executeKickflowApi(ticketTitle, inputs, kickflowAccessToken, logger);
    return result;
  } catch (error) {
    logger.error('❌ Craete ticket failed: ', error.message);
  }
}
