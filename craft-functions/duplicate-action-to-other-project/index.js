import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_API_TOKEN_SECRET_FROM = '<%KARTE_API_TOKEN_SECRET_FROM%>'; // 接客サービス複製元プロジェクトでKARTE API v2アプリのtokenを登録したシークレット名
const KARTE_API_TOKEN_SECRET_TO = '<%KARTE_API_TOKEN_SECRET_TO%>'; // 接客サービス複製先プロジェクトでKARTE API v2アプリのtokenを登録したシークレット名
const SEGMENT_ID_MAP = '<%SEGMENT_ID_MAP%>'; // 複製元プロジェクトのセグメントIDと複製先プロジェクトのセグメントIDの組み合わせ

const sdkFrom = api('@dev-karte/v1.0#1kus635lt838w9s');
const sdkTo = api('@dev-karte/v1.0#1kus635lt838w9s');

/**
 * 複製元プロジェクトと複製先プロジェクトのセグメントIDの組み合わせた配列を返す。
 * @param {string} segmentIdMap
 * @returns [{from_segment_id:,to_segment_id:},~]という形式で返す。
 */
function makeSegmentIdCombinationArray(segmentIdMap) {
  const segmentIdCombinationArray = [];
  const segmentIdArray = segmentIdMap.split(',');

  segmentIdArray.forEach(pair => {
    const [first, second] = pair.split(':');
    segmentIdCombinationArray.push({
      from_segment_id: first,
      to_segment_id: second,
    });
  });

  return segmentIdCombinationArray;
}

/**
 * 複製元プロジェクトのセグメントIDを複製先プロジェクトのセグメントIDに更新した配列を返す。
 * @param {object} data
 * @param {object} logger
 * @param {Array} segmentIdCombinationArray
 * @returns [{segment_set:['',~],logic_gate:''},~]という形式で返す
 */
function convertSegmentIds(data, logger, segmentIdCombinationArray) {
  const originalSegmentsDetails = data.segments_details;
  const updatedSegmentsDetails = [];

  for (let i = 0; i < originalSegmentsDetails.length; i += 1) {
    const originalSegmentSet = originalSegmentsDetails[i].segment_set;
    updatedSegmentsDetails.push({ segment_set: [], logic_gate: '' });
    for (let j = 0; j < originalSegmentSet.length; j += 1) {
      logger.debug(
        `APIによって取得されたセグメントID${originalSegmentSet[j]}が変数で指定した複製元セグメントIDに含まれているか確認します。`
      );
      const matchObject = segmentIdCombinationArray.find(
        item => item.from_segment_id === originalSegmentSet[j]
      );
      if (matchObject) {
        updatedSegmentsDetails[i].segment_set.push(matchObject.to_segment_id);
        updatedSegmentsDetails[i].logic_gate = originalSegmentsDetails[i].logic_gate;
        logger.debug(
          `含まれていたので、複製先セグメントID${matchObject.to_segment_id}に更新しました。`
        );
      } else {
        logger.debug(`含まれていませんでした。`);
      }
    }
  }

  const filteredUpdatedSegmentDetails = updatedSegmentsDetails.filter(
    segmentDetails => segmentDetails.segment_set.length > 0 && segmentDetails.logic_gate !== ''
  );

  return filteredUpdatedSegmentDetails;
}

// create campaign & action
export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // ジョブフローで実行されたDatahubクエリの結果を取得
  const queryResultStr = data.jsonPayload.data.value;
  const queryResultArray = queryResultStr.split(',');

  const queryResultArrayLength = queryResultArray.length;

  if (queryResultArrayLength < 3) {
    logger.error(
      `Datahubクエリの出力結果のカラム数が足りません。期待されるカラム数: 3,現状のカラム数: ${queryResultArrayLength}`
    );
    return;
  }

  const campaignId = queryResultArray[0]; // 参照先の接客サービスのID
  const actionId = queryResultArray[1]; // 参照先の接客アクションのID
  const templateId = queryResultArray[2]; // [アクション作成時のみ] 作成するアクションに登録するテンプレートID

  const segmentIdCombinationArray = makeSegmentIdCombinationArray(SEGMENT_ID_MAP);

  // 複製元プロジェクトのキーを取得
  const secrets = await secret.get({
    keys: [KARTE_API_TOKEN_SECRET_FROM, KARTE_API_TOKEN_SECRET_TO],
  });
  const tokenFrom = secrets[KARTE_API_TOKEN_SECRET_FROM];
  // 複製先プロジェクトのキーを取得
  const tokenTo = secrets[KARTE_API_TOKEN_SECRET_TO];

  sdkFrom.auth(tokenFrom);
  sdkTo.auth(tokenTo);

  try {
    // 複製元の接客サービスを取得
    const { data: c } = await sdkFrom.postV2betaActionCampaignFindbyid({ id: campaignId });
    logger.debug(`[oldCampaign] id: ${c.id}, title: ${c.title}`);
    // セグメント情報を更新
    const segmentsDetails = convertSegmentIds(c, logger, segmentIdCombinationArray);

    const _c = {
      campaign: {
        // 公開ステータス
        enabled: false,
        // タイトル
        title: c.title,
        // 説明文
        description: c.description,
        // ゴール設定
        goal: c.goal,
        // ビジターのみ/メンバーのみ
        user_type: c.user_type,
        // 対象ユーザー > セグメント
        segments_details: segmentsDetails,
        // 配信トリガー
        trigger: c.trigger,
        // スケジュール設定
        dist_days_and_hours: c.dist_days_and_hours,
        // 同時配信設定
        coexist_policy: c.coexist_policy,
        // 配信停止条件
        max_number_of_display: c.max_number_of_display,
        max_number_of_display_per_day: c.max_number_of_display_per_day,
        max_number_of_close: c.max_number_of_close,
        max_number_of_close_per_day: c.max_number_of_close_per_day,
        max_number_of_click: c.max_number_of_click,
        max_number_of_click_per_day: c.max_number_of_click_per_day,
        // アーカイブ状態
        is_archived: false,
      },
    };

    if (c.start_date) _c.campaign.start_date = c.start_date;
    if (c.end_date) _c.campaign.end_date = c.end_date;

    // 接客サービスを作成。変更したい設定については、対応する項目の値を変える
    const nc = await sdkTo.postV2betaActionCampaignCreate(_c);
    const newCampaign = nc.data.campaign;
    logger.debug(`[newCampaign] id: ${newCampaign.id}, title: ${newCampaign.title}`);

    // 複製元の接客アクションを取得
    const { data: a } = await sdkFrom.postV2betaActionActionFindbyid({ action_id: actionId });

    logger.debug(`[oldAction] id: ${a.id}, title: ${a.content.title}`);

    // 接客アクションを作成。変更したい設定については、対応する項目の値を変える
    await sdkTo.postV2betaActionActionCreate({
      query: {
        content: {
          html: a.content.html,
          source_html: a.content.source_html,
          style: a.content.style,
          less: a.content.less,
          source_script: a.content.source_script,
          script: a.content.script,
        },
        variables: a.variables,
      },
      campaign_id: newCampaign.id,
      template_id: templateId,
    });
  } catch (e) {
    logger.error(e.data?.error || e);
  }
}
