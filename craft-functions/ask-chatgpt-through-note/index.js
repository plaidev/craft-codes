import api from 'api';

const CHATGPT_API_KEY = '<% CHATGPT_API_KEY %>';
const SENDER_ID = '<% SENDER_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

export default async function (data, { MODULES }) {
  const { logger, secret } = MODULES;

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];

  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(token);
  const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  if (!data.jsonPayload.data.content.text.startsWith(`教えてGPT：`)) {
    logger.log('keyword not included');
    return;
  }

  const userId = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;

  const res = await fetch(CHATGPT_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHATGPT_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: data.jsonPayload.data.content.text.slice(7),
        },
      ],
    }),
  });

  const body = await res.json();

  await talk.postV2betaTalkNoteSend({
    content: {
      text: `ChatGPTの回答: ${body.choices[0].message.content}`,
    },
    user_id: userId,
    sender: {
      id: SENDER_ID,
      is_bot: true,
    },
  });
}
