import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const CHAT_SENDER_ID = '<% CHAT_SENDER_ID %>';
const TALK_SPEC_URI = '<% TALK_SPEC_URI %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const MIN_CHAT_TEXT_LENGTH = Number('<% MIN_CHAT_TEXT_LENGTH %>'); // この文字数以上のチャットメッセージのみ自動要約する

async function fetchSummary(aiModules, text) {
  const prompt = `次の文章の要点を3点抽出し、それを箇条書きでまとめてください。マークダウン記法は使わないでください。 "${text}"`;
  const res = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function postNote({ userId, text, token }) {
  const client = api(TALK_SPEC_URI);
  client.auth(token);
  return client.postV2betaTalkNoteSend({
    content: {
      text,
    },
    user_id: userId,
    sender: {
      id: CHAT_SENDER_ID,
      is_bot: true,
    },
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.warn(`invalid function trigger: ${data.kind}`);
    return;
  }

  const userMessage = data.jsonPayload.data.content.text;
  if (userMessage.length < MIN_CHAT_TEXT_LENGTH) {
    logger.debug(`skip: too short message.`);
    return;
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const summary = await fetchSummary(aiModules, userMessage);
  if (summary) {
    logger.debug(`fetchSummary succeeded.`);
  }

  const userId = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;
  const reply = `■自動要約: \n${summary}`;
  return postNote({ userId, text: reply, token });
}
