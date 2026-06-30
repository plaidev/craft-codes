import api from 'api';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_APP_SPEC_URI_CMS = '@dev-karte/v1.0#4inqt6kmj2q3mtr';
const KARTE_CDN_API_SUBDOMAIN = '<% KARTE_CDN_API_SUBDOMAIN %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const RERANK_TOP_N_NUM = '<% RERANK_TOP_N_NUM %>';
const CMS_FIELD_FOR_TITLE = '<% CMS_FIELD_FOR_TITLE %>';
const CMS_FIELD_FOR_CONTENT = '<% CMS_FIELD_FOR_CONTENT %>';

async function getToken(secret) {
  const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
  return secrets[KARTE_APP_TOKEN_SECRET];
}

async function getCraftCMSContents(client) {
  // 最新のコンテンツ100件を取得しています
  // これ以外にも、作成日や更新日等に対する期間指定によるフィルターが可能です
  const res = await client.getBetaCmsContentList({
    modelId: CMS_MODEL_ID,
    'order[0]': '-sys.raw.updatedAt',
    limit: 100
  });

  return res.data.items;
}

async function rerankContents(aiModules, query, contents) {
  const { records: rerankedContents } = await aiModules.gcpRerank({
    query,
    records: contents,
    topN: RERANK_TOP_N_NUM,
    ignoreRecordDetailsInResponse: false
  });

  return rerankedContents;
}

function mappingContents(contents) {
  return contents.map(v => {
    const { id } = v;
    const title = v[CMS_FIELD_FOR_TITLE];
    const contentField = v[CMS_FIELD_FOR_CONTENT];

    // CMS内コンテンツのフィールドデータがリッチテキスト形式の場合を考慮
    const content = typeof contentField === 'object' ? contentField.text : contentField;

    return {
      id,
      title,
      content
    };
  });
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { query } = req.body;
  const { initLogger, secret, aiModules } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const client = api(KARTE_APP_SPEC_URI_CMS);
    const token = await getToken(secret);

    client.server(`https://${KARTE_CDN_API_SUBDOMAIN}.cdn-api.karte.io/beta/cms/content/list`);
    client.auth(token);

    const contents = await getCraftCMSContents(client);

    if (contents.length === 0) {
      logger.warn('CMS上にコンテンツが存在しません。');
      return res.json({ rerankedContents: [] });
    }

    if (!query) {
      const defaultContents = mappingContents(
        contents.slice(0, RERANK_TOP_N_NUM)
      );
      return res.json({ rerankedContents: defaultContents });
    }

    const rerankedContents = await rerankContents(
      aiModules,
      query,
      mappingContents(contents)
    );

    return res.json({ rerankedContents });
  } catch (e) {
    logger.error('コンテンツの順位付けに失敗しました。:', e);
    throw e;
  }
}