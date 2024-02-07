const LOG_LEVEL = '<% LOG_LEVEL %>';
const CHANNEL_ACCESS_TOKEN_SECRET = '<% CHANNEL_ACCESS_TOKEN_SECRET %>';
const DIAGNOSE_START_TEXT = '<% DIAGNOSE_START_TEXT %>';
const LINE_REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';

// 診断のフローチャートを定義
const flowChart = {
  // 設問を設定
  start: {
    question: '1.私服はカジュアルなものが好きですか？',
    answers: {
      '1.はい': '2-A',
      '1.いいえ': '2-B',
    },
  },
  '2-A': {
    question: '2-A.外に出るときはかっちりしたい？',
    answers: {
      '2-A.はい': '3-A',
      '2-A.いいえ': '3-B',
    },
  },
  '2-B': {
    question: '2-B.布に覆われていることがあまり好きでない？',
    answers: {
      '2-B.はい': '3-B',
      '2-B.いいえ': '3-C',
    },
  },
  '3-A': {
    question: '3-A.柄物よりはシンプルなカラーのものが好きですか？',
    answers: {
      '3-A.はい': 'R-A',
      '3-A.いいえ': 'R-B',
    },
  },
  '3-B': {
    question: '3-B.ブルベですか？',
    answers: {
      '3-B.はい': 'R-C',
      '3-B.いいえ': 'R-D',
    },
  },
  '3-C': {
    question: '3-C.休日は外で遊ぶより家でゆっくりしたい派ですか？',
    answers: {
      '3-C.はい': 'R-E',
      '3-C.いいえ': 'R-F',
    },
  },
  // 診断結果を設定
  'R-A': {
    result: 'チェスターコート',
    resultText: '大人の女性にぴったりな商品です!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
  'R-B': {
    result: 'セットアップ１',
    resultText: 'フォーマルにもカジュアルにも着こなせる商品です!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
  'R-C': {
    result: 'オフショルダーワンピース',
    resultText: '大人の女性向けのカジュアルなワンピースです!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
  'R-D': {
    result: 'フラワープリントワンピース',
    resultText: '華やかなあなたにぴったりの商品です!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
  'R-E': {
    result: 'クルーネックニット',
    resultText: '休日に家で読書をしていそうなクールなあなたにピッタリの商品です!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
  'R-F': {
    result: 'セットアップ２',
    resultText: '明るくて可愛らしい性格のあなたにぴったりの商品です!',
    thumbnailImageUrl: 'https://example.com/image.jpg',
    detaillUri: 'https://example.com/detail',
  },
};

// 診断のルールを作成する関数
function makeTransitionRules(flowChartObj) {
  const keys = Object.keys(flowChartObj);
  let rules = {};
  keys.forEach(key => {
    rules = { ...rules, ...flowChartObj[key].answers };
  });
  return rules;
}

// 現在の診断ステップを取得する関数
function getCurrentStep(text, transitionRules) {
  if (text === DIAGNOSE_START_TEXT) {
    return 'start';
  }
  return transitionRules[text];
}

// LINEからのWeb HookでreplyTokenとtextを取得する関数
function getReplyTokenAndText(data) {
  const eventData = data.jsonPayload.data.body.events[0];
  return {
    replyToken: eventData.replyToken,
    text: eventData.message.text,
  };
}

// LINEに送信する診断のデータを作成する関数
function createRequestQuestionBody(questionSentence, currentStep, replyToken) {
  const [answerYes, answerNo] = Object.keys(flowChart[currentStep]?.answers || {});
  return {
    replyToken,
    messages: [
      {
        type: 'text',
        text: questionSentence,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: answerYes,
                text: answerYes,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: answerNo,
                text: answerNo,
              },
            },
          ],
        },
      },
    ],
  };
}

// LINEに送信する診断の結果を作成する関数
function createRequestResultBody(thumbnailImageUrl, resultText, replyToken, result, detaillUri) {
  return {
    replyToken,
    messages: [{
      type: 'template',
      altText: 'This is a buttons template',
      template: {
        type: 'buttons',
        thumbnailImageUrl,
        imageAspectRatio: 'rectangle',
        imageSize: 'cover',
        imageBackgroundColor: '#FFFFFF',
        title: result,
        text: resultText,
        defaultAction: {
          type: 'uri',
          label: 'View detail',
          uri: detaillUri
        },
        actions: [
          {
            type: 'uri',
            label: '詳細を見る',
            uri: detaillUri
          }
        ]
      }
    }]};
}

// LINEにPOSTリクエストを送信する関数
async function postResponseToLine(token, requestBodyObj, logger) {
  const postData = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: requestBodyObj,
  };
  try {
    const response = await fetch(LINE_REPLY_ENDPOINT, postData);
    if (!response.ok) {
      throw new Error(response.status);
    }
  } catch (error) {
    logger.error(`Error: ${error}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // LINEのチャンネルアクセストークンを取得
  const secrets = await secret.get({ keys: [CHANNEL_ACCESS_TOKEN_SECRET] });
  const accessToken = secrets[CHANNEL_ACCESS_TOKEN_SECRET];

  const transitionRules = makeTransitionRules(flowChart);

  const { replyToken, text } = getReplyTokenAndText(data);

  const currentStep = getCurrentStep(text, transitionRules);
  if (!currentStep) {
    return;
  }

  // 診断のフローチャートから設問と結果を取得
  const questionSentence = flowChart[currentStep]?.question;
  const { result, resultText, thumbnailImageUrl, detaillUri } = flowChart[currentStep] ?? {};

  if (!questionSentence && !resultText) {
    logger.error(`questionSentence and resultText are null. | currentStep: ${currentStep}`);
    return;
  }

  let requestBody;
  if (result) {
    requestBody = JSON.stringify(
      createRequestResultBody(thumbnailImageUrl, resultText, replyToken, result, detaillUri)
    );
  } else {
    requestBody = JSON.stringify(
      createRequestQuestionBody(questionSentence, currentStep, replyToken)
    );
  }

  await postResponseToLine(accessToken, requestBody, logger);
}