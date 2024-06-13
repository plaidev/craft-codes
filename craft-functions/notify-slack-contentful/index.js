import { JSDOM } from 'jsdom';
const LOG_LEVEL = '<% LOG_LEVEL %>';
const DEF_SUPPORT_IO_RELEASE_NOTE_URL = "https://support.karte.io/release-notes/";

//通知を飛ばしたいSlackアプリのIncoming Webhookを配列で持つ。本来はトリガー側でコントロールしたい。
const SLACK_WEBHOOK_URL = [
// Slack webhook URLを代入する
 "xxxxxxxx"
];


async function getOgImage(logger,url){
  try {
    // 指定されたURLからHTMLを取得
    const response = await fetch(url);
    const html = await response.text();

    // jsdomを使用してHTMLを解析
    const dom = new JSDOM(html);
    const { document } = dom.window;

    // OGPタグを返却
    const ogImageUrl = document.querySelector('meta[property="og:image"]').content;
    logger.debug('url',url);
    logger.debug('ogImageUrl',ogImageUrl);
    return ogImageUrl;
  } catch (error) {
    logger.error('Get OGP failed', error);
  }
}

async function createPost(logger, contentful){
  logger.debug('createPost start');
  const ogImageUrl = await getOgImage(logger, DEF_SUPPORT_IO_RELEASE_NOTE_URL + contentful.entrySys.id)
  const slackMessage = JSON.stringify(
     {
        "blocks": [
         {
          "type": "section",
          "text": {
           "type": "mrkdwn",
           "text": "リリースノートが公開されました :tada: \n"
                  + "*<https://support.karte.io/release-notes/" + contentful.entrySys.id + "|" + contentful.title + ">*"
          }
         },
         {
          "type": "image",
          "image_url": ogImageUrl,
          "alt_text": "Relase note image"
         }
        ]
      }
    );
  logger.debug('slackMessage', slackMessage);
  return slackMessage;
}

async function notificateSlack(logger, targetSlackWebhook, slackMessage){
  logger.debug('notificateSlack start');
  try {
    const res = await fetch(targetSlackWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: slackMessage
      }
    );
    logger.ingo('POST slack webhook. Response is: ',res);
  } catch (e) {
    logger.error('post slack error', e);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});
  logger.debug('start');
  const contentful = data.jsonPayload.data.hook_data.body; 
  if(!contentful){
    logger.error('contentful paylodが空です。');
    return;
  }
  try {
      for(let i = 0; i <= SLACK_WEBHOOK_URL.length; i++)  {
        let targetSlackWebhook = SLACK_WEBHOOK_URL[i];
        logger.debug('target webhook', targetSlackWebhook);
        await notificateSlack(logger, targetSlackWebhook, await createPost(logger, contentful));
      } 
  }catch (e){
    logger.error(e);
  }
}
