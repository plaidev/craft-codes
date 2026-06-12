import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const CHAT_SENDER_ID = '<% CHAT_SENDER_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_APP_SPEC_URI = '@dev-karte/v1.0#d9ni28lia2r0hf';
const MIN_CHAT_TEXT_LENGTH = Number('<% MIN_CHAT_TEXT_LENGTH %>');

async function getToken(secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  return secrets[KARTE_APP_TOKEN_SECRET];
}

async function generateSummary(aiModules, logger, text) {
  try {
    const prompt = `次の文章の要点を3点抽出し、それを箇条書きでまとめてください。マークダウン記法は使わないでください。 "${text}"`;
    const res = await aiModules.gcpGeminiGenerateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    logger.error(`Failed to generate summary: ${error.message}`);
    return '';
  }
}

async function postNote(token, userId, text) {
  const client = api(KARTE_APP_SPEC_URI);
  client.auth(token);
  return client.postV2betaTalkNoteSend({
    content: { text },
    user_id: userId,
    sender: {
      id: CHAT_SENDER_ID,
      is_bot: true,
    },
  });
}

function isEmpty(data) {
  return !data || !/[^\s\u3000]/.test(data);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.warn(`invalid function trigger: ${data.kind}`);
    return { success: true, skipped: true, reason: 'invalid_trigger' };
  }

  const userMessage = data.jsonPayload.data.content.text;
  if (userMessage.length < MIN_CHAT_TEXT_LENGTH) {
    logger.debug('skip: too short message.');
    return { success: true, skipped: true, reason: 'too_short' };
  }

  try {
    const token = await getToken(secret);
    const summary = await generateSummary(aiModules, logger, userMessage);

    if (isEmpty(summary)) {
      logger.warn('summary is empty, skipping note post.');
      return { success: true, skipped: true, reason: 'empty_summary' };
    }

    const userId = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;
    await postNote(token, userId, `■自動要約: \n${summary}`);

    logger.log('Success: ', { userId });
    return { success: true, userId };
  } catch (error) {
    logger.error(`Failed to process: ${error.message}`);
    return { success: false, error: error.message };
  }
}
