import sgMail from '@sendgrid/mail';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SENDGRID_API_KEY_SECRET = '<% SENDGRID_API_KEY_SECRET %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({ keys: [SENDGRID_API_KEY_SECRET] });
  const token = secrets[SENDGRID_API_KEY_SECRET];
  sgMail.setApiKey(token);

  const {
    email_to: to,
    email_from: from,
    mail_title: subject,
    mail_text: text,
    mail_html: html,
  } = data.jsonPayload.data;

  const message = {
    to, // 受信者のメールアドレス
    from, // 送信者のメールアドレス
    subject, // メールのタイトル
    text, // メールのテキスト本文
    html, // メールのHTML本文
  };

  try {
    await sgMail.send(message);
    logger.info('メール送信に成功しました。');
  } catch (error) {
    logger.error('メール送信に失敗しました。', error);
  }
}
