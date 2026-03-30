/**
 * ドキュメント検索エージェント（HTTP）: Vector Search + キーワード検索によるレコメンド、
 * およびオプションのワンショット実現可否判定。
 *
 * craft-codes 公開用テンプレートです。プロンプト・URL・シークレット名はサンプル値のため、
 * 本番利用前に必ず自社環境に合わせて変数・コードを調整してください。
 *
 * POST body:
 * {
 *   "type": "recommend" | "feasibilityCheck" | "checkRateLimit" | "reportViolation"
 *          | "saveQuery" | "saveAIResponse" | "saveFeedback",
 *   "text": "...",
 *   "visitorId": "...",
 *   ...
 * }
 */

const LOG_LEVEL = "<% LOG_LEVEL %>";
const ALLOWED_ORIGINS = "<% ALLOWED_ORIGINS %>";
const INDEX_ENDPOINT_ID = "<% INDEX_ENDPOINT_ID %>";
const RATE_LIMIT_PER_DAY = Number("<% RATE_LIMIT_PER_DAY %>" || "10");
const IP_RATE_LIMIT_PER_DAY = Number("<% IP_RATE_LIMIT_PER_DAY %>" || "20");
const DEFAULT_MODEL = "<% FEASIBILITY_MODEL %>";
const EMBEDDING_DIMENSION = 1408;
const VECTOR_TOP_K = 15;
const MAX_RELATED_ARTICLES = 5;
const FEASIBILITY_MAX_TOKENS = 512;
const MINUTES_TO_EXPIRE = 44640;

const KARTE_USER_API_URL = "<% KARTE_USER_API_URL %>";
const KARTE_API_SECRET_KEY = "<% KARTE_USER_LOOKUP_SECRET_KEY_NAME %>";
const INTERNAL_DOMAINS = "<% INTERNAL_EMAIL_DOMAINS %>"
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const USER_INFO_CACHE_MINUTES = 10080;

const MAX_INPUT_LENGTH = 2000;
const RERANK_TOP_N_RECOMMEND = 5;
const RERANK_CONTENT_CHARS = 1500;

const MIN_DISTANCE = Number("<% VECTOR_MIN_DISTANCE %>" || "0.10");

const ALLOWED_DOC_TYPES = ["blog", "developer_doc"];
const USER_VISIBLE_DOC_TYPES = ["blog"];
const BLOG_BASE_URL = "<% BLOG_PUBLIC_BASE_URL %>".replace(/\/$/, "");
const DEV_DOCS_BASE_URL = "<% DEVELOPER_DOCS_BASE_URL %>".replace(/\/$/, "");

// ─── CORS ──────────────────────────────────────────

function setCorsHeaders(res, origin) {
  const origins = ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  if (origins.includes(origin) || origins.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return true;
  }
  return false;
}

function handleCors(req, res, logger) {
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") {
    const allowed = setCorsHeaders(res, origin);
    if (allowed) res.status(204).send("");
    else {
      logger.warn(`Origin not allowed: ${origin}`);
      res.status(403).json({ error: "Origin not allowed" });
    }
    return false;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return false;
  }
  setCorsHeaders(res, origin || "*");
  return true;
}

// ─── メインハンドラー ─────────────────────────────────

export default async function (data, { MODULES }) {
  const { initLogger, docDb, vectorSearch, aiModules, kvs, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { res, req } = data;

  if (!handleCors(req, res, logger)) return;

  let body = req.body;
  if (typeof body === "string") body = JSON.parse(body);

  const { type } = body;
  const clientIp = (req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();
  const ctx = { docDb, vectorSearch, aiModules, kvs, secret, logger, clientIp };

  try {
    switch (type) {
      case "recommend":
        return await handleRecommend(body, ctx, res);
      case "feasibilityCheck":
        return await handleFeasibilityCheck(body, ctx, res);
      case "checkRateLimit":
        return await handleCheckRateLimit(body, ctx, res);
      case "reportViolation":
        return await handleReportViolation(body, ctx, res);
      case "saveQuery":
        return await handleSaveQuery(body, ctx, res);
      case "saveAIResponse":
        return await handleSaveAIResponse(body, ctx, res);
      case "saveFeedback":
        return await handleSaveFeedback(body, ctx, res);
      default:
        return res.status(400).json({
          error: `Unknown type: ${type}. Use "recommend", "feasibilityCheck", "checkRateLimit", etc.`,
        });
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mode 1: 記事レコメンド（LLM 不使用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleRecommend(body, ctx, res) {
  const { text } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: 'Missing required parameter: "text"' });
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `テキストが長すぎます（上限${MAX_INPUT_LENGTH}文字）` });
  }

  const { logger } = ctx;
  logger.debug(`[recommend] query: ${text.substring(0, 100)}`);

  const searchQueries = buildSearchQueries(text);
  const _debugInfo = { queries: searchQueries };

  const [vectorResults, keywordResults] = await Promise.all([
    Promise.all(
      searchQueries.map((q) =>
        vectorSearchAndResolve(q, ctx).catch((e) => {
          logger.warn(`[recommend] search failed: ${e.message}`);
          return [];
        })
      )
    ),
    keywordSearchDocuments(searchQueries[0], ctx),
  ]);

  _debugInfo.vectorCounts = vectorResults.map((r) => r.length);
  _debugInfo.keywordCount = keywordResults.length;
  _debugInfo.keywordDocIds = keywordResults.map((d) => d.docId);

  const merged = mergeDocuments([...vectorResults, keywordResults], 30);
  _debugInfo.mergedCount = merged.length;
  _debugInfo.mergedDocIds = merged.map((d) => d.docId);

  let articles;
  if (merged.length <= 1) {
    articles = merged;
    _debugInfo.rerankSkipped = true;
  } else {
    articles = await rerankDocuments(searchQueries[0], merged, RERANK_TOP_N_RECOMMEND, ctx);
    _debugInfo.rerankOutputCount = articles.length;
  }

  logger.debug(`[recommend] found ${articles.length} articles`);

  const visibleArticles = articles.filter((d) => USER_VISIBLE_DOC_TYPES.includes(d.docType));

  const relatedArticles = await findRelatedArticles(articles, ctx);
  const visibleRelated = relatedArticles.filter((d) => USER_VISIBLE_DOC_TYPES.includes(d.docType));
  logger.debug(`[recommend] found ${relatedArticles.length} related (${visibleRelated.length} visible)`);

  return res.json({
    type: "recommend",
    articles: visibleArticles.map(formatArticleCard),
    relatedArticles: visibleRelated.map(formatArticleCard),
    hasRelevantResults: visibleArticles.length > 0,
    _debug: _debugInfo,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mode 2: ワンショット実現可否判定（レート制限付き）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleFeasibilityCheck(body, ctx, res) {
  const { text, visitorId } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: 'Missing required parameter: "text"' });
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `テキストが長すぎます（上限${MAX_INPUT_LENGTH}文字）` });
  }
  if (!visitorId) {
    return res.status(400).json({ error: 'Missing required parameter: "visitorId"' });
  }

  const { logger, kvs, clientIp } = ctx;

  const ipResult = await checkAndIncrementIpRateLimit(clientIp, kvs, logger);
  if (ipResult.limited) {
    return res.json({
      type: "feasibilityCheck",
      limited: true,
      message: "本日の判定回数の上限に達しました。記事検索は引き続きご利用いただけます。",
    });
  }

  const rateResult = await checkAndIncrementRateLimit(visitorId, kvs, logger);
  if (rateResult.limited) {
    return res.json({
      type: "feasibilityCheck",
      limited: true,
      message: "本日の判定回数の上限に達しました。記事検索は引き続きご利用いただけます。",
    });
  }

  logger.debug(`[feasibilityCheck] need: ${text.substring(0, 100)}`);

  const systemInstruction = buildFeasibilityPrompt();
  const params = {
    contents: [{ role: "user", parts: [{ text }] }],
    model: DEFAULT_MODEL,
    systemInstruction,
    generationConfig: { maxOutputTokens: FEASIBILITY_MAX_TOKENS },
  };

  const response = await ctx.aiModules.gcpGeminiGenerateContent(params);

  if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const result = response.candidates[0].content.parts[0].text;
    logger.log(`[feasibilityCheck] completed for visitor=${visitorId}`);
    return res.json({
      type: "feasibilityCheck",
      limited: false,
      result,
    });
  }

  throw new Error("AIからの有効な回答がありませんでした。");
}

/**
 * 公開テンプレート用のサンプルシステムプロンプトです。
 * 本番では公式ドキュメントに基づく正しいプロダクト仕様へ差し替えてください。
 */
function buildFeasibilityPrompt() {
  return `あなたはKARTE Craftの実現可否を判定するシステムです。
ユーザーのニーズに対して、以下の【サンプル仕様】のみを根拠に厳密に判定してください。

※【サンプル仕様】は例示です。実運用では、自社の最新の公式ドキュメントに沿って
　本関数内の buildFeasibilityPrompt を編集し、正しい仕様テキストに差し替えてください。

## サンプル仕様（差し替え前提）

### Craft Functions（共通）
- Node.js サーバーレス実行環境（ES Modules）でコードを実行できます。
- 外部 HTTP リクエストや KARTE API の呼び出しが可能です。
- 入力サイズ・メモリなどに制約があります（詳細は公式ドキュメントを参照）。

### Craft Functions — HTTP タイプ
- HTTP エンドポイントとしてリクエストを受け付けられます。
- CORS は自動では付与されないため、必要に応じてコードで設定します。

### Craft Sites
- 静的コンテンツのホスティングに利用できます。

### Craft KVS / Craft Counter / Craft AI Modules / Craft Vector Search / Craft RAG / Craft Auth / Craft Cross CMS
- 利用可否・制限はプランやプロダクトの仕様に依存します。公式ドキュメントを参照してください。

### 横断的な注意
- 実行はステートレスです。状態保持には KVS 等の利用が必要です。

## 判定ルール
- ○: 仕様上は対応可能に見える（ただし詳細な要件次第で変わる可能性あり）
- △: 仕様上は可能に見えるが確信が持てない、または仕様に直接記載がない
- ✕: 仕様の制約に明確に反する

迷ったら必ず △ にしてください。○ は仕様で裏付けが取れる場合のみです。

## 回答フォーマット（厳守）
【判定】○ / △ / ✕ のいずれか1つ
【概要】2-3行で、なぜその判定になるか。
        具体的な構成手順・コード例・API名は出さないこと。
        どの判定でも末尾に「詳細な要件によって判定が変わる場合があります」旨を含めること。
【必要な機能】実現に必要と想定されるプロダクト・機能を箇条書きで列挙。
              各項目に「何のために使うか」を1文で添えること。
              例: - Craft Functions（HTTP タイプ）: 外部APIとの連携エンドポイントとして
                   - Craft KVS: 処理状態の一時保存に

## 絶対遵守
- 仕様に記載のない機能を捏造しない
- 料金・プラン・費用には一切言及しない
- 技術的な詳細（コード、API名、設定手順）は出さない
- 1回の回答で完結させる（追加質問はしない）
- 具体的なパフォーマンス要件、外部サービス側の制約に依存するもの、プラン固有の制限値に依存するものは △ とする`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// レート制限
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getRateLimitKey(visitorId) {
  const today = new Date().toISOString().split("T")[0];
  return `ratelimit_${visitorId}_${today}`;
}

async function checkAndIncrementRateLimit(visitorId, kvs, logger) {
  const key = getRateLimitKey(visitorId);
  try {
    const existing = await kvs.get({ key });
    const current = existing?.[key]?.value?.count || 0;

    if (current >= RATE_LIMIT_PER_DAY) {
      logger.log(`[rateLimit] limit reached for ${visitorId}: ${current}/${RATE_LIMIT_PER_DAY}`);
      return { limited: true, remaining: 0, count: current };
    }

    const newCount = current + 1;
    await kvs.write({
      key,
      value: { visitorId, count: newCount, lastAccess: Date.now() },
      minutesToExpire: 1440,
    });

    const remaining = RATE_LIMIT_PER_DAY - newCount;
    logger.debug(`[rateLimit] ${visitorId}: ${newCount}/${RATE_LIMIT_PER_DAY} (remaining: ${remaining})`);
    return { limited: false, remaining, count: newCount };
  } catch (e) {
    logger.warn(`[rateLimit] check failed: ${e.message}, allowing request`);
    return { limited: false, remaining: RATE_LIMIT_PER_DAY - 1, count: 1 };
  }
}

function getIpRateLimitKey(ip) {
  const today = new Date().toISOString().split("T")[0];
  return `ratelimit_ip_${ip.replace(/[.:]/g, "_")}_${today}`;
}

async function checkAndIncrementIpRateLimit(ip, kvs, logger) {
  if (!ip || ip === "unknown") return { limited: false };
  const key = getIpRateLimitKey(ip);
  try {
    const existing = await kvs.get({ key });
    const current = existing?.[key]?.value?.count || 0;

    if (current >= IP_RATE_LIMIT_PER_DAY) {
      logger.log(`[ipRateLimit] limit reached for ${ip}: ${current}/${IP_RATE_LIMIT_PER_DAY}`);
      return { limited: true, count: current };
    }

    const newCount = current + 1;
    await kvs.write({
      key,
      value: { ip, count: newCount, lastAccess: Date.now() },
      minutesToExpire: 1440,
    });

    logger.debug(`[ipRateLimit] ${ip}: ${newCount}/${IP_RATE_LIMIT_PER_DAY}`);
    return { limited: false, count: newCount };
  } catch (e) {
    logger.warn(`[ipRateLimit] check failed: ${e.message}, allowing request`);
    return { limited: false };
  }
}

async function handleCheckRateLimit(body, ctx, res) {
  const { visitorId } = body;
  if (!visitorId) {
    return res.status(400).json({ error: 'Missing required parameter: "visitorId"' });
  }
  const key = getRateLimitKey(visitorId);
  try {
    const existing = await ctx.kvs.get({ key });
    const current = existing?.[key]?.value?.count || 0;
    const remaining = Math.max(0, RATE_LIMIT_PER_DAY - current);
    return res.json({
      type: "checkRateLimit",
      count: current,
      remaining,
      limit: RATE_LIMIT_PER_DAY,
      limited: remaining === 0,
    });
  } catch (e) {
    return res.json({
      type: "checkRateLimit",
      count: 0,
      remaining: RATE_LIMIT_PER_DAY,
      limit: RATE_LIMIT_PER_DAY,
      limited: false,
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// テキスト正規化・クエリ拡張
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STOP_WORDS = [
  "について", "教えて", "知りたい", "ですか", "ください", "下さい", "したい", "できますか",
  "どうすれば", "方法", "やり方", "とは", "って", "何", "どう", "する", "ある",
  "この", "その", "あの", "どの", "から", "まで", "ので", "ため", "こと",
  "もの", "ように", "として", "ような", "に関して", "に関する", "における",
  "施策", "やりたい", "やって", "やる", "作りたい", "作る", "使いたい", "使う",
];

function buildSearchQueries(userMessage) {
  const queries = [userMessage];

  let keywords = userMessage;
  for (const sw of STOP_WORDS) {
    keywords = keywords.replace(new RegExp(sw, "g"), " ");
  }
  keywords = keywords.replace(/[のをにでがはとへやもか？?！!。、.,\s]+/g, " ").trim();
  if (keywords && keywords !== userMessage) {
    queries.push(keywords);
  }

  if (keywords) {
    queries.push(`Craft Functionsを使って${keywords}する方法`);
  }

  const craftQueries = queries.map((q) =>
    /karte|craft|クラフト/i.test(q) ? q : `KARTE Craft ${q}`
  );

  return [...new Set([...queries, ...craftQueries])].slice(0, 6);
}

function extractTagKeywords(userMessage) {
  let text = userMessage;
  for (const sw of STOP_WORDS) {
    text = text.replace(new RegExp(sw, "g"), " ");
  }
  text = text.replace(/[のをにでがはとへやもか？?！!。、.,\s]+/g, " ").trim();

  const tokens = text.split(/\s+/).filter((t) => t.length >= 2);
  return [...new Set(tokens)];
}

async function keywordSearchDocuments(userMessage, ctx) {
  const { docDb, logger } = ctx;
  const keywords = extractTagKeywords(userMessage);
  if (keywords.length === 0) return [];

  logger.debug(`[keywordSearch] keywords=${JSON.stringify(keywords)}`);

  const seen = new Set();
  const results = [];

  function addDocs(data) {
    if (!data) return;
    for (const doc of data) {
      if (!seen.has(doc.docId) && ALLOWED_DOC_TYPES.includes(doc.docType)) {
        seen.add(doc.docId);
        results.push(doc);
      }
    }
  }

  try {
    const tagResult = await docDb.find({
      collectionName: "rag_documents",
      where: {
        tags: { hasAny: keywords.slice(0, 10) },
      },
      take: 50,
    });
    logger.debug(`[keywordSearch] broad search returned ${tagResult?.data?.length || 0} docs`);
    addDocs(tagResult?.data);
  } catch (e) {
    logger.warn(`[keywordSearch] broad tag search failed: ${e.message}`);
  }

  const specificKeywords = keywords.filter((kw) => kw.length >= 3);
  const individualSearches = specificKeywords.slice(0, 3).map((kw) =>
    docDb
      .find({
        collectionName: "rag_documents",
        where: { tags: { hasAny: [kw] } },
        take: 15,
      })
      .catch(() => null)
  );

  const individualResults = await Promise.all(individualSearches);
  for (const r of individualResults) {
    addDocs(r?.data);
  }

  if (keywords.length > 1) {
    const kwLower = keywords.map((k) => k.toLowerCase());
    results.sort((a, b) => {
      const scoreA = (a.tags || []).filter((t) =>
        kwLower.some((k) => t.toLowerCase().includes(k))
      ).length;
      const scoreB = (b.tags || []).filter((t) =>
        kwLower.some((k) => t.toLowerCase().includes(k))
      ).length;
      return scoreB - scoreA;
    });
  }

  logger.debug(`[keywordSearch] ${results.length} docs from ${keywords.length} keywords`);
  return results;
}

function mergeDocuments(docArrays, limit) {
  const seen = new Set();
  const merged = [];
  for (const docs of docArrays) {
    for (const doc of docs) {
      if (!seen.has(doc.docId)) {
        seen.add(doc.docId);
        merged.push(doc);
      }
    }
  }
  return merged.slice(0, limit);
}

async function findRelatedArticles(mainArticles, ctx) {
  if (mainArticles.length === 0) return [];

  const { docDb, logger } = ctx;
  const mainDocIds = new Set(mainArticles.map((a) => a.docId));
  const allTags = [...new Set(mainArticles.flatMap((a) => a.tags || []))];

  if (allTags.length === 0) return [];

  try {
    const result = await docDb.find({
      collectionName: "rag_documents",
      where: {
        tags: { hasAny: allTags.slice(0, 5) },
        docType: { in: ALLOWED_DOC_TYPES },
      },
      take: MAX_RELATED_ARTICLES + mainArticles.length,
    });

    if (!result?.data) return [];

    return result.data
      .filter((d) => !mainDocIds.has(d.docId))
      .slice(0, MAX_RELATED_ARTICLES);
  } catch (e) {
    logger.warn(`[relatedArticles] failed: ${e.message}`);
    return [];
  }
}

async function vectorSearchAndResolve(query, ctx) {
  const { aiModules, vectorSearch, docDb, logger } = ctx;

  const embeddingResult = await aiModules.gcpEmbeddingsMulti({
    text: query,
    dimension: EMBEDDING_DIMENSION,
  });
  const featureVector = embeddingResult.predictions[0].textEmbedding;

  const { nearestNeighbors } = await vectorSearch.findNeighbors({
    indexEndpointId: INDEX_ENDPOINT_ID,
    queries: [{ datapoint: { feature_vector: featureVector }, neighborCount: VECTOR_TOP_K }],
  });

  if (!nearestNeighbors?.[0]?.neighbors) return [];

  const filteredNeighbors = nearestNeighbors[0].neighbors.filter((n) => {
    const dist = n.distance ?? 0;
    return dist >= MIN_DISTANCE;
  });

  if (filteredNeighbors.length === 0) {
    logger.debug(`[vectorSearch] all ${nearestNeighbors[0].neighbors.length} results below MIN_DISTANCE=${MIN_DISTANCE}`);
    return [];
  }

  logger.debug(`[vectorSearch] ${filteredNeighbors.length}/${nearestNeighbors[0].neighbors.length} passed distance filter (>=${MIN_DISTANCE})`);

  const chunkPromises = filteredNeighbors.map(async (neighbor) => {
    const chunkId = neighbor.datapoint?.datapointId || neighbor.datapoint_id;
    if (!chunkId) return null;
    try {
      const r = await docDb.find({ collectionName: "rag_chunks", where: { chunkId }, take: 1 });
      return r?.data?.[0]?.docId || null;
    } catch (e) {
      logger.warn(`Chunk fetch failed: ${chunkId}: ${e.message}`);
      return null;
    }
  });

  const docIdResults = await Promise.all(chunkPromises);
  const docIds = [...new Set(docIdResults.filter(Boolean))];

  const docPromises = docIds.map(async (docId) => {
    try {
      const r = await docDb.find({ collectionName: "rag_documents", where: { docId }, take: 1 });
      if (r?.data?.[0] && ALLOWED_DOC_TYPES.includes(r.data[0].docType)) {
        return r.data[0];
      }
      return null;
    } catch (e) {
      logger.warn(`Doc fetch failed: ${docId}: ${e.message}`);
      return null;
    }
  });

  return (await Promise.all(docPromises)).filter(Boolean);
}

async function rerankDocuments(query, docs, topN, ctx) {
  const { aiModules, logger } = ctx;
  if (docs.length <= 1) return docs;

  try {
    const records = docs.map((doc) => ({
      id: doc.docId,
      title: doc.title || "",
      content: [
        doc.description || "",
        (doc.tags || []).join(", "),
        (doc.content || "").substring(0, RERANK_CONTENT_CHARS),
      ].join("\n"),
    }));

    const result = await aiModules.gcpRerank({
      query,
      records,
      topN: Math.min(topN, docs.length),
      ignoreRecordDetailsInResponse: true,
    });

    logger.debug(`[rerank] API returned ${result?.records?.length || 0} records, keys=${result?.records?.[0] ? Object.keys(result.records[0]).join(',') : 'N/A'}`);

    if (!result?.records?.length) {
      logger.warn("[rerank] no results returned, falling back to original order");
      return docs.slice(0, topN);
    }

    const docMap = new Map(docs.map((d) => [d.docId, d]));
    const reranked = result.records
      .sort((a, b) => b.score - a.score)
      .map((r) => docMap.get(r.id))
      .filter(Boolean);

    logger.debug(`[rerank] ${docs.length} -> ${reranked.length} docs (topN=${topN}), firstRecord=${JSON.stringify(result.records[0])}`);
    return reranked;
  } catch (e) {
    logger.warn(`[rerank] failed: ${e.message}, falling back to original order`);
    return docs.slice(0, topN);
  }
}

function buildArticleUrl(doc) {
  if (doc.docType === "blog") {
    if (doc.urlSlug && doc.urlSlug.includes("/")) {
      return `${BLOG_BASE_URL}/${doc.urlSlug}/`;
    }
    if (doc.date) {
      try {
        const d = new Date(doc.date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const slug = doc.urlSlug || doc.docId.replace(/^blog:/, "");
        return `${BLOG_BASE_URL}/${year}/${month}/${slug}/`;
      } catch {
        // fall through
      }
    }
  }
  if (doc.docType === "developer_doc") {
    const path = doc.docId.replace(/^developer_doc:/, "").replace(/--/g, "/");
    return `${DEV_DOCS_BASE_URL}/${path}`;
  }
  return BLOG_BASE_URL;
}

function formatArticleCard(doc) {
  return {
    docId: doc.docId,
    title: doc.title || "",
    description: doc.description || "",
    tags: doc.tags || [],
    docType: doc.docType || "",
    date: doc.date || "",
    url: buildArticleUrl(doc),
  };
}

async function handleReportViolation(body, ctx, res) {
  const { violation } = body;
  if (!violation) {
    return res.status(400).json({ error: 'Missing required parameter: "violation"' });
  }

  const { docDb, logger } = ctx;
  const now = new Date();
  const logId = `violation_${now.getTime()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    await docDb.insert({
      collectionName: "access_violations",
      data: {
        logId,
        userAgent: violation.userAgent || "",
        referrer: violation.referrer || "",
        url: violation.url || "",
        timestamp: now.toISOString(),
        date: now.toISOString().split("T")[0],
      },
    });
    logger.log(`[violation] recorded: ${logId} from ${violation.referrer || "direct"}`);
  } catch (e) {
    logger.warn(`[violation] save failed: ${e.message}`);
  }

  return res.json({ success: true });
}

async function handleSaveQuery(body, ctx, res) {
  const { userId, itemId, query } = body;
  if (!userId || !itemId || !query) {
    return res.status(400).json({ error: "Missing required parameters: userId, itemId, query" });
  }
  const { kvs } = ctx;

  const [, userInfo] = await Promise.all([
    kvs.write({
      key: `${userId}_${itemId}`,
      value: { userId, itemId, query, timestamp: Date.now() },
      minutesToExpire: MINUTES_TO_EXPIRE,
    }),
    getCachedUserInfo(ctx, userId),
  ]);

  await saveLogToDocDb(ctx, {
    logId: `${userId}_${itemId}`,
    userId,
    itemId: String(itemId),
    query,
    aiResponse: "",
    feedback: "",
    email: userInfo?.email || "",
    isInternal: userInfo?.isInternal ?? null,
    fromTemplate: body.fromTemplate === true,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
  });
  return res.json({ success: true });
}

async function handleSaveAIResponse(body, ctx, res) {
  const { userId, itemId, aiResponse } = body;
  if (!userId || !itemId || !aiResponse) {
    return res.status(400).json({ error: "Missing required parameters: userId, itemId, aiResponse" });
  }
  const { kvs } = ctx;
  const key = `${userId}_${itemId}`;
  const existing = await kvs.get({ key });
  const prev = existing?.[key]?.value || {};
  const kvsWrite = kvs.write({
    key,
    value: { ...prev, userId, itemId, aiResponse, aiResponseTimestamp: Date.now() },
    minutesToExpire: MINUTES_TO_EXPIRE,
  });
  const logUpdate = updateLogInDocDb(ctx, `${userId}_${itemId}`, { aiResponse });
  await Promise.all([kvsWrite, logUpdate]);
  return res.json({ success: true });
}

async function handleSaveFeedback(body, ctx, res) {
  const { userId, itemId, feedback } = body;
  if (!userId || !itemId) {
    return res.status(400).json({ error: "Missing required parameters: userId, itemId" });
  }
  const { kvs } = ctx;
  const key = `${userId}_${itemId}`;
  const existing = await kvs.get({ key });
  const prev = existing?.[key]?.value || {};
  const kvsWrite = kvs.write({
    key,
    value: { ...prev, userId, itemId, feedback, feedbackTimestamp: Date.now() },
    minutesToExpire: MINUTES_TO_EXPIRE,
  });
  const logUpdate = updateLogInDocDb(ctx, `${userId}_${itemId}`, { feedback });
  await Promise.all([kvsWrite, logUpdate]);
  return res.json({ success: true });
}

async function getCachedUserInfo(ctx, userId) {
  if (!userId || userId === "anonymous" || userId.startsWith("v_")) return null;
  const { kvs, secret, logger } = ctx;
  try {
    const cacheKey = `uinfo_${userId}`;
    const cached = await kvs.get({ key: cacheKey });
    if (cached?.[cacheKey]?.value) return cached[cacheKey].value;

    const secrets = await secret.get({ keys: [KARTE_API_SECRET_KEY] });
    const apiToken = secrets[KARTE_API_SECRET_KEY];
    if (!apiToken) { logger.warn("KARTE API token not configured"); return null; }

    const resp = await fetch(KARTE_USER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!resp.ok) { logger.warn(`KARTE user API ${resp.status} for ${userId}`); return null; }

    const data = await resp.json();
    const dims = data.dimensions || {};
    let email = null;
    for (const val of Object.values(dims)) {
      if (typeof val === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { email = val; break; }
    }
    const domain = email ? email.split("@")[1].toLowerCase() : null;
    const isInternal = domain && INTERNAL_DOMAINS.length > 0 ? INTERNAL_DOMAINS.includes(domain) : null;
    const info = { email, isInternal };

    await kvs.write({ key: cacheKey, value: info, minutesToExpire: USER_INFO_CACHE_MINUTES }).catch(() => {});
    logger.debug(`[userInfo] ${userId} → email=${email}, isInternal=${isInternal}`);
    return info;
  } catch (e) {
    logger.warn(`getCachedUserInfo failed for ${userId}: ${e.message}`);
    return null;
  }
}

async function saveLogToDocDb(ctx, logData) {
  const { docDb, logger } = ctx;
  try {
    await docDb.insert({ collectionName: "public_chat_logs", data: logData });
  } catch (e) {
    logger.error(`[saveLog] insert failed for ${logData.logId}: ${e.message}`);
  }
}

async function updateLogInDocDb(ctx, logId, updates, retries = 2) {
  const { docDb, logger } = ctx;
  for (let i = 0; i <= retries; i++) {
    try {
      const existing = await docDb.find({
        collectionName: "public_chat_logs",
        where: { logId },
        take: 1,
      });
      if (existing?.data?.[0]) {
        await docDb.update({
          collectionName: "public_chat_logs",
          where: { logId },
          data: updates,
        });
        return;
      }
      if (i < retries) {
        logger.debug(`[updateLog] doc not found yet (${logId}), retry ${i + 1}/${retries}`);
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (e) {
      logger.warn(`[updateLog] attempt ${i + 1} failed (${logId}): ${e.message}`);
      if (i < retries) await new Promise((r) => setTimeout(r, 500));
    }
  }
  logger.warn(`[updateLog] doc not found after ${retries} retries (${logId}), skipping`);
}
