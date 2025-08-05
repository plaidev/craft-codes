const LOG_LEVEL = '<% LOG_LEVEL %>';
const MODEL = '<% MODEL %>';
const CHAT_SENDER_ID = '<% CHAT_SENDER_ID %>';
const CRAFT_SPEC_URI = '@dev-karte/xxxxxxxxxx';
const TALK_SPEC_URI = '@dev-karte/yyyyyyyyyy';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const MIN_CHAT_TEXT_LENGTH = Number('<% MIN_CHAT_TEXT_LENGTH %'); // この文字数以上のチャットメッセージのみ自動要約する

async function fetchSummary({ text, token, karteApiClientForCraftTypeApp }) {
  const sdk = karteApiClientForCraftTypeApp({
    token,
    specUri: CRAFT_SPEC_URI,
  });

  const prompt = `次の文章の要点を3点抽出し、それを箇条書きでまとめてください。 "${text}"`;

  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];
  const { data } = await sdk.postV2betaCraftAimodulesOpenaiChatCompletions({
    messages,
    model: MODEL,
    temperature: 0.7,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000,
  });
  return data.content;
}

function postNote({ userId, text, token, karteApiClientForCraftTypeApp }) {
  const sdk = karteApiClientForCraftTypeApp({
    token,
    specUri: TALK_SPEC_URI,
  });

  return sdk.postV2betaTalkNoteSend({
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
  const { initLogger, secret, karteApiClientForCraftTypeApp } = MODULES;
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

  const summary = await fetchSummary({ text: userMessage, token, karteApiClientForCraftTypeApp });
  if (summary) {
    logger.debug(`fetchSummary succeeded.`);
  }

  const userId = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;
  const reply = `■自動要約: \n${summary}`;
  return postNote({ userId, text: reply, token, karteApiClientForCraftTypeApp });
}
