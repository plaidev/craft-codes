import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SITE_NAME = '<% SITE_NAME %>';
const UPLOAD_DIRECTORY = '<% UPLOAD_DIRECTORY %>';
const PUBLICATION_STATUS = '<% PUBLICATION_STATUS %>';
const MAKE_SUMMARY_PROMPT = '<% MAKE_SUMMARY_PROMPT %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';

function parseTargetData(rawData) {
  const columns = rawData.trim().split(',');
  const targetId = columns[0];
  const targetName = columns[1];
  const reviewsPart = columns.slice(2).join(',');

  const cleanedReviews = reviewsPart
    .split(' [NEXT_REVIEW] ')
    .join('\n')
    .replace(/^"|"$/g, '')
    .trim();

  return { targetId, targetName, cleanedReviews };
}

async function generateSummaryWithAI(targetName, cleanedReviews, aiModules) {
  const response = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    systemInstruction: MAKE_SUMMARY_PROMPT,
    contents: [
      {
        role: 'user',
        parts: [{ text: `ターゲット名: ${targetName}\nレビューデータ:\n${cleanedReviews}` }],
      },
    ],
  });

  return response.candidates[0].content.parts[0].text;
}

async function uploadAndPublish({ targetId, targetName, summary, sdk, RetryableError, logger }) {
  const uploadPath = `/${UPLOAD_DIRECTORY}/${targetId}.json`;
  const jsonBody = JSON.stringify({
    target_id: targetId,
    target_name: targetName,
    summary,
    updated_at: new Date().toISOString(),
  });
  const base64Content = Buffer.from(jsonBody).toString('base64');

  try {
    await sdk.postV2betaCraftSitesContentUpload({
      siteName: SITE_NAME,
      path: uploadPath,
      content: base64Content,
      contentType: 'application/json',
      kickHookV2: false,
    });

    await sdk.postV2betaCraftSitesContentUpdatevisibility({
      siteName: SITE_NAME,
      path: uploadPath,
      isPublic: PUBLICATION_STATUS,
      kickHookV2: false,
    });

    logger.log(
      `Craft Sitesへの要約ファイルアップロード及び公開状態の更新に成功しました: ${uploadPath}`
    );
  } catch (e) {
    const status = e.status || (e.data && e.data.status);
    if (status === 429 || status >= 500) {
      throw new RetryableError(`リトライ可能エラー（${status}）: ${targetName}`);
    }
    throw new Error(`永続的なエラー: ${e.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const rawData = data.jsonPayload?.data?.value;
    if (!rawData) {
      return logger.error('レビューデータが見つかりません');
    }
    const { targetId, targetName, cleanedReviews } = parseTargetData(rawData);

    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const appToken = secrets[KARTE_APP_TOKEN_SECRET];
    const sdk = api('@dev-karte/v1.0#l10f37mfxgrjj4');
    sdk.auth(appToken);

    const summary = await generateSummaryWithAI(targetName, cleanedReviews, aiModules);

    await uploadAndPublish({
      targetId,
      targetName,
      summary,
      sdk,
      RetryableError,
      logger,
    });
    return { status: 200 };
  } catch (e) {
    if (e instanceof RetryableError) {
      logger.warn(e.message);
      throw e;
    }
    logger.error('エラーが発生しました:', { error: e.message });
    throw e;
  }
}
