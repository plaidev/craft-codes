const LOG_LEVEL = 'WARN';
const MODEL = 'gpt3.5';
const CHAT_SENDER_ID = '';
const CRAFT_SPEC_URI = '@dev-karte/xxxxxxxxxx';
const TALK_SPEC_URI = '@dev-karte/yyyyyyyyyy';
const CRAFT_APP_TOKEN_SECRET_NAME = '';
const MIN_CHAT_TEXT_LENGTH = '100'; // この文字数以上のチャットメッセージのみ自動要約する

async function fetchSummary({text, token, karteSecureApiClient}) {
  const sdk = karteSecureApiClient({
    token,
    specUri: CRAFT_SPEC_URI,
  });

  const prompt = `次の文章の要点を3点抽出し、それを箇条書きでまとめてください。 "${text}"`;

  const messages = [
    {
      role: 'user',
      content: prompt
    },
  ];
  const { data } = await sdk.postV2alphaCraftOpenaiChatCompletions({
    messages,
    model: MODEL,
    temperature: 0.7,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000
  });
  return data.content;
}

function postNote({user_id, text, token, karteSecureApiClient}) {
  const sdk = karteSecureApiClient({
    token,
    specUri: TALK_SPEC_URI,
  });

  return sdk.postV2betaTalkNoteSend({
    content: {
      text
    },
    user_id: user_id,
    sender: {
      id: CHAT_SENDER_ID,
      is_bot: true
    }
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, karteSecureApiClient } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});

  if (data.kind !== 'karte/apiv2-hook') { 
    logger.warn(`invalid function trigger: ${data.kind}`); 
    return; 
  }

  const userMessage = data.jsonPayload.data.content.text;
  if (userMessage.length < MIN_CHAT_TEXT_LENGTH) {
    logger.debug(`skip: too short message.`); 
    return;
  }

  const secrets = await secret.get({keys: [ CRAFT_APP_TOKEN_SECRET_NAME ]});
  const token = secrets[CRAFT_APP_TOKEN_SECRET_NAME];

  const summary = await fetchSummary({text: userMessage, token, karteSecureApiClient});
  if (summary) {
    logger.debug(`fetchSummary succeeded.`);
  }

  let user_id = data.jsonPayload.data.user_id;
  const visitor_id = data.jsonPayload.data.visitor_id;
  if (!user_id) user_id = visitor_id;

  const reply = `■自動要約: \n${summary}`;
  return postNote({user_id, text: reply, token, karteSecureApiClient});
}
