import { google } from 'googleapis';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const CRAFT_SPEC_URI = '@dev-karte/v1.0#11ud47olug8c5v2';
const CRAFT_APP_TOKEN_SECRET_NAME = '<% CRAFT_APP_TOKEN_SECRET_NAME %>';
const EMBEDDING_KEYWORDS = '<% EMBEDDING_KEYWORDS %>'; // 埋め込みたいキーワード
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>'; // GoogleサービスアカウントのJSONキーを登録したシークレットの名前
const SPREADSHEET_ID = '<% SPREADSHEET_ID %>'; // https://docs.google.com/spreadsheets/d/#{SPREADSHEET_ID}/
const SHEET_NAME = '<% SHEET_NAME %>'; // スプレッドシート内のシート名
const TEXT_EMBEDDING_MODEL = '<% TEXT_EMBEDDING_MODEL %>'; // Text Embedding に使用するモデル名

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

async function outputData(sheets, scores) {
  const scoresFlatten = scores.slice(1).map(score => {
    const wk = [
      score.input,
      // コサイン類似度によりスコアリング
      ...score.scores.map(_score => _score.scoreDotProduct),
      // ユークリッド距離によりスコアリング
      // （使用するには、コサイン類似度によるスコアリングをコメントアウトし、以下の行をコメントインする）
      // ...score.scores.map(_score => _score.scoreEuclideanDistance),
    ];
    return wk;
  });
  const header = ['input', ...EMBEDDING_KEYWORDS.split(',')];

  // A1行にデータを出力
  updateSsValues(sheets, `${SHEET_NAME}!A1:Z`, [header, ...scoresFlatten]);
}

async function embedding(text, sdk) {
  const embeddingRes = await sdk.postV2betaCraftAimodulesOpenaiEmbeddings({
    model: TEXT_EMBEDDING_MODEL,
    input: [text],
  });
  return embeddingRes.data.data[0].embedding;
}

function dotProduct(v1, v2) {
  return v1.reduce((acc, cur, i) => acc + cur * v2[i], 0);
}

function euclideanDistance(v1, v2) {
  return Math.sqrt(v1.reduce((acc, cur, i) => acc + (cur - v2[i]) ** 2, 0));
}

async function scoring(scoringAxises, inputs, sdk) {
  const inputEmbedded = await Promise.all(
    inputs.map(async input => ({
      input,
      embedding: await embedding(input, sdk),
    }))
  );

  const scoringAxisesEmbedded = await Promise.all(
    scoringAxises.map(async scoringAxis => ({
      scoringAxis,
      embedding: await embedding(scoringAxis, sdk),
    }))
  );

  const scoredDatam = inputEmbedded.map(inputEmbed => {
    const wkScoredDatam = {
      input: inputEmbed.input,
      scores: [],
    };
    scoringAxisesEmbedded.forEach(scoringAxisEmbed => {
      wkScoredDatam.scores.push({
        scoringAxis: scoringAxisEmbed.scoringAxis,
        scoreDotProduct: dotProduct(inputEmbed.embedding, scoringAxisEmbed.embedding),
        scoreEuclideanDistance: euclideanDistance(inputEmbed.embedding, scoringAxisEmbed.embedding),
      });
    });
    return wkScoredDatam;
  });

  return scoredDatam;
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, karteApiClientForCraftTypeApp } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;
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

    // アンケートの結果データを取得
    const inputs = await fetchInputs(sheets);

    // スコアを計算
    const scoringAxies = EMBEDDING_KEYWORDS.split(',');
    const scores = await scoring(scoringAxies, inputs, sdk);

    // スコアをスプレッドシートに出力
    await outputData(sheets, scores);

    res.status(200).send({ message: 'Success' });
  } catch (e) {
    logger.log(e);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}