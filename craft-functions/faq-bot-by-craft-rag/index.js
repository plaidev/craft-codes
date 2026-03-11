// functions/event/faq-bot-by-craft-rag/index.ts
import api from 'api';

const talkApiClient = api('@dev-karte/v1.0#kq56pa1wmccjei8j');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_TALK_APP_TOKEN_SECRET = '<% KARTE_TALK_APP_TOKEN_SECRET %>';
const SYSTEM_PROMPT = '<% SYSTEM_PROMPT %>';
const BOT_HELP_MESSAGE = '<% BOT_HELP_MESSAGE %>';
const AI_WARNING_MESSAGE = '<% AI_WARNING_MESSAGE %>';
const BOT_ERROR_MESSAGE = '<% BOT_ERROR_MESSAGE %>';
const CHANGE_OPERATOR_MESSAGE = '<% CHANGE_OPERATOR_MESSAGE %>';
const OPERATOR_ID = '<% OPERATOR_ID %>';
const BOT_ID = '<% BOT_ID %>';
const CORPUS_ID = '<% CORPUS_ID %>';

// 生成AI関連の定数
const GEMINI_MODEL = 'gemini-2.5-pro'; // RAGの検索結果からベクトル類似度が閾値を超えたものを取得するための閾値です。0〜1の数値で設定してください。
const VECTOR_DISTANCE_THRESHOLD = 0.35; // RAGの検索結果からベクトル類似度が閾値を超えたものを取得するための閾値です。0〜1の数値で設定してください。
const MAX_OUTPUT_TOKENS = 2048; // AI生成回答の最大トークン数です。1〜65536の整数で設定してください。
async function createReplyContents({ userQuestion, contexts, aiModules }) {
  const systemPrompt = `${SYSTEM_PROMPT}

# FAQ情報:

${contexts.map(ctx => ctx.text).join('\n\n')}`;
  const result = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    contents: [{ role: 'user', parts: [{ text: userQuestion }] }],
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('aiModules から有効なレスポンスが得られませんでした');
  }
  return AI_WARNING_MESSAGE
    ? `${content}

${AI_WARNING_MESSAGE}`
    : content;
}
async function sendAnswerFromBot({ userId, content, talkApiClient: talkApiClient2 }) {
  await talkApiClient2.postV2TalkMessageSendfromoperator({
    user_id: userId,
    content: { text: content },
    sender_id: BOT_ID,
  });
}
async function assignOperator({ userId, assigneeId, talkApiClient: talkApiClient2 }) {
  await talkApiClient2.postV2TalkAssigneeAssign({
    user_id: userId,
    assignee: { id: assigneeId, is_bot: false },
  });
}
export default async function (data, context) {
  const { MODULES } = context;
  const { initLogger, secret, rag, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const requiredVars = {
    KARTE_TALK_APP_TOKEN_SECRET,
    SYSTEM_PROMPT,
    BOT_ERROR_MESSAGE,
    GEMINI_MODEL,
    BOT_ID,
    CORPUS_ID,
  };
  const emptyVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (emptyVars.length > 0) {
    logger.error(`以下の変数が設定されていません: ${emptyVars.join(', ')}`);
    return;
  }
  if (
    Number.isNaN(VECTOR_DISTANCE_THRESHOLD) ||
    VECTOR_DISTANCE_THRESHOLD < 0 ||
    VECTOR_DISTANCE_THRESHOLD > 1
  ) {
    logger.error('VECTOR_DISTANCE_THRESHOLD は 0〜1 の数値で設定してください');
    return;
  }
  if (
    Number.isNaN(MAX_OUTPUT_TOKENS) ||
    !Number.isInteger(MAX_OUTPUT_TOKENS) ||
    MAX_OUTPUT_TOKENS <= 0 ||
    MAX_OUTPUT_TOKENS > 65536
  ) {
    logger.error('MAX_OUTPUT_TOKENS は 1〜65536 の整数で設定してください');
    return;
  }
  const hookData = data.jsonPayload.data;
  const userId = hookData.user_id || hookData.visitor_id;
  if (!userId) {
    logger.error('user_id および visitor_id が空のためスキップします');
    return;
  }
  const userMessage = hookData.content?.text;
  if (!userMessage) {
    logger.error('user_message が空のためスキップします');
    return;
  }
  try {
    const secrets = await secret.get({
      keys: [KARTE_TALK_APP_TOKEN_SECRET],
    });
    const talkToken = secrets[KARTE_TALK_APP_TOKEN_SECRET];
    if (!talkToken) {
      logger.error('token_secret が取得できませんでした。シークレットを確認してください。');
      return;
    }
    talkApiClient.auth(talkToken);
    const assigneeResponse = await talkApiClient.postV2betaTalkAssigneeGet({ user_id: userId });
    const assigneeId = assigneeResponse.data?.assignee?.id;
    if (assigneeId && assigneeId !== BOT_ID) {
      logger.debug('別のオペレーターにアサインされているためスキップします:', {
        userId,
        assigneeId,
      });
      return;
    }
    logger.debug('ユーザーメッセージ:', userMessage);
    let contexts = [];
    try {
      contexts = await rag.retrieveContexts({
        corpusId: CORPUS_ID,
        text: userMessage,
        vectorDistanceThreshold: VECTOR_DISTANCE_THRESHOLD,
      });
    } catch {
      logger.debug('RAGの検索に失敗しました。検索結果なしとして処理します。');
    }
    logger.debug(
      'RAGコンテキスト詳細:',
      contexts.map((ctx, i) => ({
        index: i,
        score: ctx.score,
        filePath: ctx.filePath,
        text: ctx.text,
      }))
    );
    if (contexts.length === 0) {
      logger.warn('関連するFAQが見つかりませんでした。ヘルプメッセージを送信します。', {
        userMessage,
      });
      if (BOT_HELP_MESSAGE) {
        await sendAnswerFromBot({
          userId,
          content: BOT_HELP_MESSAGE,
          talkApiClient,
        });
      }
      if (OPERATOR_ID) {
        await assignOperator({
          userId,
          assigneeId: OPERATOR_ID,
          talkApiClient,
        });
        logger.debug('担当者をオペレーターに変更しました: ', { userId, assigneeId: OPERATOR_ID });
        if (CHANGE_OPERATOR_MESSAGE) {
          await sendAnswerFromBot({
            userId,
            content: CHANGE_OPERATOR_MESSAGE,
            talkApiClient,
          });
          logger.debug('オペレーターに変更したメッセージを送信しました: ', {
            userId,
            content: CHANGE_OPERATOR_MESSAGE,
          });
        }
      }
      return;
    }
    const chatResponse = await createReplyContents({
      userQuestion: userMessage,
      contexts,
      aiModules,
    });
    await sendAnswerFromBot({
      userId,
      content: chatResponse,
      talkApiClient,
    });
    logger.debug('チャットメッセージを送信しました: ', { userId, chatResponse });
  } catch (error) {
    const fetchError = error;
    const errorMessage = fetchError.name === 'FetchError' ? fetchError.data.error : error.message;
    if (fetchError.status === 403) {
      logger.error(
        `functionの実行中にエラーが発生しました: 権限が不足しています。KARTE Talk App Token の権限設定を確認してください。
${errorMessage}`
      );
    } else if (fetchError.status === 400) {
      logger.error(`functionの実行中にエラーが発生しました: 変数の設定を確認してください。
${errorMessage}`);
    } else {
      logger.error(`functionの実行中にエラーが発生しました: 
${errorMessage}`);
    }
    try {
      await sendAnswerFromBot({
        userId,
        content: BOT_ERROR_MESSAGE,
        talkApiClient,
      });
      logger.debug('エラーメッセージを送信しました: ', { userId, content: BOT_ERROR_MESSAGE });
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${sendError.message}`);
    }
  }
}
