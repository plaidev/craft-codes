import { BigQuery } from '@google-cloud/bigquery'

// この変数に利用するデータセット、テーブル名を指定する
const GOOGLE_CLOUD_BQ_DATASET = 'hoge_dataset';
const GOOGLE_CLOUD_BQ_TABLE = 'hoge_table';

/**
 * サービスアカウントキー（JSON形式）からClient Configを生成する
 * @param {string} saKeyJson JSON形式のサービスアカウントキー文字列
 */
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

/**
 * 日時情報をBQのDATETIME型の文字列に変換する
 * @param {Date} date 日時データ
 */
function getBQDatetimeString(date) {
    // 年、月、日、時、分、秒を取得
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // DATETIME型の文字列を作成
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default async function (data, { MODULES }) {
    const { logger, secret } = MODULES;

    // Validate data
    const actionData = data.jsonPayload?.data;
    if (actionData == null || !actionData.visitor_id || !actionData.datetime || !actionData.url) {
        throw new Error('invalid action data');
    }

    // Set row data
    const { visitor_id: rowVisitorId, datetime: strDatetime, url } = actionData
    const visitor_id = `vis-${rowVisitorId}`;
    const datetime = getBQDatetimeString(new Date(Number(strDatetime) * 1000))
    const rows = [{ visitor_id, datetime, url }];

    const { GOOGLE_CLOUD_SA_KEY: saKeyJson } = await secret.get({ keys: ['GOOGLE_CLOUD_SA_KEY'] })
    const clientConfig = getClientConfig(saKeyJson);
    const bigquery = new BigQuery(clientConfig);

    // Insert data into a table
    try {
        await bigquery
            .dataset(GOOGLE_CLOUD_BQ_DATASET)
            .table(GOOGLE_CLOUD_BQ_TABLE)
            .insert(rows);
        logger.log(actionData);
        logger.log(`Inserted ${rows.length} rows`);
    } catch (e) {
        // エラーオブジェクトをJSON形式で表示するため、stringifyしてからparseする
        logger.error(JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e))));
    }
}
