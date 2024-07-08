import { google } from 'googleapis';
import skmeans from 'skmeans';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const CRAFT_SPEC_URI = '@dev-karte/v1.0#11ud47olug8c5v2';
const CRAFT_APP_TOKEN_SECRET_NAME = '<% CRAFT_APP_TOKEN_SECRET_NAME %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>'; // GoogleサービスアカウントのJSONキーを登録したシークレットの名前
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>'; // https://docs.google.com/spreadsheets/d/#{SPREADSHEET_ID}/
const SHEET_NAME = '<% SHEET_NAME %>'; // スプレッドシート内のシート名
const TEXT_EMBEDDING_MODEL = '<% TEXT_EMBEDDING_MODEL %>'; // Text Embedding に使用するモデル名
const N_CLUSTERS = '<% N_CLUSTERS %>'; // クラスタ数

async function getSsClient(jsonKey) {
  // Google Drive APIの初期化
  const jwtClient = new google.auth.JWT(jsonKey.client_email, null, jsonKey.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
  await jwtClient.authorize();

  const sheets = google.sheets({ version: 'v4', auth: jwtClient });
  return sheets;
}

async function getSsValues(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return res.data.values || null;
}

async function fetchInputs(sheets) {
  // A行からデータを取得
  const sheetData = await getSsValues(sheets, `${SHEET_NAME}!A:A`);
  const inputs = sheetData.flat();
  return inputs;
}

async function updateSsValues(sheets, range, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
}

async function outputData(sheets, clusteredDocuments) {
  const clusteredDocumentsFlatten = clusteredDocuments.map(clusteredDocument => {
    const wk = [clusteredDocument.text, clusteredDocument.clusterId];
    return wk;
  });
  const header = ['input', 'cluster_id'];

  // A1行にデータを出力
  updateSsValues(sheets, `${SHEET_NAME}!A1:Z`, [header, ...clusteredDocumentsFlatten]);
}

async function embedding(text, sdk) {
  const embeddingRes = await sdk.postV2betaCraftAimodulesOpenaiEmbeddings({
    model: TEXT_EMBEDDING_MODEL,
    input: [text],
  });
  return embeddingRes.data.data[0].embedding;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  // CORSサポートの追加
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // secretsの取得
    const secrets = await secret.get({
      keys: [CRAFT_APP_TOKEN_SECRET_NAME, SERVICE_ACCOUNT_KEY_SECRET],
    });

    // SDKの初期化
    const token = secrets[CRAFT_APP_TOKEN_SECRET_NAME];
    const sdk = karteApiClientForCraftTypeApp({
      token,
      specUri: CRAFT_SPEC_URI,
    });

    // Google Sheets APIの初期化
    const rawJsonKey = secrets[SERVICE_ACCOUNT_KEY_SECRET];
    const jsonKey = JSON.parse(rawJsonKey);
    const sheets = await getSsClient(jsonKey);

    // テキストを取得
    const inputs = await fetchInputs(sheets);

    // テキストと埋め込みベクトルでの表現の組を取得
    // [
    //   { text: "Document 1", embedding: [2, 2, 3] },
    //   { text: "Document 2", embedding: [1, 5, 1] },
    // ];
    const documents = await Promise.all(
      inputs.slice(1).map(async input => ({
        text: input,
        embedding: await embedding(input, sdk),
      }))
    );

    // クラスタリング
    const skdata = documents.map(d => d.embedding);
    const skres = skmeans(skdata, N_CLUSTERS, 'kmpp', 500);
    const clusteredDocuments = [];
    for (let i = 0; i < documents.length; i++) {
      const clusteredDocument = {
        text: documents[i].text,
        clusterId: skres.idxs[i],
      };
      clusteredDocuments.push(clusteredDocument);
    }

    // スコアをスプレッドシートに出力
    await outputData(sheets, clusteredDocuments);
    logger.log('job has succesfully completed.');
    res.status(200).json({ message: 'Success' });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message });
  }
}