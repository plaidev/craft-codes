import { WebClient } from '@slack/web-api';
import api from "api";

/* KARTE API V2 Setting - ACCESS TOKEN */
const SECRET_KEY_API = "";

/* Slack App - Bot User OAuth Token */
const SECRET_KEY_SLACK = "";

/* KARTE Action URL */
const PROJECT_ID = "";

const URL_KARTE = "https://admin.karte.io/p/";
const URL_SUFFIX= "/service/";

const LOG_LEVEL = 'DEBUG';
const MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT = {
    PREFIX: "以下接客を",
    ACTIVATE: "公開しました。\n",
    INACTIVATE: "停止しました。\n",
    CAMPAIN_NAME : "接客サービス名： ",
    SUFFIX: "※KARTE反映まで若干のラグがある場合があります。"
}
const MESSAGE_SEND_SLACK = {
    SUCCESS: "Slackに通知が送信されました: ",
    FAILURE: "Slackへの通知送信に失敗しました: "
}
const MESSAGE_ERROR_PARSE_PAYLOAD = "Payload読み込みに失敗しました。:";
const MESSAGE_KICK_KARTE_API_SUCCESS = "KARTE APIを正常に実行しました。接客ステータスを変更しました。";
const MESSAGE_RETURN_VALUE_NOT_MATCH_ANY_ACTION = "予期せぬ値がSlackより返されたため変更結果の判定ができませんでした。";
const MESSAGE_ERROR_HEADER = " `接客ステータスの変更時にエラーが発生しました。` ";
const MESSAGE_INVALID = {
    CHANNEL_ID: "チャンネルID",
    CAMPAIGN_ID: "接客ID",
    CAMPAIGN_NAME: "接客名",
    CAMPAIGN_ENABLED: "接客ステータス",
    MESSAGE_TS: "SLACKメッセージタイムスタンプ",
    ACTION_KIND: "ボタンの操作結果",
    SUFFIX: "が正しく取得できませんでした。"
}

function validateData (data, errorMessages) {
    for (const [key, errorMessage] of Object.entries(errorMessages)) {
        if (!data[key]) {
            throw new Error(errorMessage);
        }
    }
}

function parseArgumentPayload (logger, data) {
    let payloadFromSlack;
    try {
        payloadFromSlack = JSON.parse(data.jsonPayload.data.hook_data.body.payload);
    } catch (error) {
        logger.error(MESSAGE_ERROR_PARSE_PAYLOAD, error);
        throw error;
    }

    const {
        container: {channel_id: channelId, message_ts},
        message: {attachments: [{fallback:campaignName, callback_id: campaignId}]},
        actions: [{value: action_kind}]
    } = payloadFromSlack;

    try {
        validateData({
            channelId,
            message_ts,
            campaignId,
            campaignName,
            action_kind
        }, {
            channelId: MESSAGE_INVALID.CHANNEL_ID.SUFFIX,
            message_ts: MESSAGE_INVALID.MESSAGE_TS.SUFFIX,
            campaignId: MESSAGE_INVALID.CAMPAIGN_ID.SUFFIX,
            campaignName: MESSAGE_INVALID.CAMPAIGN_NAME.SUFFIX,
            action_kind: MESSAGE_INVALID.ACTION_KIND.SUFFIX,
        });
    } catch (error) {
        logger.error(error);
    }

    return {
        action_kind,
        slackMessageParts: {
            channelId,
            message_ts,
            campaignId,
            campaignName
        }
    }
}

function judgeEnabled (logger, action_kind) {
    let isCampaignEnabled;
    switch (action_kind) {
        case "campaign_enabled":
            isCampaignEnabled = true;
            break;
        case "campaign_disabled":
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
    await action.postV2betaActionCampaignToggleenabled({ enabled: isCampaignEnabled, id: campaignId });
    logger.log(MESSAGE_KICK_KARTE_API_SUCCESS);
}

function getSlackMessage (slackMessageParts, isCampaignEnabled) {
    const textMessage = `${MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.PREFIX}${isCampaignEnabled
        ? MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.ACTIVATE
        : MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.INACTIVATE
        }${MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.SUFFIX}`;

    const message = {
        "channel": slackMessageParts.channelId,
        "ts": slackMessageParts.message_ts,
        "attachments": [
            {
                "id": 1,
                "fallback": "接客ステータス変更",
                "callback_id": slackMessageParts.campaignId
            }
        ],
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": textMessage
                }
            },
            {
                "type": "divider",
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": MESSAGE_CHANGE_CAMPAIGN_STATUS_RESULT.CAMPAIN_NAME + slackMessageParts.campaignName
                }
            },
            { "type": "divider" },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "接客サービスURL："
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": URL_KARTE+PROJECT_ID+URL_SUFFIX+slackMessageParts.campaignId
                }
            }
        ]
    }

    return message;
}

async function updateSlackMessage(logger, token, slackMessageParts, isCampaignEnabled) {
    const slackClient = new WebClient(token);
    const result = await slackClient.chat.update(getSlackMessage(slackMessageParts, isCampaignEnabled, false));
    logger.log(MESSAGE_SEND_SLACK.SUCCESS, result);
}

async function postSlackErrorMessage(logger, token, slackMessageParts, error) {
    try {
        const slackClient = new WebClient(token);
        const result = await slackClient.chat.postMessage({
            "channel": slackMessageParts.channelId,
            "ts": slackMessageParts.message_ts,
            "text": MESSAGE_ERROR_HEADER + `${error}`
        });
        logger.log(MESSAGE_SEND_SLACK.SUCCESS, result);
    } catch (error) {
        logger.error(MESSAGE_SEND_SLACK.FAILURE, error);
        return;
    }
}

export default async function (data, { MODULES }) {
    const { initLogger, secret } = MODULES;
    const logger = initLogger({ logLevel: LOG_LEVEL });
    if (data.kind !== "karte/track-hook") return;

    const tokens = await secret.get({
        keys: [
            SECRET_KEY_API,
            SECRET_KEY_SLACK
        ],
    });
    const karteApiToken = tokens[SECRET_KEY_API];
    const slackToken = tokens[SECRET_KEY_SLACK];

    const payloadFromSlack = parseArgumentPayload(logger, data);

    try {
        /* 公開or停止判定 */
        const isCampaignEnabled = judgeEnabled(logger, payloadFromSlack.action_kind);

        /* KARTE API Kick(接客ステータス変更) */
        await actionCampaignToggleenabled(logger, karteApiToken, payloadFromSlack.slackMessageParts.campaignId, isCampaignEnabled);

        /* Slackへ結果を返す */
        await updateSlackMessage(logger, slackToken, payloadFromSlack.slackMessageParts, isCampaignEnabled);

    } catch (error) {
        await postSlackErrorMessage(logger, slackToken, payloadFromSlack.slackMessageParts, error);
        logger.error(error);
        return;
    }

}
