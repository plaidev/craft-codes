import api from 'api';
import { google } from 'googleapis';

const CRAFT_SPEC_URI = '@dev-karte/v1.0#11ud47olug8c5v2';
const TALK_SPEC_URI = '@dev-karte/v1.0#ja8rb1jlswsjoo1';
const KARTE_TALK_APP_TOKEN_SECRET = '<% KARTE_TALK_APP_TOKEN_SECRET %>';
const KARTE_AI_APP_TOKEN_SECRET = '<% KARTE_AI_APP_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const HELP_MESSAGE = '<% HELP_MESSAGE %>';
const BOT_ID = '<% BOT_ID %>';
const MODEL = '<% MODEL %>';
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>';
const RANGE = '<% RANGE %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const AI_WARNING_MESSAGE = '<% AI_WARNING_MESSAGE %>';

async function initializeGoogleSheets(jsonKey) {
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();
  return google.sheets({ version: 'v4', auth: jwtClient });
}

async function fetchFaqsFromGoogleSheet(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;
  if (rows.length) {
    return rows.map(([question, answer, url]) => ({
      question,
      answer,
      url,
    }));
  }
  throw new Error('スプレッドシートにデータが存在しません');
}

async function createReplyContents({ userQuestion, faqs, craftAiModulesClient }) {
  const systemPrompt = `
  あなたは親切で丁寧なチャットオペレーターです。以下のFAQリストを参考にして、次のエンドユーザーからの質問に対して、できる限り自然で役立つ回答を提供してください。回答はプレーンテキストで行ってください。回答は100字程度で行ってください。

  # 重要な指示:
  リンクや参照を含める場合は、プレーンテキストで記述してください。例えば、「詳細はこちら: URL」を使ってください。
  
  FAQリスト:
  ${faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}\n詳細: ${faq.url}`).join('\n')}
  `;

  const userPrompt = userQuestion;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await craftAiModulesClient.postV2betaCraftAimodulesOpenaiChatCompletions({
    messages,
    model: MODEL,
    temperature: 0.1,
    frequency_penalty: 0,
  });

  let responseContent = response.data.content;

  responseContent += `\n\n${AI_WARNING_MESSAGE}`;

  if (/解決しなかった|うまくいかなかった/.test(userQuestion)) {
    return HELP_MESSAGE;
  }

  return responseContent;
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
      keys: [SERVICE_ACCOUNT_KEY_SECRET, KARTE_TALK_APP_TOKEN_SECRET, KARTE_AI_APP_TOKEN_SECRET],
    });
    const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
    const jsonKey = JSON.parse(_jsonKey);

    const talkToken = secrets[KARTE_TALK_APP_TOKEN_SECRET];
    const aiToken = secrets[KARTE_AI_APP_TOKEN_SECRET];
    talkApiClient.auth(talkToken);

    const userMessage = hookData.content.text;
    if (!userMessage) {
      return;
    }

    const sheets = await initializeGoogleSheets(jsonKey);
    const faqs = await fetchFaqsFromGoogleSheet(sheets);

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
