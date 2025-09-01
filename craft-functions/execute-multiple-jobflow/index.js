import api from 'api';

// 実行したいジョブフローの設定: triggerが終了すると、targetが実行される
const TARGET_JOBFLOWS = [
  { trigger: 'jobflowAのID', target: 'jobflowBのID' }, // A -> B
  { trigger: 'jobflowBのID', target: 'jobflowCのID' }, // B -> C
  /*
    ....
    */
];

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

// 終了したトリガーを判別し、実行するターゲットを取り出す
async function getTargetsToExecute(dataId) {
  const jobQueue = [];
  TARGET_JOBFLOWS.forEach((jobflow, index) => {
    if (dataId === jobflow.trigger) {
      jobQueue.push(index);
    }
  });
  // 実行させたいターゲットを取り出す
  const targetsToExecute = jobQueue.map(index => TARGET_JOBFLOWS[index].target);
  return targetsToExecute;
}

// ジョブフローを実行する
async function executeJobflows(appToken, targetsToExecute, logger) {
  try {
    const jobflowsApi = api('@dev-karte/v1.0#d9ni2glia2qxp8');
    jobflowsApi.auth(appToken);

    const res = await Promise.allSettled(
      targetsToExecute.map(
        jobflowId =>
          jobflowsApi
            .postV2DatahubJobflowExec({ jobflow_id: jobflowId })
            .then(result => ({ ...result, jobflowId })) // resultにはジョブフローIDが記載されていないため、追記する
      )
    );
    // ジョブフローの実行レスポンスを出力する
    logger.log(res);
  } catch (err) {
    logger.error(err);
    throw new Error('targetのジョブフローを実行できませんでした');
  }
}

// ジョブフローを実行させる処理
export default async function (data, { MODULES }) {
  const { secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // 終了したジョブフローを判別する
  const targetsToExecute = await getTargetsToExecute(data.jsonPayload.data.id);
  // 終了したジョブフローが登録されていない場合、処理終了。
  if (targetsToExecute.length === 0) {
    logger.debug('TARGET_JOBFLOWSに登録されているtirggerのジョブフローが一つも終了しませんでした');
    return;
  }
  // APIトークンを設定する
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];
  // ジョブフローを実行する
  await executeJobflows(appToken, targetsToExecute, logger);
}
