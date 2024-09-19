import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const APP_TOKEN_SECRET = '<% APP_TOKEN_SECRET %>';
const TEAMS_INCOMING_WEBHOOK = '<% TEAMS_INCOMING_WEBHOOK %>';
const PROJECT_ID = '<% PROJECT_ID %>';
const URL_KARTE = 'https://admin.karte.io/p/';
const URL_SUFFIX = '/service/';

async function sendTeamsIncomingWebhook(
  logger,
  notificationMessage,
  campaign,
  campaignId,
  campaignUrl
) {
  const title = campaign?.data?.title || '接客プレビュー';

  try {
    const response = await fetch(TEAMS_INCOMING_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              body: [
                {
                  type: 'TextBlock',
                  text: notificationMessage,
                },
                {
                  type: 'TextBlock',
                  text: `接客ID:${campaignId}`,
                },
                {
                  type: 'TextBlock',
                  text: `接客名: ${title}`,
                },
                {
                  type: 'TextBlock',
                  text: `開始日時: ${campaign.data.start_date}`,
                },
                {
                  type: 'TextBlock',
                  text: `終了日時: ${campaign.data.end_date}`,
                },
                {
                  type: 'TextBlock',
                  text: `接客URL: [${campaignUrl}](${campaignUrl})`,
                },
              ],
            },
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    logger.error('Failed to send Teams webhook:', error);
    throw error;
  }

}

async function fetchCampaignInfo(logger, karteApiToken, value) {
  logger.debug('validate id data');
  const [id] = value.split(',');
  const action = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
  action.auth(karteApiToken);
  const campaign = await action.postV2betaActionCampaignFindbyid({
    id,
  });

  const notificationMessage = campaign.data.end_date
    ? 'スケジュール通りに配信開始しました。'
    : 'スケジュール通りに配信停止しました。';

  const campaignUrl = URL_KARTE + PROJECT_ID + URL_SUFFIX + id;

  const campaignId = id;
  return { notificationMessage, campaign, campaignId, campaignUrl };
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const token = await secret.get({ keys: [APP_TOKEN_SECRET], });
  const karteApiToken = token[APP_TOKEN_SECRET];

  if (data.kind === 'karte/jobflow') {
    const { notificationMessage, campaign, campaignId, campaignUrl } = await fetchCampaignInfo(logger, karteApiToken, data.jsonPayload.data.value);
    // メッセージ送信
    logger.debug('fetch teams incomming webhook');
    await sendTeamsIncomingWebhook(
      logger,
      notificationMessage,
      campaign,
      campaignId,
      campaignUrl
    );

    // その他は受けつけない
  } else {
    const errMsg = 'invalid kind. expected: karte/craft-scheduler or karte/jobflow';
    logger.error(new Error(errMsg));
    return errMsg;
  }
}