import api from 'api';

const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const REQUEST_TRANSLATION_FIELD = '<% REQUEST_TRANSLATION_FIELD %>';
const AI_MODEL = '<% AI_MODEL %>';
const SOURCE_LANGUAGE_CODE = '<% SOURCE_LANGUAGE_CODE %>';
const LOG_LEVEL = '<% LOG_LEVEL %>';

// ハッシュの最新値はDeveloper Portalのリファレンスページで確認してください
// https://developers.karte.io/reference/post_v2beta-cms-content-get
const KARTE_APP_SPEC_URI_CMS = '@dev-karte/v1.0#7pblxhpmo2hfu7z';
const RETRYABLE_TIMEOUT_MS = 5000;

// AIモデルの出力トークン上限による翻訳結果の途切れを防ぐため、入力テキストを分割する閾値
const CHUNK_MAX_CHARS = 2000;

// フィールドマッピング設定
// 翻訳元フィールドと翻訳先フィールドの対応を定義します。
// source: 翻訳元のCMSフィールドID
// targets: { 言語コード: 翻訳先CMSフィールドID } の形式で指定します
const FIELD_MAPPINGS = [
  {
    source: 'title_ja',
    targets: { en: 'title_en', zh: 'title_zh' },
  },
  {
    source: 'body_ja',
    targets: { en: 'body_en', zh: 'body_zh' },
  },
];

async function callAiModel(aiModules, params) {
  return aiModules.gcpGeminiGenerateContent(params);
}

// 一時的なAPIエラー（5xx, 408, ネットワーク系）を判定
function isRetryableError(error) {
  const status = error.status || error.statusCode || error.response?.status;
  const code = error.code || '';
  return status === 408 || (status >= 500 && status < 600)
    || code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ECONNABORTED';
}

async function fetchContent(client, contentId) {
  const response = await client.postV2betaCmsContentGet({
    modelId: CMS_MODEL_ID,
    contentId,
  });
  return response.data;
}

// node: 翻訳後のテキストを書き戻すための参照, text: 翻訳前テキスト
function collectTextNodes(node) {
  if (node == null || typeof node !== 'object') {
    return [];
  }
  if (node.type === 'text' && typeof node.text === 'string') {
    if (node.text.trim() === '') return [];
    return [{ node, text: node.text }];
  }
  if (!node.content || !Array.isArray(node.content)) {
    return [];
  }
  return node.content.flatMap(child => collectTextNodes(child));
}

// 翻訳結果フィールドが「空」かを判定。手動修正された翻訳を上書きしないためのガード。
// 空文字・null・未定義、およびリッチテキストで表示上のテキストが無い場合を「空」と見なす。
function isFieldBlank(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'object' && value.json) {
    return collectTextNodes(value.json).length === 0;
  }
  return false;
}

function chunkByCharCount(items, maxChars) {
  const chunks = [];
  let current = [];
  let currentLen = 0;
  for (let i = 0; i < items.length; i++) {
    const len = items[i].text.length;
    if (current.length > 0 && currentLen + len > maxChars) {
      chunks.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(items[i]);
    currentLen += len;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function translateText(aiModules, text, targetLanguage) {
  const res = await callAiModel(aiModules, {
    model: AI_MODEL,
    systemInstruction: `あなたはプロの翻訳者です。言語コード「${SOURCE_LANGUAGE_CODE}」で書かれた原文を、言語コード「${targetLanguage}」が指定する対象言語に翻訳してください。原文の意味を正確に保ち、自然で読みやすい翻訳にしてください。翻訳結果のみ出力してください。`,
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  });

  const translated = res.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof translated !== 'string' || translated.trim() === '') {
    throw new Error(`AI model returned empty response for translation to ${targetLanguage}`);
  }
  return translated.trim();
}

async function translateRichText(aiModules, richTextJson, targetLanguage, logger) {
  // collectTextNodes がノード参照を返し直接書き換えるため、元データを壊さないようコピー
  const cloned = JSON.parse(JSON.stringify(richTextJson));
  const textNodes = collectTextNodes(cloned);

  if (textNodes.length === 0) {
    return cloned;
  }

  if (textNodes.length === 1) {
    textNodes[0].node.text = await translateText(aiModules, textNodes[0].text, targetLanguage);
    return cloned;
  }

  const chunks = chunkByCharCount(textNodes, CHUNK_MAX_CHARS);
  logger.log(`Rich text: ${textNodes.length} nodes split into ${chunks.length} chunk(s)`);

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const fields = {};
    const properties = {};
    const fieldNames = [];
    for (let i = 0; i < chunk.length; i++) {
      const key = `t${i}`;
      fields[key] = chunk[i].text;
      properties[key] = { type: 'string' };
      fieldNames.push(key);
    }

    const res = await callAiModel(aiModules, {
      model: AI_MODEL,
      systemInstruction: `あなたはプロの翻訳者です。与えられたJSONオブジェクトの各値を、言語コード「${SOURCE_LANGUAGE_CODE}」から言語コード「${targetLanguage}」が指定する対象言語に翻訳してください。キー名は変更せず、翻訳結果のみを値として返してください。原文の意味を正確に保ち、自然で読みやすい翻訳にしてください。`,
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(fields) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties,
          required: fieldNames,
        },
      },
    });

    const translatedText = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof translatedText !== 'string' || translatedText.trim() === '') {
      throw new Error(`AI model returned empty response for rich text translation to ${targetLanguage} (chunk ${c + 1}/${chunks.length}, ${chunk.length} nodes)`);
    }

    let translated;
    try {
      translated = JSON.parse(translatedText);
    } catch (e) {
      translated = null;
      logger.warn(`Failed to parse AI model JSON response for chunk ${c + 1}/${chunks.length}. Falling back to individual translation.`);
    }

    for (let i = 0; i < chunk.length; i++) {
      const key = `t${i}`;
      if (!translated || typeof translated[key] !== 'string' || translated[key].trim() === '') {
        if (translated) {
          logger.warn(`Empty translation for key ${key} in chunk ${c + 1}. Falling back to individual translation.`);
        }
        chunk[i].node.text = await translateText(aiModules, chunk[i].text, targetLanguage);
      } else {
        chunk[i].node.text = translated[key];
      }
    }
  }

  return cloned;
}

async function translateTextFields(aiModules, fields, targetLanguage, logger) {
  const fieldNames = Object.keys(fields);
  if (fieldNames.length === 0) return {};

  if (fieldNames.length === 1) {
    const key = fieldNames[0];
    const translated = await translateText(aiModules, fields[key], targetLanguage);
    return { [key]: translated };
  }

  const entries = fieldNames.map(name => ({ text: fields[name], name }));
  const chunks = chunkByCharCount(entries, CHUNK_MAX_CHARS);
  const result = {};

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const chunkFields = {};
    const properties = {};
    const chunkFieldNames = [];
    chunk.forEach(entry => {
      chunkFields[entry.name] = entry.text;
      properties[entry.name] = { type: 'string' };
      chunkFieldNames.push(entry.name);
    });

    const res = await callAiModel(aiModules, {
      model: AI_MODEL,
      systemInstruction: `あなたはプロの翻訳者です。与えられたJSONオブジェクトの各値を、言語コード「${SOURCE_LANGUAGE_CODE}」から言語コード「${targetLanguage}」が指定する対象言語に翻訳してください。キー名は変更せず、翻訳結果のみを値として返してください。原文の意味を正確に保ち、自然で読みやすい翻訳にしてください。`,
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(chunkFields) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties,
          required: chunkFieldNames,
        },
      },
    });

    const translatedText = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof translatedText !== 'string' || translatedText.trim() === '') {
      throw new Error(`AI model returned empty response for text fields translation to ${targetLanguage} (fields: ${chunkFieldNames.join(', ')})`);
    }

    let parsed;
    try {
      parsed = JSON.parse(translatedText);
    } catch (e) {
      parsed = null;
      logger.warn(`Failed to parse AI model JSON response for text fields (fields: ${chunkFieldNames.join(', ')}). Falling back to individual translation.`);
    }

    for (let i = 0; i < chunk.length; i++) {
      const name = chunk[i].name;
      if (!parsed || typeof parsed[name] !== 'string' || parsed[name].trim() === '') {
        if (parsed) {
          logger.warn(`Empty translation for field '${name}'. Falling back to individual translation.`);
        }
        result[name] = await translateText(aiModules, chunk[i].text, targetLanguage);
      } else {
        result[name] = parsed[name];
      }
    }
  }

  return result;
}

async function patchContent(client, contentId, fields) {
  if (Object.keys(fields).length === 0) {
    return;
  }

  // replace はパスが存在しない場合にエラーになるため add を使用
  const operations = Object.entries(fields).map(([key, value]) => ({
    op: 'add',
    path: `/${key}`,
    value,
  }));
  await client.postV2betaCmsContentPatch({
    modelId: CMS_MODEL_ID,
    contentId,
    operations,
    kickHookV2: false, // Hookの再発火を防止（無限ループ対策）
  });
}

/**
 * FIELD_MAPPINGS の構造・値を検証する
 */
function validateFieldMappings(fieldMappings, requestTranslationField) {
  if (!Array.isArray(fieldMappings) || fieldMappings.length === 0) {
    throw new Error('FIELD_MAPPINGS must be a non-empty array. Edit the constant in the code to define source-to-target field mappings.');
  }

  const langCodePattern = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
  const seenSources = new Set();
  const seenTargets = new Map();
  const reservedFields = new Set(['id', 'sys', requestTranslationField]);

  fieldMappings.forEach(mapping => {
    if (!mapping.source || typeof mapping.source !== 'string') {
      throw new Error('Each FIELD_MAPPINGS entry must have a non-empty "source" string.');
    }

    if (seenSources.has(mapping.source)) {
      throw new Error(`FIELD_MAPPINGS contains duplicate source field: '${mapping.source}'.`);
    }

    if (reservedFields.has(mapping.source)) {
      throw new Error(`FIELD_MAPPINGS contains reserved source field: '${mapping.source}'.`);
    }

    seenSources.add(mapping.source);

    if (!mapping.targets || typeof mapping.targets !== 'object' || Object.keys(mapping.targets).length === 0) {
      throw new Error(`FIELD_MAPPINGS entry for '${mapping.source}' must have a non-empty "targets" object.`);
    }

    Object.entries(mapping.targets).forEach(([lang, targetField]) => {
      if (!langCodePattern.test(lang)) {
        throw new Error(`Invalid language code '${lang}' in FIELD_MAPPINGS for '${mapping.source}'. Use BCP-47 codes (e.g. en, zh, ko, zh-TW).`);
      }

      if (!targetField || typeof targetField !== 'string') {
        throw new Error(`Target field for '${mapping.source}' → '${lang}' must be a non-empty string.`);
      }

      if (reservedFields.has(targetField)) {
        throw new Error(`FIELD_MAPPINGS contains reserved target field: '${mapping.source}' → '${lang}:${targetField}'.`);
      }

      const previous = seenTargets.get(targetField);
      if (previous) {
        throw new Error(
          `FIELD_MAPPINGS contains duplicate target field '${targetField}': ${previous} and ${mapping.source}→${lang}.`
        );
      }

      seenTargets.set(targetField, `${mapping.source}→${lang}`);
    });
  });
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, aiModules, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (!CMS_MODEL_ID || !KARTE_APP_TOKEN_SECRET || !AI_MODEL || !REQUEST_TRANSLATION_FIELD || !SOURCE_LANGUAGE_CODE) {
    throw new Error('Required template variables are not configured.');
  }

  if (data.kind !== 'karte/apiv2-hook') {
    logger.debug('Not a Hook v2 trigger, skipping.');
    return;
  }

  const eventType = data.jsonPayload?.event_type;
  if (eventType !== 'cms/content/update' && eventType !== 'cms/content/create') {
    logger.debug(`Skipped: event_type is ${eventType}`);
    return;
  }

  const contentId = data.jsonPayload?.data?.id;
  const modelId = data.jsonPayload?.data?.sys?.modelId;

  if (!contentId) {
    logger.warn('Skipped: contentId is missing from the event payload.');
    return;
  }

  if (modelId !== CMS_MODEL_ID) {
    logger.debug(`Skipped: modelId ${modelId} does not match target ${CMS_MODEL_ID}`);
    return;
  }

  validateFieldMappings(FIELD_MAPPINGS, REQUEST_TRANSLATION_FIELD);

  const targetLanguages = [
    ...new Set(FIELD_MAPPINGS.flatMap(mapping => Object.keys(mapping.targets))),
  ];

  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  const token = secrets[KARTE_APP_TOKEN_SECRET];
  if (!token) {
    throw new Error(`Secret '${KARTE_APP_TOKEN_SECRET}' is not set.`);
  }

  const client = api(KARTE_APP_SPEC_URI_CMS);
  client.auth(token);

  let content;
  try {
    content = await fetchContent(client, contentId);
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(`Retryable error during fetchContent: ${error.message}`, RETRYABLE_TIMEOUT_MS);
    }
    throw error;
  }

  if (content[REQUEST_TRANSLATION_FIELD] !== true) {
    logger.debug(`Skipped: ${REQUEST_TRANSLATION_FIELD} is not true.`);
    return;
  }

  // 翻訳結果を蓄積（言語ごとにループ → 全結果を1回のpatchで反映）
  const patchFields = {};
  const errors = [];

  for (let i = 0; i < targetLanguages.length; i++) {
    const lang = targetLanguages[i];
    try {
      logger.log(`Translating to ${lang}...`);

      // テキストフィールドはバッチ翻訳、リッチテキストは構造保持のため個別翻訳
      const textsToTranslate = {};
      const richTextEntries = [];
      const sourceToTarget = {};

      FIELD_MAPPINGS.forEach(mapping => {
        const targetField = mapping.targets[lang];
        if (!targetField) return;

        sourceToTarget[mapping.source] = targetField;

        const value = content[mapping.source];
        if (value == null) {
          logger.warn(`Skipped: source field '${mapping.source}' is empty.`);
          return;
        }

        // 翻訳結果フィールドに既存値がある場合は翻訳しない（手動修正の保護）
        if (!isFieldBlank(content[targetField])) {
          logger.log(`Skipped: target field '${targetField}' already has a value. Clear the field to re-translate.`);
          return;
        }

        if (typeof value === 'string' && value.trim() !== '') {
          textsToTranslate[mapping.source] = value;
        } else if (typeof value === 'object' && value.json) {
          richTextEntries.push({ source: mapping.source, targetField });
        } else {
          logger.warn(`Skipped: source field '${mapping.source}' is not a text or rich text value.`);
        }
      });

      if (Object.keys(textsToTranslate).length > 0) {
        const translated = await translateTextFields(aiModules, textsToTranslate, lang, logger);
        Object.entries(translated).forEach(([sourceField, translatedValue]) => {
          patchFields[sourceToTarget[sourceField]] = translatedValue;
        });
      }

      // リッチテキストフィールドは { text, html, json } 構造。CMS APIの書き込みではjsonのみ有効
      for (let j = 0; j < richTextEntries.length; j++) {
        const { source, targetField } = richTextEntries[j];
        const translatedJson = await translateRichText(aiModules, content[source].json, lang, logger);
        patchFields[targetField] = { json: translatedJson };
      }
    } catch (error) {
      if (isRetryableError(error)) {
        throw new RetryableError(`Retryable error for ${lang}: ${error.message}`, RETRYABLE_TIMEOUT_MS);
      }
      logger.error(`Failed to translate to ${lang}: ${error.message}`);
      errors.push({ lang, error });
    }
  }

  if (errors.length > 0) {
    // 翻訳できた言語があれば部分的に保存し、翻訳リクエストフラグは維持して再保存でリトライ可能にする
    if (Object.keys(patchFields).length > 0) {
      try {
        await patchContent(client, contentId, patchFields);
        logger.log(`Partial update: ${Object.keys(patchFields).length} field(s) saved`);
      } catch (patchError) {
        logger.error(`Failed to save partial translation: ${patchError.message}`);
      }
    }
    throw new Error(`Translation failed for ${errors.length} language(s): ${errors.map(e => e.lang).join(', ')}. ${REQUEST_TRANSLATION_FIELD} flag is kept for retry.`);
  }

  if (Object.keys(patchFields).length === 0) {
    logger.warn('No translation fields were updated.');
  }

  // 翻訳完了後、request_translation を false に戻す
  try {
    await patchContent(client, contentId, {
      ...patchFields,
      [REQUEST_TRANSLATION_FIELD]: false,
    });
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(`Retryable error during final patch: ${error.message}`, RETRYABLE_TIMEOUT_MS);
    }
    throw error;
  }

  logger.log(`Translation completed for content ${contentId} (${targetLanguages.length} language(s), ${Object.keys(patchFields).length} field(s) updated)`);
}
