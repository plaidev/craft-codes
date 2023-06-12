import api from 'api';

export default async function (data, { MODULES }) {
  // const { logger } = MODULES;
  const { secret } = MODULES;
  const { KARTE_API_TOKEN: token } = await secret.get({ keys: ["KARTE_API_TOKEN"] });
  const talk = api('@dev-karte/v1.0#br7wylg4sjwm0');
  talk.auth(token);
  const CHATGPT_API_KEY = '{{CHATGPT_API_KEY}}';
  const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const SENDER_ID = '{{SENDER_ID}}';

  if (!data.jsonPayload.data.content.text.startsWith(`教えてGPT：`)) {
    logger.log('keyword not included');
    return;
  }

  var user_id = data.jsonPayload.data.user_id ?? data.jsonPayload.data.visitor_id;

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
        content: data.jsonPayload.data.content.text.slice(7)
      }]
    }),
  });

  const body = await res_chatgpt.json();
  // logger.log(body);

  const res_note = await talk.postV2betaTalkNoteSend({
    content: {
      text: 'ChatGPTの回答:' + body.choices[0].message.content
    },
    user_id: user_id,
    sender: {
      id: SENDER_ID,
      is_bot: true
    }
  })
  // logger.log(res_note);
}