import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ACCESS_KEY_SECRET = '<% ACCESS_KEY_SECRET %>';
const SECRET_ACCESS_KEY_SECRET = '<% SECRET_ACCESS_KEY_SECRET %>';

export default async function (data, { MODULES }) {

  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  if (!ACCESS_KEY_SECRET || !SECRET_ACCESS_KEY_SECRET) {
    logger.error('アクセスキーまたはシークレットアクセスキーのシークレット名が設定されていません');
    return;
  }

  const secrets = await secret.get({
    keys: [ACCESS_KEY_SECRET, SECRET_ACCESS_KEY_SECRET],
  });
  const accessKeyId = secrets[ACCESS_KEY_SECRET];
  const secretAccessKey = secrets[SECRET_ACCESS_KEY_SECRET];


  const value = data.jsonPayload.data.value;
  const fileSettings = value.split(',');

  if (fileSettings.length !== 3) {
    logger.error('クエリ結果には3つの要素を持つ必要があります。region、バケット名、ファイルパスの順で設定してください。');
    return;
  }
  
  logger.debug('fileSettings:', fileSettings);

  // SQLより必要な情報を取得
  const REGION = fileSettings[0]; // region
  const BUCKET_NAME = fileSettings[1]; // バケット名
  const FILE_PATH = fileSettings[2]; // ファイルパス

  // アクセスキーとシークレットキーを設定
  const credentials = {
    accessKeyId,
    secretAccessKey,
  };

  // S3クライアントを設定
  const s3Client = new S3Client({ credentials, region: REGION });

  // S3のファイルを削除
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${FILE_PATH}`,
  };

  try {
    const command = new DeleteObjectCommand(params);
    const response = await s3Client.send(command);
    logger.log(`削除成功. file_path: ${FILE_PATH}`, response);
  } catch (err) {
    logger.error(`削除エラー. region: ${REGION}, bucket_name: ${BUCKET_NAME}, file_path: ${FILE_PATH}, err: ${err}`);
  }
}