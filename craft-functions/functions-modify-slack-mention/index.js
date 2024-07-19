import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const EXCLUDED_FUNCTION_NAMES = '<% EXCLUDED_FUNCTION_NAMES %>';

function createSlackMessage(functionName, functionId, userName, projectId) {
  return `
  以下のCraft Functionsが更新されました！
  ---------------------------------------------------------
  ファンクション名：${functionName}
  ファンクションのURL：https://admin.karte.io/craft/functions/detail/${functionId}?project=${projectId}
  更新者：${userName}
  ---------------------------------------------------------
  `;
}

async function sendSlackMessage(slackClient, channelId, message, logger) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });

    logger.log(`メッセージをチャンネル ${channelId} に送信しました`);
  } catch (error) {
    logger.error(`メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [SLACK_TOKEN_SECRET],
    });

    const slackToken = secrets[SLACK_TOKEN_SECRET];
    const slackClient = new WebClient(slackToken);

    const functionsData = data.jsonPayload.data.ret;
    const {
      name: functionName,
      id: functionId,
      modified_by: { username: userName },
    } = functionsData;

    const excludedFunctionNames = EXCLUDED_FUNCTION_NAMES.split(',').map(name => name.trim());
    if (excludedFunctionNames.includes(functionName)) {
      logger.debug(`ファンクション名 ${functionName} は除外対象のため処理をスキップします。`);
      return;
    }

    const message = createSlackMessage(functionName, functionId, userName, KARTE_PROJECT_ID);
    await sendSlackMessage(slackClient, SLACK_CHANNEL_ID, message, logger);
  } catch (error) {
    logger.error(`エラーが発生しました: ${error.message}`);
    throw error;
  }
}
