const LOG_LEVEL = '<% LOG_LEVEL %>';
const WHATSAPP_ACCESS_TOKEN_SECRET = '<% WHATSAPP_ACCESS_TOKEN_SECRET %>';
const PHONE_NUMBER_ID_SECRET = '<% PHONE_NUMBER_ID_SECRET %>';

// Cloud APIエラーコード
// https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/
const ERROR_CODE = {
  API_SERVICE: 2,
  RATE_LIMIT_HIT: 130429,
};

function makeMessageData(phoneNumber) {
  return {
    messaging_product: 'whatsapp',
    to: phoneNumber, // 受信者の電話番号（国番号を含む）
    type: 'template',
    template: {
      // 送信したいTemplate Messagesの仕様に合わせて変更してください
      // https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/
      name: 'hello_world', // 任意のテンプレートメッセージ名
      language: {
        code: 'en_US',
      },
    },
  };
}

async function postMessaage(
  whatsappAccessToken,
  phoneNumberId,
  messageData,
  logger,
  RetryableError
) {
  const apiUrl = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  // メッセージ送信
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  });

  // エラー内容に応じてRetryableErrorを用いたリトライを実装することをおすすめします。
  const responseData = await response.json();
  if (!response.ok) {
    const errorCode = responseData.error.code;
    const errorMessage = responseData.error.message;

    switch (errorCode) {
      case ERROR_CODE.API_SERVICE:
      case ERROR_CODE.RATE_LIMIT_HIT:
        logger.error(
          `一時的なエラーが発生しました(${response.status})。エラーコード:${errorCode}。再試行します。`
        );
        throw new RetryableError(errorMessage);
      default:
        logger.error(
          `エラーが発生しました(${response.status})。エラーコード:${errorCode}:`,
          errorMessage
        );
        throw new Error('予期せぬエラーが発生しました');
    }
  }

  logger.debug('メッセージ送信成功:', responseData);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  // アクセストークンと送信元の電話番号IDを取得
  const secrets = await secret.get({
    keys: [WHATSAPP_ACCESS_TOKEN_SECRET, PHONE_NUMBER_ID_SECRET],
  });
  const whatsappAccessToken = secrets[WHATSAPP_ACCESS_TOKEN_SECRET];
  const phoneNumberId = secrets[PHONE_NUMBER_ID_SECRET];

  // メッセージデータの準備
  const phoneNumber = JSON.stringify(data.jsonPayload.data.value);
  const messageData = makeMessageData(phoneNumber);

  // メッセージを送信
  postMessaage(whatsappAccessToken, phoneNumberId, messageData, RetryableError);
}
