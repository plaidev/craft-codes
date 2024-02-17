import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_PROJECT_ID = '<% KARTE_PROJECT_ID %>';
const TALK_BOT_ID = '<% TALK_BOT_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';

function mapActionType(action) {
  switch (action) {
    case 'opened':
      return 'オープン';
    case 'closed':
      return 'クローズ';
    case 'reopened':
      return '再オープン';
    case 'edited':
      return '編集';
    case 'created':
      return null; // コメント通知はOFF
    default:
      return null;
  }
}

function makeCommonHeader(issue, githubUserName, actionText) {
  const issueTitle = issue.title;
  const issueNum = issue.number;
  const issueUrl = issue.html_url;
  return `[GitHub通知]\n \
  関連するissueが ${githubUserName} によって${actionText}されました。\n \
  「${issueTitle} #${issueNum}」 ( ${issueUrl} )`;
}

function makeNoteMessages(targets, commonHeader) {
  return targets.map(t => {
    // urlがmessageIdを含む場合は、そのメッセージへのリンクを表示する
    let text = commonHeader;
    if (t.talkURL.includes('messageId')) {
      text += `\n\nこのIssueに紐付くメッセージ: \n ${t.talkURL}`;
    }
    return {
      userId: t.userId,
      text,
    };
  });
}

// GitHub Issue bodyからトーク画面URLの一覧を取得し、対象user_idとトーク画面URLの組を配列で返す
function extractTargets(issueBody, { logger }) {
  const lines = issueBody.split(/\r\n|\r|\n/g);
  const targets = [];

  lines.forEach(line => {
    const regExp =
      /https:\/\/admin.karte.io\/communication\/v2\/workspace\/[\w|-]+\/[\w|-]+\/([\w|-]+)(?:\?[\w|=&]*)?(?:#[\w]*)?/;

    const m = line.match(regExp);
    if (!m) return;
    const [talkURL, encodedUserId] = m;

    // 対象のproject_idが無い場合は、スキップ
    if (!talkURL.includes(KARTE_PROJECT_ID)) {
      return logger.debug(`talkURL without KARTE_PROJECT_ID: ${talkURL}`);
    }

    const userId = decodeURIComponent(decodeURIComponent(encodedUserId));

    // 既に同じUserIdがあった場合は、スキップ
    if (targets.some(t => t.userId === userId)) return;

    targets.push({ userId, talkURL });
  });
  return targets;
}

async function sendNotes({ noteMessages, karteAppToken, logger }) {
  const talk = api('@dev-karte/v1.0#d9ni28lia2r0hf');
  talk.auth(karteAppToken);

  const promises = noteMessages.map(m =>
    talk.postV2betaTalkNoteSend({
      content: {
        text: m.text,
      },
      sender: { id: TALK_BOT_ID, is_bot: true },
      user_id: m.userId,
    })
  );
  try {
    await Promise.all(promises);
    logger.log(`send note succeeded. message length: ${noteMessages.length}`);
  } catch (e) {
    logger.error(`send note error: ${e}`);
  }
}

export default async function (data, { MODULES }) {
  const { secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const { body } = data.jsonPayload.data.hook_data;
  if (!body) {
    return logger.error('[error] request has no body');
  }

  const { issue, action } = body;
  if (!issue || !issue.body) {
    return logger.error('[error] request has no issue.body');
  }
  const actionText = mapActionType(action);
  if (!actionText) return;

  const issueBody = issue.body;
  const targets = extractTargets(issueBody, { logger });
  if (targets.length === 0) return;

  const githubUserName = body.sender.login;
  const commonHeader = makeCommonHeader(issue, githubUserName, actionText);

  const noteMessages = makeNoteMessages(targets, commonHeader);

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const karteAppToken = secrets[KARTE_APP_TOKEN_SECRET];
  await sendNotes({ noteMessages, commonHeader, karteAppToken, logger });
}
