const COUNTER_EXPIRE_SECONDS = Number('<% COUNTER_EXPIRE_SECONDS %>'); // アンケート集計結果の保持期間（秒）
const LOG_LEVEL = '<% LOG_LEVEL %>';
const COUNTER_KEY_PREFIX = '<% COUNTER_KEY_PREFIX %>';

function counterKey({ enqueteId, choiceId }) {
  return `${COUNTER_KEY_PREFIX}_${enqueteId}_${choiceId}`;
}

async function readResults({ counter, logger, enqueteId, choiceIds }) {
  // 例: ["apple", "banana", "cherry"] -> ["xxx_apple", "xxx_banana", "xxx_cherry"]
  const keys = choiceIds.map(choiceId => counterKey({ enqueteId, choiceId }));

  try {
    logger.debug(`Read start. enqueteId: ${enqueteId}`);
    const counts = await counter.get({ keys }); // 例: [42, 24, 8]
    const result = choiceIds.reduce((obj, id, index) => {
      // 例: { apple: 42, banana: 24, cherry: 8}
      obj[id] = counts[index];
      return obj;
    }, {});

    logger.debug(`Read succeeded. enqueteId: ${enqueteId}`);
    return { statusCode: 200, result };
  } catch (err) {
    return { statusCode: 500, error: `read answer error: ${err}` };
  }
}

async function writeAnswer({ counter, logger, enqueteId, selectedChoiceId }) {
  try {
    await counter.increment({
      key: counterKey({ enqueteId, choiceId: selectedChoiceId }),
      secondsToExpire: COUNTER_EXPIRE_SECONDS,
    });
    logger.debug(`Write succeeded. enqueteId: ${enqueteId}. choiceId: ${selectedChoiceId}.`);
    return { statusCode: 200, result: 'write succeeded.' };
  } catch (err) {
    return {
      statusCode: 500,
      error: `write answer error. enqueteId: ${enqueteId}. choiceId: ${selectedChoiceId}. error: ${err.toString()}`,
    };
  }
}

function noRequiredParamErr(param) {
  return { statusCode: 400, error: `"${param}" is required in the request body.` };
}

export default async function (data, { MODULES }) {
  const { counter, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const body = req.body;
  if (typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid request body.' });
    return;
  }

  const { action, enqueteId } = body;
  if (!action) {
    res.status(400).json(noRequiredParamErr('action'));
    return;
  }
  if (!enqueteId) {
    res.status(400).json(noRequiredParamErr('enqueteId'));
    return;
  }

  if (action !== 'read' && action !== 'write') {
    res.status(400).json({ error: `Invalid action type: ${action}` });
    return;
  }

  if (action === 'read') {
    const {
      choiceIds, // 例: ["apple", "banana", "cherry"]
    } = body;
    if (!choiceIds) {
      res.status(400).json(noRequiredParamErr('choiceIds'));
      return;
    }

    const { statusCode, result, error } = await readResults({
      counter,
      logger,
      enqueteId,
      choiceIds,
    });
    res.status(statusCode).json({ result, error });
    return;
  }

  // if (action === 'write')
  const {
    selectedChoiceId, // 例: "apple"
  } = body;
  if (!selectedChoiceId) {
    res.status(400).json(noRequiredParamErr('selectedChoiceId'));
    return;
  }

  const { statusCode, result, error } = await writeAnswer({
    counter,
    logger,
    enqueteId,
    selectedChoiceId,
  });
  res.status(statusCode).json({ result, error });
}
