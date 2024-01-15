import api from "api";

const LOG_LEVEL = "<% LOG_LEVEL %>";
const KARTE_APP_TOKEN_SECRET = "<% KARTE_APP_TOKEN_SECRET %>";
const REFTABLE_ID = "<% REFTABLE_ID %>";
const FORM_FIELDS = "<% FORM_FIELDS %>";

const karteApiClient = api("@dev-karte/v1.0#yeekp16lpj2g7af");

function validateData(data, logger) {
  const { kind, jsonPayload } = data;
  if (kind !== "karte/track-hook") {
    logger.warn("Not a track-hook");
    return { craft_status_code: 400, message: "Invalid request" };
  }

  const { hook_data: hookData, plugin_name: pluginName } = jsonPayload.data;
  if (pluginName !== "craft") {
    logger.warn("Not a craft");
    return { craft_status_code: 400, message: "Invalid request" };
  }

  const { body } = hookData;
  if (!body) {
    logger.warn(`Body is null or undefined`);
    return { craft_status_code: 400, message: "Invalid body" };
  }

  const { visitorId } = body;
  if (!visitorId) {
    logger.warn(`visitorId is null or undefined`);
    return {
      craft_status_code: 400,
      message: `"visitorId" is required in the request body.`,
    };
  }
  return null;
}

async function postReftableRowUpsert(logger, { visitorId, values }) {
  try {
    await karteApiClient.postV2betaTrackReftableRowUpsert({
      id: REFTABLE_ID,
      rowKey: { user_id: `vis-${visitorId}` },
      values,
    });
    logger.log(`Reftable write succeeded.`);
    return { craft_status_code: 200, message: "Success" };
  } catch (e) {
    logger.error(`Reftable write error: ${e}`);
    return { craft_status_code: 500, message: "Internal Error" };
  }
}

export default async function (data, { MODULES }) {
  const { secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { jsonPayload } = data;
  const { body } = jsonPayload.data.hook_data;
  const { visitorId } = body;

  const validationError = validateData(data, logger);
  if (validationError) {
    const { craft_status_code: code, message } = validationError;
    return { craft_status_code: code, message };
  }

  const values = {};
  const fields = FORM_FIELDS.split(",");
  fields.forEach((field) => {
    values[field] = body[field];
  });

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  karteApiClient.auth(token);

  const postReftableRowUpsertRes = await postReftableRowUpsert(logger, {
    visitorId,
    values,
  });
  if (postReftableRowUpsertRes) {
    const { craft_status_code: code, message } = postReftableRowUpsertRes;
    return { craft_status_code: code, message };
  }
}
