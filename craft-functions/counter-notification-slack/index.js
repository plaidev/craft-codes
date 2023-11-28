import { WebClient} from '@slack/web-api';

const SLACK_CHANNEL_ID = '<% SLACK_CHANNEL_ID %>';
const SLACK_TOKEN_SECRET = '<% SLACK_ TOKEN_SECRET %>';
const COUNTER_KEYS = '<% COUNTER_KEYS %>';

const LOG_LEVEL = '<% LOG_LEVEL %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret, counter } = MODULES;

  const logger = initLogger({ logLevel: LOG_LEVEL });

  const secrets = await secret.get({keys: [SLACK_TOKEN_SECRET]});
  const token = secrets[SLACK_TOKEN_SECRET];

  const slackClient = new WebClient(token);

  // カウンターのキーを配列に変換
  const counterKeys = COUNTER_KEYS.split(',');

  // カウンターのvalueを配列で取得
  const counterValues = await counter.get({keys: counterKeys});
  
  // keyに対応するvalueを配列から取り出しメッセージを作成
  const message = counterKeys
   .map((key, i) => `現在の${key}のカウント数: ${counterValues[i]}`)
   .join('\n');

  // slackに取得したカウントを通知
  await slackClient.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: message
  });
  logger.debug('slack通知完了');
}