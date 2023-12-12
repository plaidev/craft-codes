const TARGET_URL = '<% TARGET_URL %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

function postLineWebhook(url, signature, body) {
  const options = {
    method: 'POST',
    headers: {
      'x-line-signature': signature,
      'Content-Type': 'application/json',
    },
    body,
  };
  return fetch(url, options);
}

export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/track-hook') {
    logger.log(`invalid function trigger: ${data.kind}`);
    return;
  }

  // ヘッダに含まれるLINE側の署名情報を取得
  const signature = data.jsonPayload.data.headers['x-line-signature'];

  // LINEから送られたリクエストbodyを取得
  const _body = data.jsonPayload.data.body;

  if (!signature || !_body) return;

  const body = JSON.stringify(_body);
  const res = await postLineWebhook(TARGET_URL, signature, body);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed with status ${res.status}: ${txt}`);
  }
  logger.debug(`Request succeeded.`);
  return;
}
