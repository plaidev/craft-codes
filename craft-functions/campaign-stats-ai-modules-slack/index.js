import api from 'api';
import { subDays, format } from 'date-fns';
import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const AGGREGATION_RANGE = '<% AGGREGATION_RANGE %>';
const RELATIVE_START_DATE_DAYS_AGO = Number('<% RELATIVE_START_DATE_DAYS_AGO %>');
const ABSOLUTE_START_DATE = '<% ABSOLUTE_START_DATE %>';
const ABSOLUTE_END_DATE = '<% ABSOLUTE_END_DATE %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const GEMINI_MODEL = 'gemini-2.5-flash';

function makeStartEndDate(daysAgo, startDate, endDate) {
  // 絶対指定
  if (startDate && endDate) {
    return {
      startDate: `${startDate}T00:00:00.000Z`,
      endDate: `${endDate}T23:59:59.999Z`,
    };
  }
  // 相対指定
  const s = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
  const e = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  return {
    startDate: `${s}T00:00:00.000Z`,
    endDate: `${e}T23:59:59.999Z`,
  };
}

async function fetchCampaignSettingsAndStats({ startDate, endDate, range, renew, sdk, logger }) {
  try {
    const res = await sdk.postV2betaActionCampaignGetsettingsandstats({
      start_date: startDate,
      end_date: endDate,
      range,
      is_test: false,
      renew,
    });
    return { result: res.data, status: res.status };
  } catch (err) {
    logger.error(err);
    return null;
  }
}

async function fetchAndRetryCampaignStats({
  startDate,
  endDate,
  range,
  sdk,
  RetryableError,
  logger,
}) {
  const renew = true;
  const fetchResult = await fetchCampaignSettingsAndStats({
    startDate,
    endDate,
    range,
    renew,
    sdk,
    logger,
  });

  if (!fetchResult) {
    logger.warn('API fetch failed (likely 500). Throwing RetryableError.');
    throw new RetryableError('API communication failure. System retry requested.');
  }

  const { status, result } = fetchResult;

  if (status === 200) {
    return result;
  }

  if (status === 202) {
    logger.log('Data preparation in progress. System retry expected.');
    throw new RetryableError('Data creation in progress. System retry expected.');
  }

  logger.error(`Non-retryable request failed with status ${status}`);
  throw new Error(`Data fetching failed with status: ${status}`);
}

function makeStatsObjectArray(rawStatsData) {
  const indexes = Object.keys(rawStatsData);

  if (indexes.length === 0) {
    return [];
  }

  const fieldNames = rawStatsData['0'];
  const objectArray = [];

  for (let i = 1; i < indexes.length; i++) {
    const row = rawStatsData[String(i)];

    if (row && row.length === fieldNames.length) {
      const obj = {};
      fieldNames.forEach((fieldName, j) => {
        obj[fieldName] = row[j];
      });
      objectArray.push(obj);
    }
  }

  return objectArray;
}

function makeAiPrompt(statsArray, startDate, endDate) {
  const dataString = JSON.stringify(statsArray, null, 2);
  const analysisPeriod = `${startDate} から ${endDate}`;

  return `
あなたはKARTEの高度なデータアナリストです。以下の複数ある接客サービス効果データ（JSON形式）を分析し、マーケティングチームがすぐに行動に移せるようなインサイトを抽出してください。

# 分析の概要
データ期間: ${analysisPeriod}
分析モデル: 接客効果指標と設定情報に基づく

# 分析データ (JSON配列)
---BEGIN JSON---
${dataString}
---END JSON---

# 指示事項
1. **全体サマリー（最上位）**: 
   - レポートタイトルや分析期間の詳細は記述せず、分析結果の核心を捉えたサマリーを**最初の1〜2文**で記述してください。これが通知の冒頭となります。
   - **サマリーの記述後、必ず空行を1行挿入してください。**

2. **パフォーマンス課題の特定**: 
   - 「接客数」が10以上ある接客サービスの中で、「接客ゴール率」が0.00%または極端に低い（0.5%未満）ものを全てリストアップしてください。
   - これらの接客について、「接客サービス名」「接客数」「接客ゴール率」を**Markdownの表記を使わずに**、以下の形式でリスト出力してください。* 例：[接客サービス名] (接客数: X, ゴール率: Y)
   - リスト出力後、必ず空白行を1行挿入してください。
   - その後に、最も問題と思われる接客の推定要因を箇条書き（- 記号を使用）で簡潔に記述してください。
   - 推定要因を書いた後も、次の改善アクションの提案の前に必ず空行を1行挿入してください。

3. **改善アクションの提案**:
   - 特定した最も問題のある接客サービスIDに対し、次に実行すべき**A/Bテストの具体的な提案**（仮説、テスト内容、期待効果）を**箇条書き**（- 記号を使用）で提案してください。
   
4. **出力形式**:
   - 分析結果全体を内容ごとに段落に分けて見やすく記述してください。
   - **見出し用のシャープ、Markdown記法の表、太字、JSONデータは一切使用しないでください。**
   - **課題・改善アクションの提案など段落の区切り（内容の区切り）ごとに必ず見出しと空白行を1行挿入し、読みやすさを確保してください。**
   - 箇条書きリスト（-）は、アイテムごとに1回の改行（次の行に移動）のみとしてください。
`;
}

async function runAiAnalysis({ dataForAI, startDate, endDate, aiModules, logger }) {
  const aiPrompt = makeAiPrompt(dataForAI, startDate, endDate);

  const aiResponse = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
  });

  if (!aiResponse || !aiResponse.candidates || aiResponse.candidates.length === 0) {
    logger.error('Gemini failed to generate candidates. Response was empty or invalid.');
    throw new Error('AI analysis failed: Gemini returned invalid response.');
  }

  const aiAnalysisText = aiResponse.candidates[0].content.parts[0].text;
  return aiAnalysisText;
}

async function sendSlackMessage({
  slackClient,
  channelId,
  reportText,
  startDate,
  endDate,
  logger,
}) {
  if (!channelId || !reportText) {
    logger.error('Slack Channel ID or Report Text is missing. Cannot send notification.');
    return;
  }

  const period = `${startDate.substring(0, 10)} - ${endDate.substring(0, 10)}`;
  const reportLines = reportText.split('\n').filter(line => line.trim() !== '');
  const summaryText = reportLines.slice(0, 2).join('\n');
  const detailsText = reportLines.slice(2).join('\n');

  try {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 週次接客パフォーマンス分析レポート`,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*📅 集計期間: ${period}*`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💡 概要:* ${summaryText}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: detailsText,
        },
      },
    ];

    await slackClient.chat.postMessage({
      channel: channelId,
      text: `新しいAI分析レポートが届きました: ${summaryText.substring(0, 50)}...`,
      blocks,
    });

    logger.log(`✅ メッセージをチャンネル ${channelId} に送信しました`);
  } catch (error) {
    logger.error(`メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, SLACK_TOKEN_SECRET],
  });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];
  const sdk = api('@dev-karte/v1.0#1esei2umf20oay1');
  sdk.auth(appToken);

  const slackToken = secrets[SLACK_TOKEN_SECRET];
  const slackClient = new WebClient(slackToken);

  const { startDate, endDate } = makeStartEndDate(
    RELATIVE_START_DATE_DAYS_AGO,
    ABSOLUTE_START_DATE,
    ABSOLUTE_END_DATE
  );

  const rawStatsData = await fetchAndRetryCampaignStats({
    startDate,
    endDate,
    range: AGGREGATION_RANGE,
    sdk,
    RetryableError,
    logger,
  });

  if (Object.keys(rawStatsData).length === 0) {
    return logger.warn('KARTE API returned an empty result. Aborting analysis.');
  }

  const dataForAI = makeStatsObjectArray(rawStatsData);

  const aiAnalysisText = await runAiAnalysis({
    dataForAI,
    startDate,
    endDate,
    aiModules,
    logger,
  });

  await sendSlackMessage({
    slackClient,
    channelId: SLACK_CHANNEL_ID,
    reportText: aiAnalysisText,
    startDate,
    endDate,
    logger,
  });
}
