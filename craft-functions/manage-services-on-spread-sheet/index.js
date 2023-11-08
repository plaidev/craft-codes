import api from "api";
const sdk = api('@dev-karte/v1.0#<% SDK_SUFFIX %>');
const LOG_LEVEL = '<% LOG_LEVEL %>';
const daysMapping = {
  "日": 0,
  "月": 1,
  "火": 2,
  "水": 3,
  "木": 4,
  "金": 5,
  "土": 6
};

function convertToDistDaysAndHours(startDay, startTime, endDay, endTime) {
  // 曜日と時間をUnixタイムのオフセットに変換
  const [startHour, startMin] = startTime.split(':');
  const [endHour, endMin] = endTime.split(':');
  const startOffset = (daysMapping[startDay] * 24 * 60 + parseInt(startHour) * 60 + parseInt(startMin)) * 60;
  const endOffset = (daysMapping[endDay] * 24 * 60 + parseInt(endHour) * 60 + parseInt(endMin)) * 60;

  // 結果をオブジェクトとして返す
  return {
    start: startOffset,
    end: endOffset
  };
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({logLevel: LOG_LEVEL});
  logger.debug(data.jsonPayload.data.hook_data.body);
  const {
    campaignId,
    isActive,
    startDate,
    endDate,
    repeatDays,
    repeats,
  } = data.jsonPayload.data.hook_data.body;

  const {<% API_TOKEN_SECRET_KEY %>: api_token} = await secret.get({keys: ['<% API_TOKEN_SECRET_KEY %>']})
  sdk.auth(api_token);

  const query = {
    dist_days_and_hours: [],
  };
  if(isActive) query.enabled = isActive === '有効';
  if(startDate) query.start_date = startDate;
  if(endDate) query.end_date = endDate;

  if(repeats.length)
    repeats.forEach(repeatObj=>{
      repeatDays.split(',').forEach(day=>{
        query.dist_days_and_hours.push(convertToDistDaysAndHours(day, repeatObj.startTime, day, repeatObj.endTime))
      })
      
    })

  logger.debug(query);
  const ret = await sdk.postV2alphaActionCampaignUpdate({
    id: campaignId,
    query,
  });
  logger.debug(ret);
}