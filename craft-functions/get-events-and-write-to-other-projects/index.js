import api from "api";

const LOG_LEVEL = "<% LOG_LEVEL %>";
const KARTE_APP_TOKEN_SECRET = "<% KARTE_APP_TOKEN_SECRET %>";
const OTHER_PROJECT_KARTE_APP_TOKEN_SECRET =
  "<% OTHER_PROJECT_KARTE_APP_TOKEN_SECRET %>";
const PER_DATA_TIMEOUT_SEC = Number("<% PER_DATA_TIMEOUT_SEC %>");
const karteApiClient = api("@dev-karte/v1.0#1bkcoiglscz8c35");

async function getEvents(token, userId, date, eventName) {
  const unixTimeMilliseconds = parseInt(date, 10) * 1000;
  karteApiClient.auth(token);
  try {
    const response = await karteApiClient.postV2betaTrackEventGet({
      user_id: userId,
      event_names: [eventName],
      options: { from: unixTimeMilliseconds },
    });
    return response.data.events;
  } catch (error) {
    throw new Error(`Error during KARTE event getting: ${error.message}`);
  }
}

function preprocessEvents(events, date, eventName) {
  const unixTime = parseInt(date, 10);
  const filteredEvents = events[eventName].filter(
    (eventData) => eventData._date === unixTime
  );

  const event = filteredEvents[0];
  const targetFields = Object.keys(event.values[eventName]).filter(
    (key) => !key.startsWith("_") && key !== "date"
  );
  return { event, targetFields };
}

async function trackEventToOtherProject(
  otherProjectToken,
  event,
  targetFields,
  otherProjectVisitorId,
  eventName,
  logger
) {
  karteApiClient.auth(otherProjectToken);

  const values = {};
  targetFields.forEach((key) => {
    values[key] = event.values[eventName][key];
  });

  try {
    await karteApiClient.postV2TrackEventWrite({
      keys: { visitor_id: otherProjectVisitorId },
      event: {
        values,
        event_name: eventName,
      },
    });
    logger.log(`Event sent successfully.`);
  } catch (error) {
    throw new Error(`Error during KARTE event sending: ${error.message}`);
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== "karte/action") {
    logger.log(`Invalid kind: ${data.kind}`);
    return;
  }

  const secrets = await secret.get({
    keys: [KARTE_APP_TOKEN_SECRET, OTHER_PROJECT_KARTE_APP_TOKEN_SECRET],
  });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  const otherProjectToken = secrets[OTHER_PROJECT_KARTE_APP_TOKEN_SECRET];

  const { userId, date, otherProjectVisitorId, eventName } =
    data.jsonPayload.data;

  const events = await getEvents(token, userId, date, eventName);

  if (Object.keys(events).length === 0) {
    throw new RetryableError("Response events is empty", PER_DATA_TIMEOUT_SEC);
  }

  const { event, targetFields } = preprocessEvents(events, date, eventName);

  await trackEventToOtherProject(
    otherProjectToken,
    event,
    targetFields,
    otherProjectVisitorId,
    eventName,
    logger
  );
}
