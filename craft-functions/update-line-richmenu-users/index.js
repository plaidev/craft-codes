const LOG_LEVEL = '<% LOG_LEVEL %>';
const LINE_ACCESS_TOKEN_SECRET = '<% LINE_ACCESS_TOKEN_SECRET %>';
const LINK_ENDPOINT = 'https://api.line.me/v2/bot/richmenu/bulk/link';
const UNLINK_ENDPOINT = 'https://api.line.me/v2/bot/richmenu/bulk/unlink';

function parseDataFromPayload(valueString) {
  const parts = valueString.split(',');
  if (parts.length < 4) {
    throw new Error(`データの形式が不正です。要素数が4未満です: ${valueString}`);
  }

  const parsedObject = {
    richMenuId: parts[0],
    operation: parts[1],
    batchId: parts[2],
    userIds: parts[3],
  };

  return parsedObject;
}

async function fetchLineToken(secret) {
  const secrets = await secret.get({ keys: [LINE_ACCESS_TOKEN_SECRET] });
  const lineToken = secrets[LINE_ACCESS_TOKEN_SECRET];
  if (!lineToken) {
    throw new Error(`シークレット "${LINE_ACCESS_TOKEN_SECRET}" が見つかりません。`);
  }
  return lineToken;
}

function createApiRequest(operation, richMenuId, userIds) {
  const userIdsArray = userIds.split('|');

  if (operation === 'LINK') {
    return {
      endpoint: LINK_ENDPOINT,
      body: { richMenuId, userIds: userIdsArray },
    };
  }
  if (operation === 'UNLINK') {
    return {
      endpoint: UNLINK_ENDPOINT,
      body: { userIds: userIdsArray },
    };
  }
  throw new Error(`未定義の操作 "${operation}" が指定されました。`);
}

async function executeLineApiCall(endpoint, body, lineToken, RetryableError) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status >= 500 || response.status === 429) {
      throw new RetryableError(
        `APIがリトライ可能なエラーを返しました (ステータス: ${response.status})`
      );
    }
    const errorText = await response.text();
    throw new Error(`APIがエラーを返しました (ステータス: ${response.status})。詳細: ${errorText}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const valueString = data.jsonPayload.data.value;
    if (!valueString) {
      throw new Error('処理対象のデータ（jsonPayload.data.value）が存在しません。');
    }

    const batchData = parseDataFromPayload(valueString);
    const lineToken = await fetchLineToken(secret);
    const { endpoint, body } = createApiRequest(
      batchData.operation,
      batchData.richMenuId,
      batchData.userIds
    );

    await executeLineApiCall(endpoint, body, lineToken, RetryableError);

    logger.log(`バッチ処理が正常に完了しました。`, {
      operation: batchData.operation,
      batchId: batchData.batchId,
    });
  } catch (e) {
    if (e instanceof RetryableError) {
      logger.warn(e.message);
      throw e;
    }
    logger.error('予期せぬエラーが発生しました。', { error: e.message });
    throw e;
  }
}
