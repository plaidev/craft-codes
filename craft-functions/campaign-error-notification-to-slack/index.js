import { WebClient } from '@slack/web-api';

const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_TOKEN_SECRET %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

async function getSlackSecrets(secret) {
  return secret.get({
    keys: [SLACK_TOKEN_SECRET],
  });
}

function parseQueryResultData(data) {
  const queryResultStr = data?.jsonPayload?.data?.value;
  if (!queryResultStr) {
    throw new Error('Invalid query');
  }
  const rows = queryResultStr
    .split('\n')
    .map(row => row.split(','))
    .filter(row => row.length > 1);
  if (rows.length < 2) {
    throw new Error('Query does not contain rows');
  }
  return rows.slice(1); // 最初の行はヘッダー行なので除外する
}

function constructMessageForSlack(queryResultDataRows) {
  const slackMessage = `以下の接客サービスで指定した回数以上のエラーが発生しています。\n\n`;

  return queryResultDataRows.reduce(
    (acc, cur) =>
      `${acc}
接客サービス名：${cur[0]}
接客サービスURL：${cur[1]}
エラーメッセージ：${cur[2]}
エラー発生数：${cur[3]}
`,
    slackMessage
  );
}

async function postMessageToSlack({ slackClient, slackChannelId, slackMessage, logger }) {
  try {
    await slackClient.chat.postMessage({
      channel: slackChannelId,
      text: slackMessage,
    });
    logger.debug('Message posted to Slack successfully');
  } catch (error) {
    logger.error('Failed to post message to Slack:', { error });
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    if (data.kind !== 'karte/jobflow') {
      throw new Error('Invalid trigger. This function only supports karte/jobflow trigger.');
    }

    const secrets = await getSlackSecrets(secret);
    const slackToken = secrets[SLACK_TOKEN_SECRET];
    const slackChannelId = SLACK_CHANNEL_ID;

    const slackClient = new WebClient(slackToken);

    const queryResultDataRows = parseQueryResultData(data);
    if (queryResultDataRows.length === 0) {
      logger.log('No data available');
      return;
    }
    logger.debug(`queryResultDataRows:${queryResultDataRows}`);

    const slackMessage = constructMessageForSlack(queryResultDataRows);
    await postMessageToSlack({ slackClient, slackChannelId, slackMessage, logger });
  } catch (error) {
    logger.error({ error });
  }
}
