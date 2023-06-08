import api from 'api';

export default async function (data, { MODULES }) {
  const { logger, secret } = MODULES;
  const { KARTE_API_TOKEN: token } = await secret.get({ keys: ["KARTE_API_TOKEN"] });
  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(token);
  const CHATGPT_API_KEY = '{{CHATGPT_API_KEY}}';
  const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const SENDER_ID = '{{SENDER_ID}}';

  var user_id = data.jsonPayload.data.user_id;
  if (!user_id) {
    user_id = data.jsonPayload.data.visitor_id;
  }

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
  logger.log(body);

  const res_talk = await talk.postV2TalkMessageSendfromoperator({
    content: {
      text: body.choices[0].message.content
    },
    user_id: user_id,
    sender_id: SENDER_ID
  });
  logger.log(await res_talk.json());
}