const COUNTER_EXPIRE_SECONDS = Number('<% COUNTER_EXPIRE_SECONDS %>'); // アンケート集計結果の保持期間（秒）
const LOG_LEVEL = '<% LOG_LEVEL %>';
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>';

function counterKey({ enqueteId, choiceId }) {
  return `${COUNTER_KEY_PREFIX}_${enqueteId}_${choiceId}`;
}

async function readResults({ counter, logger }, { enqueteId, choiceIds }) {
   // 例: ["apple", "banana", "cherry"] -> ["xxx_apple", "xxx_banana", "xxx_cherry"]
  const keys = choiceIds.map(choiceId => counterKey({ enqueteId, choiceId }));

  try {
    logger.debug(`Read start. enqueteId: ${enqueteId}`);
    const counts = await counter.get({ keys }); // 例: [42, 24, 8]
    const result = choiceIds.reduce((obj, id, index) => { // 例: { apple: 42, banana: 24, cherry: 8}
      obj[id] = counts[index];
      return obj;
    }, {});

    logger.debug(`Read succeeded. enqueteId: ${enqueteId}`);
    return { craft_status_code: 200, result };
  } catch (err) {
    return { craft_status_code: 500, error: `read answer error: ${err}` };
  }
}

async function writeAnswer({ counter, logger }, { enqueteId, selectedChoiceId }) {
  try {
    await counter.increment({
      key: counterKey({ enqueteId, choiceId: selectedChoiceId }),
      secondsToExpire: COUNTER_EXPIRE_SECONDS,
    });
    logger.debug(`Write succeeded. enqueteId: ${enqueteId}. choiceId: ${selectedChoiceId}.`);
    return { craft_status_code: 200, result: 'write succeeded.' };
  } catch (err) {
    return { craft_status_code: 500, error: `write answer error. enqueteId: ${enqueteId}. choiceId: ${selectedChoiceId}. error: ${err.toString()}` };
  }
}

function noRequiredParamErr(param) {
  return { craft_status_code: 400, error: `"${param}" is required in the request body.` }
}

export default async function (data, { MODULES }) {
  const { counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== "karte/track-hook") {
    logger.error(new Error("invalid kind. expected: karte/track-hook"));
    return;
  }

  const body = data.jsonPayload.data.hook_data.body;
  if (typeof body !== 'object') {
    return { craft_status_code: 400, error: 'Invalid request body.' };
  }

  const { action, enqueteId } = body;
  if (!action) return noRequiredParamErr('action');
  if (!enqueteId) return noRequiredParamErr('enqueteId');

  if (action === 'read') {
    const {
      choiceIds // 例: ["apple", "banana", "cherry"]
    } = body;
    if (!choiceIds) return noRequiredParamErr('choiceIds');

    const { craft_status_code, result, error } = await readResults({ counter, logger }, { enqueteId, choiceIds });
    return { craft_status_code, result, error };
  } else if (action === 'write') {
    const {
      selectedChoiceId // 例: "apple"
    } = body;
    if (!selectedChoiceId) return noRequiredParamErr('selectedChoiceId');

    const { craft_status_code, result, error } = await writeAnswer({ counter, logger }, { enqueteId, selectedChoiceId });
    return { craft_status_code, result, error };
  } else {
    return { craft_status_code: 400, error: `Invalid action type: ${action}` };
  }
}
