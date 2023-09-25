const LOG_LEVEL = "ERROR";
const MINUTES_TO_EXPIRE_COUPON = 60 * 24 * 30; // 30日後に削除
// SQLの結果に応じてカラム名を変更してください
// 1列目の値がkvsのkeyになります
const HEADER_COLUMNS = ["url", "title", "status", "author", "sync_date"];

async function upsertData(key, row, kvs, logger) {
  logger.debug(`start [upsertData] key: ${key}`);

  await kvs.write({ key, value: row, minutesToExpire: MINUTES_TO_EXPIRE_COUPON });

  logger.debug(`end [upsertData] key: ${key}`);
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { event_type, value } = data.jsonPayload.data;

  if (data.kind !== 'karte/jobflow') {
    logger.error(new Error('invalid kind'));
    return;
  }

  switch (event_type) {
    case 'START': {
      // ジョブ開始時に実行したい処理があれば記載;
      break;
    }
    case 'DATA': {
      // SQLの結果をkvsに格納する
      const splitData = value.split(',');
      const obj = HEADER_COLUMNS.reduce((acc, colName, j) => {
        acc[colName] = splitData[j];
        return acc;
      }, {});
      await upsertData(obj[HEADER_COLUMNS[0]], obj, kvs, logger)
      break;
    }
    case 'END': {
      // ジョブの終了時に実行したい処理があれば記載
      break;
    }
  }
}