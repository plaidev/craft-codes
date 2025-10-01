/*
Craft Cross CMSの更新時Hookを受け取り、GitHubのrepository_dispatchイベントを発火するCraft Functions実装例
*/

// 定数の設定
const LOG_LEVEL = 'DEBUG'; // ログレベル
const GITHUB_TOKEN_SECRET = ''; // GitHubトークンを保存したCraft側シークレット名
const GITHUB_OWNER = ''; // GitHubのオーナー名
const GITHUB_REPO = ''; // GitHubのリポジトリ名
const TARGET_MODEL_IDS = ''; // 同期対象のCMSモデルID（カンマ区切りで複数指定可能）

const SUPPORTED_EVENTS = [
  'cms/content/create',
  'cms/content/update', 
  'cms/content/delete',
  'cms/content/publish',
  'cms/content/unpublish'
];

/**
 * GitHubのrepository_dispatchイベントを発火する
 */
async function triggerRepositoryDispatch(token, logger) {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'KARTE-Craft-Functions/1.0'
      },
      body: JSON.stringify({
        event_type: 'cms_update',
        client_payload: {
          source: 'craft-cross-cms',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    logger.debug(`Successfully triggered repository_dispatch event for ${GITHUB_OWNER}/${GITHUB_REPO}`);
  } catch (error) {
    logger.error(`Error in triggerRepositoryDispatch: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  logger.debug(`jsonPayload: ${JSON.stringify(data.jsonPayload)}`);

  // Hook v2からのトリガーかどうかを確認
  if (data.kind !== 'karte/apiv2-hook') {
    logger.debug('Invalid trigger. This function only supports karte/apiv2-hook trigger.');
    return;
  }

  // イベントタイプを確認
  const eventType = data.jsonPayload.event_type;
  
  // 対象イベントかどうかを確認（作成、更新、削除、公開、非公開）
  if (!SUPPORTED_EVENTS.includes(eventType)) {
    logger.debug(`Skipping event: ${eventType} (not a supported CMS event)`);
    return;
  }

  // CMSコンテンツの情報を抽出
  const contentId = data.jsonPayload.data.id;
  const modelId = data.jsonPayload.data.sys.modelId;
  
  // 対象モデルかどうかを確認（複数のモデルIDに対応）
  const targetModelIds = TARGET_MODEL_IDS.split(',').map(id => id.trim()).filter(id => id);
  if (!targetModelIds.includes(modelId)) {
    logger.debug(`modelId is not target: modelId=${modelId}, expected=${targetModelIds.join(', ')}`);
    return;
  }

  try {
    // シークレットからGitHubトークンを取得
    const secrets = await secret.get({ keys: [GITHUB_TOKEN_SECRET] });
    const githubToken = secrets[GITHUB_TOKEN_SECRET];

    if (!githubToken) {
      throw new Error(`GitHub token not found in secrets: ${GITHUB_TOKEN_SECRET}`);
    }

    // GitHubのrepository_dispatchイベントを発火
    await triggerRepositoryDispatch(githubToken, logger);
    
    logger.debug(`Process completed successfully for ${eventType} event: contentId=${contentId}, modelId=${modelId}`);
  } catch (error) {
    logger.error(`Main process error: ${error.message}`);
    // エラーを再投げして関数の実行を失敗させる
    throw error;
  }
}
