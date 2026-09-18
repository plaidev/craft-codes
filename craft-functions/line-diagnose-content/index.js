const LOG_LEVEL = '<% LOG_LEVEL %>';
const CHANNEL_ACCESS_TOKEN_SECRET_NAME = '<% CHANNEL_ACCESS_TOKEN_SECRET_NAME %>';
const DIAGNOSE_START_TEXT = '<% DIAGNOSE_START_TEXT %>';
const LINE_REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';
const FIRST_QUESTION_ID = 'Q-1';

// 診断のフローチャートを定義
const flowChart = {
  // 設問を設定
  'Q-1': {
    question: '1.私服はカジュアルなものが好きですか？',
    answers: {
      YES: { label: '1.はい', next: 'Q-2A' },
      NO: { label: '1.いいえ', next: 'Q-2B' },
    },
  },
  'Q-2A': {
    question: '2-A.外に出るときはかっちりしたい？',
    answers: {
      YES: { label: '2-A.はい', next: 'Q-3A' },
      NO: { label: '2-A.いいえ', next: 'Q-3B' },
    },
  },
  'Q-2B': {
    question: '2-B.布に覆われていることがあまり好きでない？',
    answers: {
      YES: { label: '2-B.はい', next: 'Q-3B' },
      NO: { label: '2-B.いいえ', next: 'Q-3C' },
    },
  },
  'Q-3A': {
    question: '3-A.柄物よりはシンプルなカラーのものが好きですか？',
    answers: {
      YES: { label: '3-A.はい', next: 'R-A' },
      NO: { label: '3-A.いいえ', next: 'R-B' },
    },
  },
  'Q-3B': {
    question: '3-B.ブルベですか？',
    answers: {
      YES: { label: '3-B.はい', next: 'R-C' },
      NO: { label: '3-B.いいえ', next: 'R-D' },
    },
  },
  'Q-3C': {
    question: '3-C.休日は外で遊ぶより家でゆっくりしたい派ですか？',
    answers: {
      YES: { label: '3-C.はい', next: 'R-E' },
      NO: { label: '3-C.いいえ', next: 'R-F' },
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

// postback data から設問・回答・結果 ID を取り出す関数
function parsePostbackData(data) {
  if (!data || typeof data !== 'string') {
    return null;
  }
  const params = new URLSearchParams(data);
  const type = params.get('type');
  if (type === 'answer') {
    const questionId = params.get('question_id');
    const answerId = params.get('answer_id');
    if (!questionId || !answerId) {
      return null;
    }
    return { type, questionId, answerId };
  }
  if (type === 'result') {
    const resultId = params.get('result_id');
    if (!resultId) {
      return null;
    }
    return { type, resultId };
  }
  return null;
}

// LINEからのWeb HookでreplyTokenとイベント種別を取得する関数
function getReplyTokenAndEvent(data) {
  const events = data?.jsonPayload?.data?.body?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }
  const eventData = events[0];
  const { replyToken } = eventData;
  if (!replyToken) {
    return null;
  }
  if (eventData.type === 'postback' && eventData.postback?.data) {
    return {
      replyToken,
      kind: 'postback',
      data: eventData.postback.data,
    };
  }
  if (eventData.type === 'message' && eventData.message?.text != null) {
    return {
      replyToken,
      kind: 'message',
      text: eventData.message.text,
    };
  }
  return null;
}

// 現在の診断ステップを取得する関数
function resolveStep(event, diagnoseStartText, flowChartObj) {
  if (event.kind === 'message') {
    if (event.text === diagnoseStartText) {
      return { kind: 'question', stepId: FIRST_QUESTION_ID };
    }
    return null;
  }
  if (event.kind !== 'postback') {
    return null;
  }
  const parsed = parsePostbackData(event.data);
  if (!parsed) {
    return null;
  }
  if (parsed.type === 'result') {
    const resultNode = flowChartObj[parsed.resultId];
    if (!resultNode?.result) {
      return null;
    }
    return { kind: 'result', stepId: parsed.resultId };
  }
  if (parsed.type === 'answer') {
    const questionNode = flowChartObj[parsed.questionId];
    const answer = questionNode?.answers?.[parsed.answerId];
    const nextNode = flowChartObj[answer?.next];
    if (!answer || !nextNode) {
      return null;
    }
    if (nextNode.result) {
      return { kind: 'resultPrompt', resultId: answer.next };
    }
    return { kind: 'question', stepId: answer.next };
  }
  return null;
}

function createPostbackAction(label, data) {
  return {
    type: 'action',
    action: {
      type: 'postback',
      label,
      data,
      displayText: label,
    },
  };
}

// LINEに送信する診断のデータを作成する関数
function createRequestQuestionBody(questionSentence, currentStep, replyToken) {
  const answers = flowChart[currentStep]?.answers || {};
  const items = Object.entries(answers).map(([answerId, answer]) =>
    createPostbackAction(answer.label, `type=answer&question_id=${currentStep}&answer_id=${answerId}`)
  );
  return {
    replyToken,
    messages: [
      {
        type: 'text',
        text: questionSentence,
        quickReply: {
          items,
        },
      },
    ],
  };
}

// LINEに送信する診断結果確認のデータを作成する関数
function createRequestResultPromptBody(resultId, replyToken) {
  return {
    replyToken,
    messages: [
      {
        type: 'text',
        text: '診断が完了しました。結果を見るをタップしてください。',
        quickReply: {
          items: [createPostbackAction('結果を見る', `type=result&result_id=${resultId}`)],
        },
      },
    ],
  };
}

// LINEに送信する診断の結果を作成する関数
function createRequestResultBody(thumbnailImageUrl, resultText, replyToken, result, detaillUri) {
  return {
    replyToken,
    messages: [
      {
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
            uri: detaillUri,
          },
          actions: [
            {
              type: 'uri',
              label: '詳細を見る',
              uri: detaillUri,
            },
          ],
        },
      },
    ],
  };
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
  const secrets = await secret.get({ keys: [CHANNEL_ACCESS_TOKEN_SECRET_NAME] });
  const accessToken = secrets[CHANNEL_ACCESS_TOKEN_SECRET_NAME];

  const event = getReplyTokenAndEvent(data);
  if (!event) {
    logger.warn('LINE event is empty or invalid.');
    return;
  }

  const step = resolveStep(event, DIAGNOSE_START_TEXT, flowChart);
  if (!step) {
    return;
  }

  // 診断のフローチャートから設問と結果を取得
  let requestBody;
  if (step.kind === 'resultPrompt') {
    requestBody = JSON.stringify(createRequestResultPromptBody(step.resultId, event.replyToken));
  } else if (step.kind === 'result') {
    const { result, resultText, thumbnailImageUrl, detaillUri } = flowChart[step.stepId] ?? {};
    if (!result || !resultText) {
      logger.error(`result is undefined. | stepId: ${step.stepId}`);
      return;
    }
    requestBody = JSON.stringify(
      createRequestResultBody(thumbnailImageUrl, resultText, event.replyToken, result, detaillUri)
    );
  } else {
    const questionSentence = flowChart[step.stepId]?.question;
    if (!questionSentence) {
      logger.error(`questionSentence is null. | stepId: ${step.stepId}`);
      return;
    }
    requestBody = JSON.stringify(
      createRequestQuestionBody(questionSentence, step.stepId, event.replyToken)
    );
  }

  await postResponseToLine(accessToken, requestBody, logger);
}
