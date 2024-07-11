import { WebClient } from '@slack/web-api';
import api from 'api';

/* KARTE API V2 Setting - ACCESS TOKEN */
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

/* Slack App - Bot User OAuth Token */
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';

/* KARTE Project ID */
const PROJECT_ID = '<% PROJECT_ID %>';

const LOG_LEVEL = '<% LOG_LEVEL %>';

const URL_KARTE = 'https://admin.karte.io/p/';
const URL_SUFFIX = '/service/';

const MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT = {
  PREFIX: '以下接客を',
  ACTIVATE: '公開しました。\n',
  INACTIVATE: '停止しました。\n',
  CAMPAIN_NAME: '接客サービス名： ',
  SUFFIX: '※KARTE反映まで若干のラグがある場合があります。',
};
const MESSAGE_SEND_SLACK = {
  SUCCESS: 'Slackに通知が送信されました: ',
  FAILURE: 'Slackへの通知送信に失敗しました: ',
};
const MESSAGE_ERROR_PARSE_PAYLOAD = 'Payload読み込みに失敗しました。:';
const MESSAGE_KICK_KARTE_API_SUCCESS =
  'KARTE APIを正常に実行しました。接客ステータスを変更しました。';
const MESSAGE_RETURN_VALUE_NOT_MATCH_ANY_ACTION =
  '予期せぬ値がSlackより返されたため変更結果の判定ができませんでした。';
const MESSAGE_ERROR_HEADER = ' `接客ステータスの変更時にエラーが発生しました。` ';
const MESSAGE_INVALID = {
  CHANNEL_ID: 'チャンネルID',
  CAMPAIGN_ID: '接客ID',
  CAMPAIGN_NAME: '接客名',
  CAMPAIGN_ENABLED: '接客ステータス',
  MESSAGE_TS: 'SLACKメッセージタイムスタンプ',
  ACTION_KIND: 'ボタンの操作結果',
  SUFFIX: 'が正しく取得できませんでした。',
};

function validateData(data, errorMessages) {
  const keys = Object.keys(errorMessages);
  keys.forEach(k => {
    if (!data[k]) {
      throw new Error(errorMessages[k]);
    }
  });
}

function parseArgumentPayload(logger, req) {
  let payloadFromSlack;
  try {
    payloadFromSlack = JSON.parse(req.body.payload);
  } catch (error) {
    logger.error(MESSAGE_ERROR_PARSE_PAYLOAD, error);
    throw error;
  }

  const {
    container: { channel_id: channelId, message_ts: messageTs },
    message: {
      attachments: [{ fallback: campaignName, callback_id: campaignId }],
    },
    actions: [{ value: actionKind }],
  } = payloadFromSlack;

  try {
    validateData(
      {
        channelId,
        messageTs,
        campaignId,
        campaignName,
        actionKind,
      },
      {
        channelId: MESSAGE_INVALID.CHANNEL_ID.SUFFIX,
        messageTs: MESSAGE_INVALID.MESSAGE_TS.SUFFIX,
        campaignId: MESSAGE_INVALID.CAMPAIGN_ID.SUFFIX,
        campaignName: MESSAGE_INVALID.CAMPAIGN_NAME.SUFFIX,
        actionKind: MESSAGE_INVALID.ACTION_KIND.SUFFIX,
      }
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }

  return {
    actionKind,
    slackMessageParts: {
      channelId,
      messageTs,
      campaignId,
      campaignName,
    },
  };
}

function judgeEnabled(logger, actionKind) {
  let isCampaignEnabled;
  switch (actionKind) {
    case 'campaign_enabled':
      isCampaignEnabled = true;
      break;
    case 'campaign_disabled':
      isCampaignEnabled = false;
      break;
    default:
      logger.error(MESSAGE_RETURN_VALUE_NOT_MATCH_ANY_ACTION);
      return undefined;
  }
  return isCampaignEnabled;
}

async function actionCampaignToggleenabled(logger, token, campaignId, isCampaignEnabled) {
  const action = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
  action.auth(token);
  await action.postV2betaActionCampaignToggleenabled({
    enabled: isCampaignEnabled,
    id: campaignId,
  });
  logger.log(MESSAGE_KICK_KARTE_API_SUCCESS);
}

function getSlackMessage(slackMessageParts, isCampaignEnabled) {
  const textMessage = `${MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.PREFIX}${
    isCampaignEnabled
      ? MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.ACTIVATE
      : MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.INACTIVATE
  }${MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.SUFFIX}`;

  const message = {
    channel: slackMessageParts.channelId,
    ts: slackMessageParts.messageTs,
    attachments: [
      {
        id: 1,
        fallback: '接客ステータス変更',
        callback_id: slackMessageParts.campaignId,
      },
    ],
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: textMessage,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.CAMPAIN_NAME + slackMessageParts.campaignName,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '接客サービスURL：',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: URL_KARTE + PROJECT_ID + URL_SUFFIX + slackMessageParts.campaignId,
        },
      },
    ],
  };

  return message;
}

async function updateSlackMessage(logger, token, slackMessageParts, isCampaignEnabled) {
  const slackClient = new WebClient(token);
  const result = await slackClient.chat.update(
    getSlackMessage(slackMessageParts, isCampaignEnabled, false)
  );
  logger.log(MESSAGE_SEND_SLACK.SUCCESS, result);
}

async function postSlackErrorMessage(logger, token, slackMessageParts, error) {
  try {
    const slackClient = new WebClient(token);
    const result = await slackClient.chat.postMessage({
      channel: slackMessageParts.channelId,
      ts: slackMessageParts.messageTs,
      text: `${MESSAGE_ERROR_HEADER}${error}`,
    });
    logger.log(MESSAGE_SEND_SLACK.SUCCESS, result);
  } catch (e) {
    logger.error(MESSAGE_SEND_SLACK.FAILURE, e);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const tokens = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, SLACK_TOKEN_SECRET],
  });
  const karteApiToken = tokens[KARTE_APP_TOKEN_SECRET];
  const slackToken = tokens[SLACK_TOKEN_SECRET];

  const payloadFromSlack = parseArgumentPayload(logger, req);

  try {
    const isCampaignEnabled = judgeEnabled(logger, payloadFromSlack.actionKind);

    await actionCampaignToggleenabled(
      logger,
      karteApiToken,
      payloadFromSlack.slackMessageParts.campaignId,
      isCampaignEnabled
    );

    await updateSlackMessage(
      logger,
      slackToken,
      payloadFromSlack.slackMessageParts,
      isCampaignEnabled
    );

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    await postSlackErrorMessage(logger, slackToken, payloadFromSlack.slackMessageParts, error);
    logger.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}