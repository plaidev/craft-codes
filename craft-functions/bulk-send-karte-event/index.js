import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const TARGET_JOBFLOW_ID = '<% TARGET_JOBFLOW_ID %>';

/* KARTE API V2 Setting - ACCESS TOKEN */
const SECRET_KEY_API = '<% SECRET_KEY_API %>';

function validateIdData(splitData) {
  if (splitData.length !== 2) {
    return `連携するカラム数は2にしてください。連携されたカラム数: ${splitData.length}`;
  }
  const [userId, lineUserId] = splitData;
  if (!userId || userId === '""') {
    return 'user_idに空のレコードが含まれています。';
  }
  if (!lineUserId || lineUserId === '""') {
    return 'line_user_idに空のレコードが含まれています。';
  }
  if (!lineUserId.startsWith('U')) {
    return 'line_user_idが"U"で始まっていません。登録したデータが誤っていないか、また連携するカラムの順序はuser_id,line_user_idとなっているか確認してください。';
  }
  return false;
}

async function executeJobflow(logger, karteApiToken) {
  const datahub = api('@dev-karte/v1.0#d9ni2glia2qxp8');
  datahub.auth(karteApiToken);

  const jobflow = await datahub.postV2DatahubJobflowGet({ jobflow_id: TARGET_JOBFLOW_ID });
  logger.debug(jobflow);

  switch (jobflow.data.status) {
    case 'RUNNING': {
      // 実行中なら中断
      logger.debug('event sending process canceled because job flow is running');
      break;
    }
    case 'READY':
    case 'DONE': {
      // ジョブフロー経由でバルク送信Functionを実行する
      try {
        const res = await datahub.postV2DatahubJobflowExec({ jobflow_id: TARGET_JOBFLOW_ID });
        logger.log(`succeed kick postV2DatahubJobflowExec api: ${res}`);
      } catch (err) {
        logger.error(`error kick postV2DatahubJobflowExec api: ${err}`);
        throw err;
      }
      break;
    }
    default:
      logger.error('unexpected jobflow status');
  }
}

async function sendEvent(logger, karteApiToken, value) {
  logger.debug('validate id data');
  const splitData = value.split(',');

  const error = validateIdData(splitData);
  if (error) {
    logger.error(error);
    return;
  }

  const [userId, lineUserId] = splitData;

  const insight = api('@dev-karte/v1.0#e00ojitlkrqw8qf');
  insight.auth(karteApiToken);

  // KARTE上のメンバーとLINEユーザーを紐付けるためにidentifyイベントを発生させる
  try {
    logger.debug('send identify');
    const res = await insight.postV2TrackEventWrite({
      keys: { user_id: userId },
      event: {
        values: { user_id: `wuid-line-${lineUserId}` },
        event_name: 'identify'
      }
    })
    logger.debug(`succeed kick postV2TrackEventWrite api > identify: ${res}`);
  } catch (err) {
    logger.error(`error kick postV2TrackEventWrite api > identify: ${err}`);
    throw err;
  }

  // KARTEにLINEユーザーを登録しLINE送信を可能にする
  try {
    logger.debug('send plugin_line_identify');
    const res = await insight.postV2TrackEventWrite({
      keys: { user_id: userId },
      event: {
        values: { user_id: `wuid-line-${lineUserId}`, line_user_id: lineUserId, subscribe: true },
        event_name: 'plugin_line_identify'
      }
    });
    logger.debug(`succeed kick postV2TrackEventWrite api > plugin_line_identify:  ${res}`);
  } catch (err) {
    logger.error(`error kick postV2TrackEventWrite api > plugin_line_identify: ${err}`);
    throw err;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const token = await secret.get({ keys: [SECRET_KEY_API], });
  const karteApiToken = token[SECRET_KEY_API];

  // craft-shceduler実行でjobflowをキック(クエリ実行結果を渡し当該処理自体をジョブフローから実行する)
  if (data.kind === 'karte/craft-scheduler') {
    await executeJobflow(logger, karteApiToken);

    // jobflow実行でイベント送信をキック
  } else if (data.kind === 'karte/jobflow') {
    await sendEvent(logger, karteApiToken, data.jsonPayload.data.value);

    // その他は受けつけない
  } else {
    logger.error(new Error("invalid kind. expected: karte/craft-scheduler or karte/jobflow"));

  }
}
