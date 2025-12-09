import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const TARGET_IMPORT_PATH = '<% TARGET_IMPORT_PATH %>';
const CORPUS_ID = '<% CORPUS_ID %>';

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (data.kind !== 'karte/apiv2-hook') {
    logger.warn('Invalid trigger. This function only supports karte/hook trigger.');
    return;
  }

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const appToken = secrets[KARTE_APP_TOKEN_SECRET];

  const pdfHookData = data.jsonPayload.data;
  const siteName = pdfHookData.ret.siteName;
  const filePath = pdfHookData.ret.path;

  if (!filePath.startsWith(TARGET_IMPORT_PATH)) {
    logger.warn(
      `File path ${filePath} is not in the target import directory ${TARGET_IMPORT_PATH}. Skipping import.`
    );
    return;
  }

  try {
    const sdk = api('@dev-karte/v1.0#l10f37mfxgrjj4');
    sdk.auth(appToken);

    await sdk.postV2betaCraftRagImportbydirectory({
      siteName,
      path: TARGET_IMPORT_PATH,
      corpusId: CORPUS_ID,
    });

    logger.log('RAG Import job successfully started.');
  } catch (err) {
    logger.error('Failed to start RAG Import job:', err);
  }
}
