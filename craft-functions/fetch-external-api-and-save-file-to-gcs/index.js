import { Storage } from "@google-cloud/storage";

const LOG_LEVEL = "<% LOG_LEVEL %>";
const API_ENDPOINT = "<% API_ENDPOINT %>";
const BUCKET_NAME = "<% BUCKET_NAME %>";
const FILE_PATH = "<% FILE_PATH %>";
const SERVICE_ACCOUNT_KEY_SECRET = "<% SERVICE_ACCOUNT_KEY_SECRET %>";

async function getDataFromAPI(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch data from ${url}, status: ${response.status}`
    );
  }
  return response.json();
}

function formatDataToJSONLines(responseData) {
  return responseData.map((obj) => JSON.stringify(obj)).join("\n");
}

async function uploadDataToStorage(
  bucketName,
  filePath,
  jsonLinesData,
  jsonKey,
  logger
) {
  const storage = new Storage({ credentials: jsonKey });
  const bucket = storage.bucket(bucketName);

  const blob = bucket.file(filePath);
  const stream = blob.createWriteStream({
    metadata: {
      contentType: "application/json",
    },
  });

  return new Promise((resolve, reject) => {
    stream.on("error", (err) => {
      logger.error("Upload Error:", err);
      reject(err);
    });

    stream.on("finish", () => {
      logger.log(`Uploaded: ${filePath}`);
      resolve();
    });

    stream.end(jsonLinesData);
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  // GoogleサービスアカウントのJSONキーをシークレットから取得
  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const _jsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const jsonKey = JSON.parse(_jsonKey);

  const responseData = await getDataFromAPI(API_ENDPOINT);
  const formattedData = formatDataToJSONLines(responseData);

  await uploadDataToStorage(
    BUCKET_NAME,
    FILE_PATH,
    formattedData,
    jsonKey,
    logger
  );
}
