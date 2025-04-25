import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SLACK_SIGNING_SECRET = '<% SLACK_SIGNING_SECRET %>';
const FUNCTION_ID = '<% FUNCTION_ID %>';

async function isSlackSignatureValid(req, secret, logger) {
  const secretValues = await secret.get({ keys: [SLACK_SIGNING_SECRET] });
  const slackSigningSecret = secretValues[SLACK_SIGNING_SECRET];
  const slackSignature = req.headers['x-slack-signature'];
  const slackRequestTimestamp = Number(req.headers['x-slack-request-timestamp']);
  const hasValidSecret = Boolean(slackSigningSecret);
  const hasRequiredHeaders = Boolean(slackSignature && slackRequestTimestamp);

  if (!hasValidSecret) {
    logger.warn('SlackのSigning Secretが取得できませんでした');
    return false;
  }

  if (!hasRequiredHeaders) {
    logger.warn('Slackからのリクエストのみ受け付けています');
    return false;
  }

  // 以降の処理ではSlack公式の手法に基づきリクエストを検証しています (タイムスタンプ及び署名)。
  // 詳細は下記ドキュメントを参照してください:
  // 参考：https://api.slack.com/authentication/verifying-requests-from-slack

  // 1. タイムスタンプ検証 (リプレイ攻撃対策)
  const requestAge = Math.abs(Math.floor(Date.now() / 1000) - slackRequestTimestamp);
  const isRequestTimely = requestAge <= 300; // (5分以上経過)
  if (!isRequestTimely) {
    logger.warn('リクエストがタイムアウトしました');
    return false;
  }

  // 2. 署名検証 (リクエストの完全性・真正性の確認)
  const baseString = `v0:${slackRequestTimestamp}:${req.rawBody}`;
  const hmac = crypto.createHmac('sha256', slackSigningSecret);
  hmac.update(baseString);
  const computedSignature = `v0=${hmac.digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(slackSignature))) {
    logger.warn('Slackの署名が一致しませんでした');
    return false;
  }
  return true;
}

export default async function (data, { MODULES }) {
  const { initLogger, craftFunctions, secret } = MODULES;
  const { req, res } = data;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  
  // SlackのスラッシュコマンドはPOSTリクエストのみ
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.send('許可されていないHTTPメソッドです');
    return;
  }

  if (!await isSlackSignatureValid(req, secret, logger)) {
    res.send('Slackの署名が無効です');
    return;
  }

  const reqBody = req.body;
  const hasReqBody = Boolean(reqBody);
  if (!hasReqBody) {
    res.send('リクエストのボディが存在しません');
    return;
  }

  const { response_url: responseTargetUrl, command, text: requestText } = reqBody;
  const hasResponseUrl = Boolean(responseTargetUrl);
  if (!hasResponseUrl) {
    res.send('response_urlが取得できませんでした');
    return;
  }

  const hasRequestText = Boolean(requestText);
  if (!hasRequestText) {
    res.send('コマンドの後にテキストを入れてください。例: /command hoge');
    return;
  }

  // Slack側のタイムアウトをエラーを避けるため、別ファンクションを呼び出す前に簡易レスポンスを返す。
  res.send(`コマンドを受け付けました。コマンド:${command} テキスト:${requestText}`);

  try {
    await craftFunctions.invoke({
      functionId: FUNCTION_ID,
      data: { requestText, responseTargetUrl },
    });
  } catch (error) {
    logger.error('error:', error);
  }
}
