import api from 'api';

const CRAFT_SPEC_URI = '@dev-karte/v1.0#11ud47olug8c5v2';
const TALK_SPEC_URI = '@dev-karte/v1.0#ja8rb1jlswsjoo1';
const KARTE_TALK_APP_TOKEN_SECRET = '<% KARTE_TALK_APP_TOKEN_SECRET %>';
const KARTE_AI_APP_TOKEN_SECRET = '<% KARTE_AI_APP_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const HELP_MESSAGE = '<% HELP_MESSAGE %>';
const FAQ_LIST = [
  {
    question: 'カレーの作り方は？',
    answer: 'カレーの作り方は、電子レンジで5分間600Wで加熱します',
    url: 'https://example.com/faq/curry',
  },
  {
    question: '営業時間は？',
    answer: '営業時間は9:00~17:00です',
    url: 'https://example.com/faq/hours',
  },
  {
    question: '返品方法は？',
    answer: '返品方法は郵送のみの対応です',
    url: 'https://example.com/faq/returns',
  },
]; // ここでFAQリストを必要に応じて編集してください

const BOT_ID = '<% BOT_ID %>';
const MODEL = '<% MODEL %>';

async function createReplyContents({ userQuestion, faqs, craftAiModulesClient }) {
  const prompt = `あなたは最高のチャットオペレーターです。以下のFAQリストを参考にして、次のエンドユーザーからの質問に回答してください。FAQリストに該当する場合は回答し、該当しない場合は「${HELP_MESSAGE}」と返答してください。
  FAQリスト:
  ${faqs.map(faq => `質問: ${faq.question}\n回答: ${faq.answer}\nリンク: ${faq.url}`).join('\n')}
  エンドユーザーからの質問文:
  ${userQuestion}`;
  const messages = [{ role: 'user', content: prompt }];
  const response = await craftAiModulesClient.postV2betaCraftAimodulesOpenaiChatCompletions({
    messages,
    model: MODEL,
    temperature: 0.7,
    frequency_penalty: 0,
  });

  return response.data.content;
}

async function sendAnswerFromBot({ userId, content, talkApiClient, logger }) {
  try {
    const messageData = {
      user_id: userId,
      content: { text: content },
      sender_id: BOT_ID,
    };
    await talkApiClient.postV2TalkMessageSendfromoperator(messageData);
  } catch (error) {
    logger.error(`回答の送信中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const talkApiClient = api(TALK_SPEC_URI);
  const hookData = data.jsonPayload.data;
  const userId = hookData.user_id;
  try {
    const secrets = await secret.get({
      keys: [KARTE_TALK_APP_TOKEN_SECRET, KARTE_AI_APP_TOKEN_SECRET],
    });
    const talkToken = secrets[KARTE_TALK_APP_TOKEN_SECRET];
    const aiToken = secrets[KARTE_AI_APP_TOKEN_SECRET];
    talkApiClient.auth(talkToken);

    const userMessage = hookData.content.text;
    if (!userMessage) {
      return;
    }

    const faqs = FAQ_LIST;
    const craftAiModulesClient = karteApiClientForCraftTypeApp({
      token: aiToken,
      specUri: CRAFT_SPEC_URI,
    });

    const chatResponse = await createReplyContents({
      userQuestion: userMessage,
      faqs,
      craftAiModulesClient,
    });

    await sendAnswerFromBot({
      talkApiClient,
      userId,
      content: chatResponse,
      logger,
    });
  } catch (error) {
    logger.error(`functionの実行中にエラーが発生しました: ${error.message}`);
  }
}
