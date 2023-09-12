import api from "api";
import { WebClient } from '@slack/web-api';

/* KARTE API V2 Setting - ACCESS TOKEN */
const SECRET_KEY_API = "KOHA_API_KEY_ANYTHING";

/* Slack App - Bot User OAuth Token */
const SECRET_KEY_SLACK = "SLACK_TOKEN_KOHA_CRAFT_TRIGGER";

/* KARTE Action URL */
const PROJECT_ID = "633e9007f91a8d00128f31e7";
const URL_KARTE = "https://admin.karte.io/p/";
const URL_SUFFIX= "/service/";

const LOG_LEVEL = 'DEBUG';
const MESSAGE_PROCESSING = "接客情報を取得しています...";
const MESSAGE_DESCRIPTION_CHANGE_CAMPAIGN_STATUS = "以下の接客について公開状態を変更できます。\n";
const MESSAGE_CAMPAIN_NAME = "接客サービス名： ";
const MESSAGE_NOW_CAMPAIGN_STAUTS_ENABLED = "現在： `公開中or公開予約中` "
const MESSAGE_NOW_CAMPAIGN_STAUTS_DISABLED = "現在： `停止中` ";
const MESSAGE_ERROR_PARSE_PAYLOAD = "Payload読み込みに失敗しました。:";
const MESSAGE_SEND_SLACK = {
    SUCCESS: "Slackに通知が送信されました: ",
    FAILURE: "Slackへの通知送信に失敗しました: "
}
const MESSAGE_ERROR_HEADER = " `接客情報を取得する際にエラーが発生しました。接客IDが正しいかご確認ください。` ";
const MESSAGE_ERROR_HEADER_NO_ID = " `接客IDが入力されていません。スラッシュコマンドの後ろに接客IDを入力してください。` ";
const MESSAGE_INVALID = {
    CHANNEL_ID: "チャンネルID",
    CAMPAIGN_ID: "接客ID",
    CAMPAIGN_NAME: "接客名",
    CAMPAIGN_ENABLED: "接客ステータス",
    SUFFIX: "が正しく取得できませんでした。"
}

function validateData (data, errorMessages, logger, slackToken) {
    for (const [key, errorMessage] of Object.entries(errorMessages)) {
        if (!data[key]) {
            if (key === 'campaignId') {
                postSlackErrorMessage(logger, slackToken, data['channelId'], MESSAGE_ERROR_HEADER_NO_ID);
            }
            if (key === 'isNowEnabled' && typeof data[key] === 'boolean') {
                continue;
            }
            throw new Error(key,errorMessage);
        }
    }
}

function parseArgumentPayload (logger, data, slackToken) {
    let payloadFromSlack;
    try {
        payloadFromSlack = JSON.parse(JSON.stringify(data.jsonPayload.data.hook_data.body));
    } catch (error) {
        logger.error(MESSAGE_ERROR_PARSE_PAYLOAD, error);
        throw error;
    }

    const {
        channel_id: channelId,
        text: campaignId
    } = payloadFromSlack;

    validateData({
        channelId,
        campaignId
    }, {
        channelId: MESSAGE_INVALID.CHANNEL_ID.SUFFIX,
        campaignId: MESSAGE_INVALID.CAMPAIGN_ID.SUFFIX
    }, logger, slackToken);
    return {
        channelId,
        campaignId
    }
}

function parseCampaignInfo (campaign) {
    const {
        enabled: isNowEnabled,
        id: campaignId,
        title: campaignName
    } = campaign.data;

    validateData({
        isNowEnabled,
        campaignId,
        campaignName
    }, {
        isNowEnabled: MESSAGE_INVALID.CAMPAIGN_ENABLED.SUFFIX,
        campaignId: MESSAGE_INVALID.CAMPAIGN_ID.SUFFIX,
        campaignName: MESSAGE_INVALID.CAMPAIGN_NAME.SUFFIX
    });
    return {
        isNowEnabled,
        campaignId,
        campaignName
    }
}

async function fetchCampaign (token, campaignId) {
    const action = api('@dev-karte/v1.0#1ehqt16lkm2a8jw');
    action.auth(token);
    return await action.postV2betaActionCampaignFindbyid({ id: campaignId })
}

function getSlackMessage (channelId, campaign) {
    const statusMessage = `${MESSAGE_DESCRIPTION_CHANGE_CAMPAIGN_STATUS}${campaign.isNowEnabled
        ? MESSAGE_NOW_CAMPAIGN_STAUTS_ENABLED
        : MESSAGE_NOW_CAMPAIGN_STAUTS_DISABLED
        }`;

    const message = {
        "channel": channelId,
        "attachments": [
            {
                "fallback": campaign.campaignName,
                "callback_id": campaign.campaignId
            }
        ],
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": statusMessage
                }
            },
            { "type": "divider" },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": MESSAGE_CAMPAIN_NAME + campaign.campaignName
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "公開する"
                        },
                        "style": "primary",
                        "value": "campaign_enabled",
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "確認"
                            },
                            "text": {
                                "type": "plain_text",
                                "text": "接客を公開して良いですか？"
                            },
                            "confirm": {
                                "type": "plain_text",
                                "text": "公開する"
                            },
                            "deny": {
                                "type": "plain_text",
                                "text": "キャンセル"
                            }
                        }
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "停止する"
                        },
                        "style": "danger",
                        "value": "campaign_disabled",
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "確認"
                            },
                            "text": {
                                "type": "plain_text",
                                "text": "接客を停止して良いですか？"
                            },
                            "confirm": {
                                "type": "plain_text",
                                "text": "停止する"
                            },
                            "deny": {
                                "type": "plain_text",
                                "text": "キャンセル"
                            }
                        }
                    }
                ]
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
                    "text": URL_KARTE+PROJECT_ID+URL_SUFFIX+campaign.campaignId
                }
            }
        ]
    };
    return message;
}

async function postSlackPreMessage(logger, slackClient, channelId) {
    try {
        await slackClient.chat.postMessage({
            "channel": channelId,
            "text": MESSAGE_PROCESSING
        });
    } catch (error) {
        logger.error(MESSAGE_SEND_SLACK.FAILURE, error);
        throw error;
    }
}

async function postSlack(logger, slackClient, channelId, campaign) {
    let result
    result = await slackClient.chat.postMessage(getSlackMessage(channelId, campaign));
    logger.log(MESSAGE_SEND_SLACK.SUCCESS, result);
}

async function postSlackErrorMessage(logger, slackClient, channelId, header, error) {
    try {
        const result = await slackClient.chat.postMessage({
            "channel": channelId,
            "text": header + `${error}`
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
    const slackClient = new WebClient(slackToken);

    const slackArgument = parseArgumentPayload(logger, data, slackClient);

    /* 処理中の旨を送信 */
    await postSlackPreMessage(logger, slackClient, slackArgument.channelId);

    try {
        /* KARTE API Kick(接客取得) */
        const campaign = parseCampaignInfo(
            await fetchCampaign(karteApiToken, slackArgument.campaignId));

        /* Slackへ投稿 */
        await postSlack(logger, slackClient, slackArgument.channelId, campaign);

    } catch (error) {
        await postSlackErrorMessage(logger, slackClient, slackArgument.channelId, MESSAGE_ERROR_HEADER, error);
        logger.error(error);
        return;
    }

}
