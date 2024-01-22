import { WebClient } from '@slack/web-api';
import { BigQuery } from '@google-cloud/bigquery';

const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const STOCK_TABLE_ID = '<% STOCK_TABLE_ID %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

function getClientConfig(saKeyJson) {
    const keyData = JSON.parse(saKeyJson);
    const projectId = keyData.project_id;
    const clientEmail = keyData.client_email;
    const privateKey = keyData.private_key.replace(/\\n/g, '\n');

    return {
        projectId,
        credentials: {
            client_email: clientEmail,
            private_key: privateKey
        }
    }
}

async function queryBigQueryForStock(targetItemId, stockTableId, { bigquery }) {
  // BigQueryクエリの実行
  const query = {
    query: `SELECT * FROM \`${stockTableId}\` WHERE item_id = '${targetItemId}'` //テーブル名は実際のものに書き換えてください
  };
  return bigquery.query(query);
}

async function sendSlackMessage(channelId, message, { slackClient }) {
  // Slackへのメッセージ送信処理
  await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;

  // Loggerの初期化
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // BigQueryとSlackのシークレットを取得
  const secrets = await secret.get({
      keys: [
          SERVICE_ACCOUNT_KEY_SECRET,
          SLACK_TOKEN_SECRET
      ],
  });

  const saKeyJson = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const clientConfig = getClientConfig(saKeyJson);

  // BigQueryクライアントを初期化
  const bigquery = new BigQuery(clientConfig);

  // Slackトークンの取得
  const token = secrets[SLACK_TOKEN_SECRET];

  // Slack APIクライアントの初期化
  const slackClient = new WebClient(token);

  const payloadData = data.jsonPayload.data;
  const targetItemId = payloadData.target_item_id;

  // BigQueryの結果を取得する
  const [rows] = await queryBigQueryForStock(targetItemId, STOCK_TABLE_ID, { bigquery });

  // BigQueryの結果が取得できなかった場合は、警告のログを出す
  if (!rows || rows.length === 0) {
      logger.warn('クエリ結果から在庫データを取得できませんでした。');
      return;
  }

  const result = rows[0];
  const itemStock = result.item_stock;
  const minStockNum = payloadData.min_stock_num;

  // 在庫数が設定値よりも少ない場合はSlackに通知
  if (itemStock >= minStockNum) {
      // 在庫数が設定値より多い場合はここで終了
      return;
  }

  const slackChannelId = payloadData.slack_channel_id;
  const message = `商品ID: ${targetItemId}、商品名: ${result.item_name} の在庫が少なくなっています。（現在の在庫数: ${itemStock} 個）`;

  // Slackへメッセージ送信
  await sendSlackMessage(slackChannelId, message, { slackClient });
}
