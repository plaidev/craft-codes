import api from 'api';

const CRAFT_SPEC_URI = '@dev-karte/v1.0#11ud47olug8c5v2';
const TALK_SPEC_URI = '@dev-karte/v1.0#ja8rb1jlswsjoo1';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const TRIGGER_WORD = '<% TRIGGER_WORD %>';
const MODEL = '<% MODEL %>';

async function getConversationWithEnduser({ userId, karteApiClient, limit, logger }) {
  try {
    const response = await karteApiClient.postV2TalkMessageGet({
      options: { limit },
      user_id: userId,
    });
    return response.data.messages;
  } catch (error) {
    logger.error(`Talk内容取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

async function sendNoteFromBot({ userId, content, karteApiClient, logger }) {
  try {
    await karteApiClient.postV2betaTalkNoteSend({
      content: { text: `AI Modulesの回答: ${content}` },
      sender: { id: 'sender0', is_bot: true },
      user_id: userId,
    });
  } catch (error) {
    logger.error(`Note送信中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

function extractLimitAndNoteMessage(noteContent) {
  const regex = new RegExp(`${TRIGGER_WORD}\\s+(\\d+)\\s*(.+)`);
  const match = noteContent.match(regex);
  if (match) {
    return {
      limit: parseInt(match[1], 10),
      howToReplyMessage: match[2],
    };
  }
  return {
    limit: 1,
    howToReplyMessage: noteContent,
  };
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const karteApiClient = api(TALK_SPEC_URI);
  const userId = data.jsonPayload.data.user_id;

  try {
    const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const token = secrets[KARTE_APP_TOKEN_SECRET];
    karteApiClient.auth(token);
    const sdk = karteApiClientForCraftTypeApp({ token, specUri: CRAFT_SPEC_URI });
    const noteContent = data.jsonPayload.data.content.text;

    if (!noteContent.startsWith(TRIGGER_WORD)) {
      return;
    }

    const { limit, howToReplyMessage } = extractLimitAndNoteMessage(noteContent);

    const talkMessages = await getConversationWithEnduser({
      karteApiClient,
      userId,
      limit,
      logger,
    });
    const conversationWithEnduser = talkMessages.map(msg => msg.content.text).join('\n');

    const prompt = `あなたは最高のチャットオペレーターです。次の回答方針に従って、次のような連続する会話の中のエンドユーザーからの質問に回答する際の返答文を考えてください。
    回答方針:
    ${howToReplyMessage}
    エンドユーザーとのやりとり:
    ${conversationWithEnduser}`;
    const messages = [{ role: 'user', content: prompt }];

    const response = await sdk.postV2betaCraftAimodulesOpenaiChatCompletions({
      messages,
      model: MODEL,
      temperature: 0.7,
      frequency_penalty: 0,
    });
    const chatResponse = response.data.content;

    await sendNoteFromBot({
      karteApiClient,
      userId,
      content: chatResponse,
      logger,
    });
  } catch (error) {
    logger.error(`functionの実行中にエラーが発生しました: ${error.message}`);
  }
}
