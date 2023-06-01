import api from 'api';
import { parseISO } from 'date-fns';
import { google } from 'googleapis';

/**********************************************
 * 管理者向け設定
 **********************************************/

// スケジューラーで管理する対象の接客ID
const TARGET_CAMPAIGNS = [
    'xxxxxxxxxxxxxxxxxxxxxxxx',
    'yyyyyyyyyyyyyyyyyyyyyyyy',
];

// カレンダーID
const CALENDAR_ID = 'x_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com'

/**********************************************
 * 各種処理
 **********************************************/

// Google Calendar API を実行するSAに付与するスコープ
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// UTCからの時差
const HOUR_DELTA = 9; // JST

// 時差分を加えた時刻を返す
function getOffsetDate(date, hourDelta) {
    const delta = 1000 * 60 * 60 * hourDelta; // msec
    return new Date(date.getTime() + delta);
}

function getDateString(date) {
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

/**
 * 現在日時が祝日であるかをチェックし、on_holidayに基づき接客の公開判定を行う。
 * 祝日でない場合は常にtrueを返す。
 * @param {{date: Date, holidays: string[], on_holiday:string}} param0 現在日時、祝日一覧、祝日時の挙動からなるオブジェクト
 * @returns {boolean} 接客の公開(true), 非公開(false) を返す
 */
function isEnable({ date, holidays, on_holiday = 'enable' }) {
    const currentDateString = getDateString(date);
    if (!holidays.includes(currentDateString)) {
        // 祝日でなければそもそもチェック不要
        return true;
    }
    return on_holiday === 'enable'; // ここで初めてon_holidayを見る
}

/**
 * 祝日一覧CSVから祝日情報を文字列として取得する
 * @param {Object} logger logger module
 * @returns {Promise<string[]>} 祝日（'YYYY-MM-DD'）の配列
 */
async function getHolidays(logger) {
    const HOLIDAYS_LIST_URL = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';
    const res = await fetch(HOLIDAYS_LIST_URL, {
        method: 'GET',
        headers: {
            Accept: 'text/csv',
        },
    });

    if (res.status !== 200) {
        logger.error(res);
        throw new Error('cannot get holidays data.');
    }

    // 祝日一覧のCSVから日時情報のみの一覧を取得する
    return (await res.text())
        .split('\n')
        .slice(1)
        .map(line => line.split(',')[0]);
}

/**
 * googleapisのJWTクライアントを取得する
 * @param {Object} credentials サービスアカウントの鍵情報 (JSON parse済み)
 * @returns {Object} googleapiの認証に使うJWTトークン
 */
function getJwtClient(credentials) {
    return new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        SCOPES,
    );
}

/**
 * カレンダーイベントのdescriptionをパースして、campaign_idとon_holidayを取得する
 * @param {string} description カレンダーイベントのdescription
 * @param {Object} logger logger module
 * @returns {{ campaign_id: string, on_holiday?: string }} campaign_idとon_holidayの組み合わせ
 */
function validateEventDescriptionAndConvertToCampaignSetting(description, logger) {
    let parsedDescription;
    try {
        parsedDescription = JSON.parse(description);
    } catch (err) {
        logger.error('description is not json format: ', description);
        throw err;
    }

    const { campaign_id, on_holiday } = parsedDescription;
    if (campaign_id == null) {
        throw new Error('campaign_id is required');
    }
    if (on_holiday != null && !["enable", "disable"].includes(on_holiday)) {
        throw new Error('on_holiday must be enabled or disabled');
    }

    return { campaign_id, on_holiday };
}


/**
 * Google Calendar API を使って接客スケジュールを取得する
 * @param {Object} calendar Google Calendar クライアント
 * @param {Object} logger logger module
 * @returns {Promise<{ campaign_id: string, on_holiday?: string }[]>} 接客IDと祝日設定の配列
 */
async function getCampaignSchedule(calendar, logger) {
    const datetimeNow = (new Date()).toISOString();

    const res = await calendar.events.list({
        calendarId: CALENDAR_ID,
        // endDateTime の最小値を現在時刻に設定することで、未来に終了するイベントのみを取得する
        // timeMaxで過去に開始したイベントを取得することもできるが、timeMin, timeMaxの両方は指定できなかったため、
        // 後続処理で過去に開始したイベントのみに絞り込んでいる
        timeMin: (new Date(datetimeNow)).toISOString(),
        maxResults: 50, // 50件以上のカレンダーイベントを想定する場合はこの値を増やす必要がある
        singleEvents: true,
        orderBy: 'startTime',
    });

    // 接客設定を取得する
    // 過去に開始したイベントのみを対象にする
    // 過去に開始して未来に終了するイベント = 現在継続中のイベント
    const events = res.data.items.filter(item => parseISO(item.start.dateTime).getTime() <= new Date(datetimeNow).getTime())
    const settings = events.map(event => {
        try {
            return validateEventDescriptionAndConvertToCampaignSetting(event.description, logger)
        } catch (err) {
            logger.error(err);
            return;
        }
    }).filter(v => v != null);

    return settings;
}

export default async function (data, { MODULES }) {
    const { logger, secret } = MODULES;

    // 現在時刻と祝日一覧を取得する
    const currentDatetimeJST = getOffsetDate(new Date(), HOUR_DELTA);
    const holidays = await getHolidays(logger);

    const { KARTE_API_TOKEN: token, GOOGLE_CALENDAR_CREDENTIALS: rowCredentials } = await secret.get({
        keys: ['KARTE_API_TOKEN', 'GOOGLE_CALENDAR_CREDENTIALS'],
    });

    // 接客APIクライアント
    const action = api('@dev-karte/v1.0#hf33ldnvhh4c');
    action.auth(token);

    // Google Calendar API クライアント
    const credentials = JSON.parse(rowCredentials);
    const jwtClient = getJwtClient(credentials);
    const calendar = google.calendar({
        version: 'v3',
        auth: jwtClient,
    });

    // カレンダーイベントから起動対象の接客スケジュールを取得する
    const enabledCampaignSettings = await getCampaignSchedule(calendar, logger);

    // カレンダーイベントに含まれている接客の公開・非公開を切り替える
    await Promise.allSettled(
        TARGET_CAMPAIGNS.map(async campaignId => {

            // TARGET_CAMPAIGNS に含まれており、かつ、カレンダーイベントに含まれていない場合は非公開にする
            const setting = enabledCampaignSettings.find(setting => setting.campaign_id === campaignId);
            if (setting == null) {
                await action.postV2betaActionCampaignToggleenabled({
                    id: campaignId,
                    enabled: false,
                });
                logger.log(`campaign: ${campaignId} has been changed to disable.`);
                return;
            }

            const enabled = isEnable({ date: currentDatetimeJST, holidays, on_holiday: setting.on_holiday });
            await action.postV2betaActionCampaignToggleenabled({
                id: campaignId,
                enabled,
            });
            logger.log(
                `dateString: ${getDateString(currentDatetimeJST)}, time: ${currentDatetimeJST.toISOString()}, campaign: ${campaignId
                }, enabled: ${enabled}`,
            );
        })
    )
}

