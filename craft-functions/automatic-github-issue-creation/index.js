import { Octokit } from 'octokit';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const GITHUB_ACCESS_TOKEN = '<% GITHUB_ACCESS_TOKEN %>';
const GITHUB_ACCOUNT_NAME = '<% GITHUB_ACCOUNT_NAME %>';
const GITHUB_REPOSITORY_NAME = '<% GITHUB_REPOSITORY_NAME %>';

async function createIssue(title, userName, body, labels, octokit, logger) {
  try {
    const response = await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: GITHUB_ACCOUNT_NAME,
      repo: GITHUB_REPOSITORY_NAME,
      title: title,
      body: `**ユーザー名：**\n${userName}様\n**お問合せ内容:**\n${body}`,
      labels: labels,
    });
  } catch (error) {
    logger.error(`GitHub issueの作成に失敗しました。error: ${error}`);
  }
}

export default async function (data, { MODULES }) {
  const { secret, initLogger } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { label, title, user_name: userName, body } = data.jsonPayload.data;

  if (!title) {
    logger.error('必須のパラメータが不足しています: title');
    return;
  }
  if (!userName) {
    logger.error('必須のパラメータが不足しています: userName');
    return;
  }
  if (!body) {
    logger.error('必須のパラメータが不足しています: body');
    return;
  }

  const labels = label ? label.split(',') : [];

  const secrets = await secret.get({ keys: [GITHUB_ACCESS_TOKEN] });
  const access_token = secrets[GITHUB_ACCESS_TOKEN];

  const octokit = new Octokit({
    auth: access_token,
  });

  await createIssue(title, userName, body, labels, octokit, logger);
}
