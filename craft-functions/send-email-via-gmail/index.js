import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const OAUTH2_CLIENT_CREDENTIALS_SECRET = '<% OAUTH2_CLIENT_CREDENTIALS_SECRET %>';
const REFRESH_TOKEN_SECRET = '<% REFRESH_TOKEN_SECRET %>';

function constructEmailContent({ to, subject, textContent, htmlContent }) {
  const boundary = 'boundary'; // 任意の一意の文字列
  const emailLines = [
    `To: ${to}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    textContent,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent,
    '',
    `--${boundary}--`,
  ];
  return emailLines.join('\r\n').trim();
}

function encodeEmailForGmail(email) {
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createEncodedEmail({ to, utf8Subject, textContent, htmlContent }) {
  const email = constructEmailContent({ to, subject: utf8Subject, textContent, htmlContent });
  return encodeEmailForGmail(email);
}

async function sendEmail({ gmail, logger, to, subject, textContent, htmlContent }) {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const raw = createEncodedEmail({ to, utf8Subject, textContent, htmlContent });

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });
    logger.debug('Email sent:', res.data);
  } catch (error) {
    logger.error('Error sending email:', { error });
    throw error;
  }
}

async function getSecrets(secret) {
  return secret.get({
    keys: [OAUTH2_CLIENT_CREDENTIALS_SECRET, REFRESH_TOKEN_SECRET],
  });
}

function parseOAuth2Credentials(credentialData) {
  const credentials = JSON.parse(credentialData);
  return credentials.web;
}

async function initializeOAuthClient(secret) {
  const secrets = await getSecrets(secret);

  const oAuth2CredentialSecretData = secrets[OAUTH2_CLIENT_CREDENTIALS_SECRET];

  const {
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: redirectUris,
  } = parseOAuth2Credentials(oAuth2CredentialSecretData);

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris[0]);

  const refreshToken = secrets[REFRESH_TOKEN_SECRET];

  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  return oAuth2Client;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // validation
  if (data.kind !== 'karte/action') {
    logger.log(`invalid kind ${data.kind}`);
    return;
  }

  logger.debug('Starting email sending process');

  try {
    const oAuth2Client = await initializeOAuthClient(secret);

    logger.debug('Initializing Gmail API client');
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const {
      email_to: to, // 受信者のメールアドレス
      mail_title: subject, // メールのタイトル
      mail_text: text, // メールのテキスト本文
      mail_html: html, // メールのHTML本文
    } = data.jsonPayload.data;

    logger.log('Sending email');
    await sendEmail({ gmail, logger, to, subject, textContent: text, htmlContent: html });
    logger.log('Email sent successfully');
  } catch (error) {
    logger.error('Error in email sending process:', { error });
  }
}
