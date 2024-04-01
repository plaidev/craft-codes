import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const MINIMUM_CHANGE_PERCENTAGE = '<% MINIMUM_CHANGE_PERCENTAGE %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error('Invalid trigger. This function only supports karte/jobflow trigger.');
    return;
  }

  const secrets = await secret.get({ keys: [SLACK_TOKEN_SECRET] });
  const token = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(token);

  // 改行エスケープ文字を実際の改行に置き換えてから行に分割する
  const rows = data.jsonPayload.data.value.replace(/\\n/g, '\n').split('\n');

  // Slackに送信するメッセージを蓄積する変数
  let message = '';
  let hasMessageContent = false;

  // データの処理を開始
  rows.forEach((row, index) => {
    if (index === 0) return;
    row = row.trim();
    if (!row) return;

    const columns = row.split(',');
    // カラム数が期待される数と異なる場合はエラーログを出力し、処理をスキップ
    if (columns.length !== 6) {
      logger.error(
        `行 ${index + 1}: カラム数が期待される数と異なります。期待されるカラム数: 6, 実際のカラム数: ${columns.length}`
      );
      return;
    }

    const [
      segmentValue,
      startDate,
      startUserCountStr,
      endDate,
      endUserCountStr,
      differenceUserCount,
    ] = columns;
    const startUserCount = parseInt(startUserCountStr, 10);
    const endUserCount = parseInt(endUserCountStr, 10);

    // 開始時のユーザー数が0の場合は無限大の割合になるため、変動割合を計算しない
    if (startUserCount === 0) {
      logger.debug(`${segmentValue}の開始時のユーザー数が0のため、変動割合は計算されません。`);
      return;
    }

    const changePercentage = Math.abs(endUserCount - startUserCount) / startUserCount;

    // 変動割合が指定した最小変動割合を下回っている場合は、ログに記録してスキップ
    if (changePercentage < MINIMUM_CHANGE_PERCENTAGE) {
      logger.debug(
        `${segmentValue}の変動割合は${(MINIMUM_CHANGE_PERCENTAGE * 100).toFixed(2)}%を下回っていました。実際の変動割合: ${(changePercentage * 100).toFixed(2)}%`
      );
      return;
    }

    // 指定した最小変動割合を超えている場合の処理を続ける
    if (!hasMessageContent) {
      message += `セグメントの該当ユーザー数に大幅な変化がありました！\n`;
      hasMessageContent = true;
    }
    message +=
      `-----------------------------------------------------------------------------------------------\n` +
      `対象セグメント： https://admin.karte.io/p/${KARTE_PROJECT_ID}/segment/${segmentValue}\n` +
      `集計期間： ${startDate}〜${endDate}\n` +
      `${startDate}の該当ユーザー数： ${startUserCount}人\n` +
      `${endDate}の該当ユーザー数： ${endUserCount}人\n` +
      `対象セグメントに該当するユーザー数の変化： ${differenceUserCount}人 (${(changePercentage * 100).toFixed(1)}%変化)\n\n`;
  });

  if (!hasMessageContent) {
    logger.log('通知するメッセージ内容がありません。');
    return;
  }

  await slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: message,
  });
}
