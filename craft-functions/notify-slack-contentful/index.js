import { JSDOM } from 'jsdom';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const NOTIFY_MESSAGE = '<% NOTIFY_MESSAGE %>';
const DEF_SUPPORT_IO_RELEASE_NOTE_URL = 'https://support.karte.io/release-notes/';

const SLACK_WEBHOOK_URL = 'xxxxxxxx';


async function getOgImage(logger, url) {
  try {
    // 指定されたURLからHTMLを取得
    const response = await fetch(url);
    const html = await response.text();

    // jsdomを使用してHTMLを解析
    const dom = new JSDOM(html);
    const { document } = dom.window;

    // OGPタグを返却
    const ogImageUrl = document.querySelector('meta[property="og:image"]').content;
    logger.debug('url', url);
    logger.debug('ogImageUrl', ogImageUrl);
    return ogImageUrl;
  } catch (error) {
    logger.error('Get OGP failed', error);
  }
}

async function createPost(logger, contentful) {
  logger.debug('createPost start');
  const ogImageUrl = await getOgImage(logger, DEF_SUPPORT_IO_RELEASE_NOTE_URL + contentful.entrySys.id);
  const slackMessage = JSON.stringify(
    {
      'blocks': [
        {
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': NOTIFY_MESSAGE
          }
        },
        {
          'type': 'image',
          'image_url': ogImageUrl,
          'alt_text': 'Relase note image'
        }
      ]
    }
  );
  logger.debug('slackMessage', slackMessage);
  return slackMessage;
}

async function notificateSlack(logger, targetSlackWebhook, slackMessage) {
  logger.debug('notificateSlack start');
  try {
    const res = await fetch(targetSlackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: slackMessage
    }
    );
    logger.debug('POST slack webhook. Response is: ', res);
  } catch (e) {
    logger.error('post slack error', e);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  logger.debug('start');
  const contentful = data.jsonPayload.data.hook_data.body;
  if (!contentful) {
    logger.error('contentful paylodが空です。');
    return;
  }
  try {
    logger.debug('target webhook', SLACK_WEBHOOK_URL);
    await notificateSlack(logger, SLACK_WEBHOOK_URL, await createPost(logger, contentful));
  } catch (e) {
    logger.error(e);
  }
}
