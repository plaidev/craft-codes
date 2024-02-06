import { WebClient } from '@slack/web-api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GCP_API_KEY = '<% GCP_API_KEY %>';
const URL_TO_ANALYZE = '<% URL_TO_ANALYZE %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';

async function fetchData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data. Status code: ${response.status}`);
  }

  return response.json();
}

// PageSpeed Insights API URLを構築する関数
function buildPageSpeedApiUrl(strategy) {
  const apiURL = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  apiURL.searchParams.append('url', URL_TO_ANALYZE);
  apiURL.searchParams.append('key', GCP_API_KEY);
  apiURL.searchParams.append('strategy', strategy);
  return apiURL.href;
}

// PageSpeed Insightsの画面で確認できる数値と合わせるための関数
function formatFieldData(rawValue, roundDecimal) {
  if (rawValue == null) {
    return 'none';
  }

  let value;
  switch (roundDecimal) {
    case 1000:
      // LCP用の計算で少数第1位までの値を求める
      value = (Math.round(rawValue / 100) / 10).toFixed(1);
      break;
    case 100:
      // CLS用の計算で少数第2位までの値を求める
      value = (rawValue / 100).toFixed(2);
      break;
    default:
      // FID用の計算で整数の値を求める
      value = Math.round(rawValue).toString();
  }
  return parseFloat(value);
}

// パフォーマンスデータを取得する関数
async function getPerformanceData(strategy, logger) {
  try {
    const url = buildPageSpeedApiUrl(strategy);
    const data = await fetchData(url);
    return {
      lcp: formatFieldData(data.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? 'none', 1000),
      fid: formatFieldData(data.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile ?? 'none', 1),
      cls: formatFieldData(data.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? 'none', 100),
      score: Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100)
    };
  } catch (error) {
    logger.error(`[${strategy}] PageSpeed Insights APIの呼び出し時にエラーが発生しました:`, error.message);
    return null;
  }
}

// 通知メッセージを作成する関数
function buildSlackMessage(url, pcData, mobileData) {
  const currentDate = new Date().toLocaleDateString('ja-JP');
  let resultMessage;
  if (pcData.lcp > 2.5 || mobileData.lcp > 2.5 || 
      pcData.fid > 100 || mobileData.fid > 100 || 
      pcData.cls > 0.1 || mobileData.cls > 0.1) {
    resultMessage = 'コアウェブバイタルの主な指標に不合格があります:pleading_face:';
  } else {
    resultMessage = 'コアウェブバイタルの主な指標は全て合格です:hugging_face:';
  }

  return `:memo:${currentDate}の ${url} のパフォーマンスレポート:memo:

    :ultra_fast_parrot:コアウェブバイタル:ultra_fast_parrot:
            合格目安: LCP 2.5秒以下、FID 100ミリ秒以下、CLS 0.1以下
      
            LCP: スマートフォン ${mobileData.lcp}秒、パソコン ${pcData.lcp}秒
            FID: スマートフォン ${mobileData.fid}ミリ秒、パソコン ${pcData.fid}ミリ秒
            CLS: スマートフォン ${mobileData.cls}、パソコン ${pcData.cls}

            ${resultMessage}

    ---------------------------------------------------------------------------------

    :ultra_fast_parrot:パフォーマンススコア:ultra_fast_parrot:
            :sob: 0 - 49
            :cry: 50 - 69
            :pleading_face: 70 - 89
            :hugging_face: 90 - 100

            スマートフォン: ${mobileData.score}、 パソコン: ${pcData.score}`;
}

// Slackへメッセージを送信する関数
async function sendSlackMessage(channelId, message, { slackClient, logger }) {
  try {
    await slackClient.chat.postMessage({
      channel: channelId,
      text: message,
    });
  } catch (error) {
    logger.error('Slackへのメッセージ送信時にエラーが発生しました:', error.message);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [ SLACK_TOKEN_SECRET ] });
  const token = secrets[SLACK_TOKEN_SECRET];

  const slackClient = new WebClient(token);

  const pcData = await getPerformanceData('desktop', logger);
  const mobileData = await getPerformanceData('mobile', logger);

  // pcData または mobileData のいずれかがない場合は、エラーログを出力して処理を終了する
  if (!pcData || !mobileData) {
    logger.error('パフォーマンスデータの取得に失敗しました。');
    return;
  }

  // メッセージを作成して送信する
  const message = buildSlackMessage(URL_TO_ANALYZE, pcData, mobileData);
  await sendSlackMessage(SLACK_CHANNEL_ID, message, { slackClient, logger });

}
