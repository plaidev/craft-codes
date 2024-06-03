import { Storage } from '@google-cloud/storage';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/jobflow') {
    logger.error(`invalid trigger kind: ${data.kind}`);
    return;
  }

  try {
    const secrets = await secret.get({
      keys: [SERVICE_ACCOUNT_KEY_SECRET],
    });

    let key;
    try {
      key = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
    } catch (jsonError) {
      logger.error('Failed to parse key string to JSON:', jsonError);
      return;
    }

    const values = data.jsonPayload.data.value;
    const fileSettings = values.split(',');
    const bucketName = fileSettings[1];
    const fileName = fileSettings[2];
    const projectId = fileSettings[0];

    const storage = new Storage({
      projectId,
      credentials: key,
    });

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.delete();

    logger.log(
      `File ${fileName} was deleted successfully from bucket ${bucketName} in project ${projectId}.`
    );
  } catch (error) {
    logger.error('Error deleting file:', error);
  }
}
