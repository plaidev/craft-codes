const LOG_LEVEL = '<% LOG_LEVEL %>';
const GAS_END_POINT_URL = '<% GAS_END_POINT_URL %>';

// スプレッドシートから現在のB1セルの値を取得する関数
async function fetchCurrentCount() {
  const response = await fetch(GAS_END_POINT_URL);
  const currentCount = await response.text();
  return currentCount;
}

// スプレッドシートのB1セルの値を更新する関数
async function updateCurrentCount(currentCount) {
  await fetch(GAS_END_POINT_URL, {
    method: 'POST',
    body: currentCount.toString(), // 数値を文字列に変換
  });

  // 更新後の数値を返す
  return currentCount;
}

export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;

  // Loggerの初期化
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    // HTTP GET リクエストを送信してB1セルの値を取得
    const currentCount = await fetchCurrentCount();
    logger.log('GETリクエストのレスポンス:', currentCount);

    // GETで受け取ったB1セルの値に1を加える
    const newCount = Number(currentCount) + 1;

    // HTTP POST リクエストを送信して、スプレッドシートのB1セルを新しい値に更新
    await updateCurrentCount(newCount);
  } catch (error) {
    // エラーが発生した場合の処理
    logger.error('リクエストに失敗しました：', error.message);
  }
}
