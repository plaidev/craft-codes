import api from 'api';

const CHATGPT_API_KEY = '<% CHATGPT_API_KEY %>';
const SENDER_ID = '<% SENDER_ID %>';
const KARTE_TOKEN_SECRET = '<% KARTE_TOKEN_SECRET %>';

const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export default async function (data, { MODULES }) {
  // const { logger } = MODULES;
  const { secret } = MODULES;
  const secrets = await secret.get({keys: [ KARTE_TOKEN_SECRET ]});
  const token = secrets[KARTE_TOKEN_SECRET];
  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(token);

  const user_id = data.jsonPayload.data.user_id || data.jsonPayload.data.visitor_id;

  const res_chatgpt = await fetch(CHATGPT_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHATGPT_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: data.jsonPayload.data.content.text
      }]
    }),
  });

  const body = await res_chatgpt.json();

  await talk.postV2TalkMessageSendfromoperator({
    content: {
      text: body.choices[0].message.content
    },
    user_id: user_id,
    sender_id: SENDER_ID
  });
}
