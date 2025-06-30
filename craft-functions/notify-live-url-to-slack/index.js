import { WebClient } from '@slack/web-api';

// variables.jsonから読み込む変数を定義
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_MESSAGE_HEADER = '<% SLACK_MESSAGE_HEADER %>';
const SLACK_MESSAGE_NO_DATA = '<% SLACK_MESSAGE_NO_DATA %>';

async function getSlackToken(secret) {
  const secrets = await secret.get({
    keys: [SLACK_TOKEN_SECRET],
  });
  return secrets[SLACK_TOKEN_SECRET];
}

/**
 * Datahubのクエリ結果データをパースして、
 * ユーザーIDと生成されたURLの配列を返します。
 * `data.jsonPayload.data.value` にCSV形式の文字列が渡される想定です。
 * @param {object} data - KARTE Craft Functionsの入力データ
 * @param {object} logger - ロガーインスタンス
 * @returns {Array<{userId: string, generatedUrl: string}>} パースされたデータ
 */
function parseQueryResultData(data, logger) {
  const queryResultCsvStr = data?.jsonPayload?.data?.value;

  if (!queryResultCsvStr) {
    logger.error('Query result data is empty.');
    return [];
  }

  const lines = queryResultCsvStr.split('\n').filter(line => line.trim() !== '');

  if (lines.length < 2) {
    logger.warn('Query result has no data rows (only header or empty).');
    return [];
  }

  // ヘッダー行を除いたデータ行のみを取得
  const dataRows = lines.slice(1);

  const parsedData = dataRows
    .map((line, index) => {
      const fields = line.split(',');
      if (fields.length < 2) {
        logger.warn(`Skipping malformed row ${index + 1}: Not enough fields. Row: ${line}`);
        return null;
      }
      // 仕様に基づき、1列目をuserId、2列目をgeneratedUrlとして固定で取得
      const userId = fields[0];
      const generatedUrl = fields[1];
      return { userId, generatedUrl };
    })
    .filter(item => item !== null);

  return parsedData;
}

/**
 * パースされたデータからSlackメッセージのBlock Kitペイロードを構築します。
 * @param {Array<{userId: string, generatedUrl: string}>} queryResultData - パースされたクエリ結果データ
 * @returns {Array<object>} 構築されたSlackメッセージのblocks配列
 */
function constructSlackBlocks(queryResultData) {
  const blocks = [];

  // 1. ヘッダーブロック
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: SLACK_MESSAGE_HEADER,
      emoji: true,
    },
  });

  // 2. セクションブロック
  if (queryResultData.length > 0) {
    let text = '';
    queryResultData.forEach(item => {
      text += `<${item.generatedUrl}|${item.userId}>\n`;
    });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: SLACK_MESSAGE_NO_DATA,
      },
    });
  }

  return blocks;
}

/**
 * Slackにメッセージを投稿します。
 * 成功した場合は true を、失敗した場合は false を返します。
 * @param {object} params - パラメータオブジェクト
 * @param {WebClient} params.slackClient - Slack WebClient
 * @param {string} params.slackChannelId - 投稿先のチャンネルID
 * @param {Array<object>} params.slackBlocks - 投稿するメッセージブロック
 * @param {object} params.logger - ロガーインスタンス
 * @returns {Promise<boolean>} 投稿の成否
 */
async function postMessageToSlack({ slackClient, slackChannelId, slackBlocks, logger }) {
  try {
    await slackClient.chat.postMessage({
      channel: slackChannelId,
      blocks: slackBlocks,
    });
    // 成功した場合はtrueを返す
    return true;
  } catch (error) {
    logger.error(`Failed to post message to Slack. message: ${error.message}`);
    // 失敗した場合はfalseを返す
    return false;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    if (data.kind !== 'karte/jobflow') {
      logger.error(
        `Invalid trigger kind: ${data.kind}. This function only supports karte/jobflow trigger.`
      );
      return;
    }

    const token = await getSlackToken(secret);
    const slackClient = new WebClient(token);
    const queryResultData = parseQueryResultData(data, logger);
    const slackBlocks = constructSlackBlocks(queryResultData);

    const isSuccess = await postMessageToSlack({
      slackClient,
      slackChannelId: SLACK_CHANNEL_ID,
      slackBlocks,
      logger,
    });

    // postMessageToSlackが失敗した場合、ここで処理を終了する
    if (!isSuccess) {
      return;
    }

    logger.info('Slack message posted successfully. Craft Function finished.');
  } catch (error) {
    // 予期せぬその他のエラー（シークレット取得失敗、データパースでの例外など）を捕捉する
    logger.error(
      `An unexpected error occurred during Craft Function execution. message: ${error.message}`
    );
  }
}
