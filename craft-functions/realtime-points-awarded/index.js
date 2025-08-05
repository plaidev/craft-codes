import { differenceInSeconds } from 'date-fns';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ENDPOINT_URL = '<% ENDPOINT_URL %>';
const FREQUENT_ACQUISITION_ERROR_SECONDS = Number(
  '<% GET_INTERVAL %>'
); // ユーザー状態の保持期間（分）

// アクセス間隔チェック
function isFrequentAcquisition({ pointCampaignAcquisitionDate, logger }) {
  if (!pointCampaignAcquisitionDate) return false;
  const currentDate = new Date();
  const diff = differenceInSeconds(currentDate, new Date(pointCampaignAcquisitionDate), 'floor'); // 端数は切り捨て. 最小値は0になる
  logger.debug(
    `pointCampaignAcquisitionDate: ${pointCampaignAcquisitionDate}, currentDate: ${currentDate.toISOString()}, diff: ${diff}`
  );
  return diff < FREQUENT_ACQUISITION_ERROR_SECONDS;
}

function generateHashedPrefix(key) {
  const hashBase64 = crypto.createHash('sha256').update(key).digest('base64');
  // 辞書順を分散させるためハッシュ値の5〜12文字目を使用
  const prefix = hashBase64.substring(4, 12);
  return prefix;
}

function pointCampaignUserStatusKey({ pointCampaignId, userId }) {
  const key = `${pointCampaignId}_${userId}`;
  const hash = generateHashedPrefix(key);
  return `${hash}_${key}`;
}

async function registUserId({ logger, kvs, pointCampaignId, userId }){
  const key = pointCampaignUserStatusKey({ pointCampaignId, userId });
  const pointCampaignAcquisitionDate = new Date();
  try {
    await kvs.write({
      key,
      value: { point_campaign_acquisition_date: pointCampaignAcquisitionDate },
    });
    logger.debug(
      `updateUserStatus succeeded. key: ${key}, pointCampaigAcquisitionDate: ${pointCampaignAcquisitionDate}`
    );
    return true;
  } catch (error) {
    // エラー時も処理自体は止めず、エラーログ出力だけ行う
    logger.error(
      `updateUserStatus error. pointCampaignId: ${pointCampaignId}, userId: ${userId}, key: ${key}, pointCampaignAcquisitionDate: ${pointCampaignAcquisitionDate}, error: ${error.toString()}`
    );
    return false;
  }  
}

async function checkUserId({ logger, kvs, pointCampaignId, userId }){
  const key = pointCampaignUserStatusKey({ pointCampaignId, userId });
  try {
    // ユーザーチェック
    const v = await kvs.get({ key });
    let pointCampaignAcquisitionDate;
    if (!v || !v[key]) {
      pointCampaignAcquisitionDate = null;
    } else {
      pointCampaignAcquisitionDate =  v[key].value.point_campaign_acquisition_date;
    }
    logger.debug(`fetchUserStatus succeeded. key: ${key}`);
 
    if (
      pointCampaignAcquisitionDate &&
      isFrequentAcquisition({ pointCampaignAcquisitionDate, logger })
    ){
      logger.debug(`Too many request by same user id.`, pointCampaignId, userId);
      return { checkResult : false, errorMessage: 'Too many request by same user id.'};
    }
    return { checkResult : true };
  } catch (error) {
    logger.error(
      `fetchUserStatus error. pointCampaignId: ${pointCampaignId}, userId: ${userId}, key: ${key}, error: ${error.toString()}`
    );
    return { checkResult : false, errorMessage: 'Uknown error.', error};
  }
}


async function fetchPointAPI({ logger, pointCampaignId, userId, point } ){
try {
    await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      /**
       * 以下は例としてポイントキャンペーンID、ユーザーID、ポイント数を指定してますが、
       * 連携するAPIに必要なパラメータに置き換えてください。
       * */
      body: JSON.stringify({
        pointRecord: [[pointCampaignId, userId, point]],
      }),
    });
    return true;
  } catch (error) {
    logger.error('Point API fetch error: ', error);
    return false;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, kvs  } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // デバッグモードの時にリクエストの中身をログ出力する
    logger.debug(req.body);
    const { pointCampaignId, userId, point } = req.body;
    // 短時間での連続取得でないかユーザーIDをチェックする
    const { checkResult, errorMessage, error} = await checkUserId({ logger, kvs, pointCampaignId, userId });
    if(!checkResult) {
      return res.json({result: checkResult, errorMessage, error});
    }
    // 異常がなければユーザー登録
    const registRes = await registUserId({ logger, kvs, pointCampaignId, userId });
    if(!registRes){
      return res.json({ result : false, errorMessage: 'KVS registation error.'});
    }

    // ポイント取得リクエスト実行
    const fetchResult = await fetchPointAPI({ logger, res, pointCampaignId, userId, point });

    if(!fetchResult) {
      return res.json({result: fetchResult, errorMessage, error});
    }

  } catch (error) {
    logger.error('Erorr: ', error);
    return res.json({ result: false, error });
  }  
  return res.json({ result: true });

}
