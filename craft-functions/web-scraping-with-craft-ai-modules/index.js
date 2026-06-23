import { Storage } from '@google-cloud/storage';
import { JSDOM } from 'jsdom';

// Webページから抽出する対象要素をここに定義してください。追加・変更することでカスタマイズでき、AIへの指示文も自動で更新されます。
// name: 抽出した値の名前、description: AIが対象要素を特定するための説明文
const FIELD_CONFIG = [
  { name: 'name', description: '商品名' },
  { name: 'price', description: '価格' },
];
const FIELDS = FIELD_CONFIG.map(field => field.name);

const LOG_LEVEL = '<% LOG_LEVEL %>';
const SOLUTION_ID = '<% SOLUTION_ID %>';
const AI_MODEL = '<% AI_MODEL %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const BUCKET_NAME = '<% BUCKET_NAME %>';

function formatDataToJSONLines(data) {
  return data.map(obj => JSON.stringify(obj)).join('\n');
}

function extractFields(document, selectors) {
  const result = {};
  FIELDS.forEach(field => {
    const element = document.querySelector(selectors[field]);
    result[field] = element ? element.textContent.replace(/\s+/g, ' ').trim() : null;
  });
  return result;
}

async function generateSelectors({ aiModules, kvs, html, cacheKey, RetryableError }) {
  const fieldList = FIELD_CONFIG.map(field => `${field.name}:${field.description}`).join('\n');
  const properties = {};
  FIELDS.forEach(field => {
    properties[field] = { type: 'string', description: `${field}を抽出するCSSセレクタ` };
  });
  const responseSchema = {
    type: 'object',
    properties,
    required: FIELDS,
  };

  let selectors;
  try {
    const aiResult = await aiModules.gcpGeminiGenerateContent({
      model: AI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `以下のHTMLを解析して、指定する対象を抽出するためのCSSセレクタを返してください。\n##抽出対象となる項目\n${fieldList}\n## HTMLドキュメント\n${html}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        maxOutputTokens: 1024,
      },
    });
    selectors = JSON.parse(aiResult.candidates[0].content.parts[0].text);
  } catch (e) {
    throw new RetryableError(`セレクタの生成に失敗しました: ${cacheKey}`);
  }

  try {
    await kvs.write({ key: cacheKey, value: selectors, minutesToExpire: 44640 });
  } catch (e) {
    throw new RetryableError(`KVSへの保存に失敗しました: ${cacheKey}`);
  }

  return selectors;
}

export default async function (data, { MODULES }) {
  const { initLogger, aiModules, secret, kvs, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  const [url, dirPath] = data.jsonPayload.data.value.split(',');

  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new RetryableError(`HTMLの取得に失敗しました: ${url}`);
  }
  if (!response.ok) {
    if ((response.status >= 500 && response.status < 600) || [408, 429].includes(response.status)) {
      throw new RetryableError(`HTMLの取得に失敗しました. status: ${response.status}, url: ${url}`);
    }
    throw new Error(`HTMLの取得に失敗しました. status: ${response.status}, url: ${url}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const { hostname, pathname } = new URL(url);
  const urlPath = `${hostname}${pathname}`.replace(/\/$/, '');
  const cacheKey = `${SOLUTION_ID}-${hostname}`;
  let kvsResult;
  try {
    kvsResult = await kvs.get({ keys: [cacheKey] });
  } catch (e) {
    throw new RetryableError(`KVSの取得に失敗しました: ${cacheKey}`);
  }
  const cached = kvsResult[cacheKey];

  let selectors;
  let result;
  let hasNull;
  if (cached) {
    hasNull = FIELDS.some(field => !cached.value[field]);
  }

  if (cached && !hasNull) {
    selectors = cached.value;
    result = extractFields(document, selectors);
    hasNull = FIELDS.some(field => result[field] === null);
  }

  if (!cached || hasNull) {
    if (hasNull) logger.log('要素が取得できなかったため、セレクタを再生成します。');
    selectors = await generateSelectors({ aiModules, kvs, html, cacheKey, RetryableError });
    result = extractFields(document, selectors);
  }

  const secrets = await secret.get({ keys: [SERVICE_ACCOUNT_KEY_SECRET] });
  const saKeyJson = secrets[SERVICE_ACCOUNT_KEY_SECRET];
  const storage = new Storage({ credentials: JSON.parse(saKeyJson) });
  const bucket = storage.bucket(BUCKET_NAME);

  const gcsPath = dirPath ? `${dirPath}/${urlPath}.jsonl` : `${urlPath}.jsonl`;
  const file = bucket.file(gcsPath);
  try {
    await file.save(formatDataToJSONLines([result]));
  } catch (e) {
    throw new RetryableError(`GCSへの保存に失敗しました: ${gcsPath}`);
  }
  logger.log('GCSに保存しました:', gcsPath);
}
