import api from 'api';
import { JWT } from 'google-auth-library';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const SHOPIFY_APP_CLIENT_ID = '<% SHOPIFY_APP_CLIENT_ID %>';
const SHOPIFY_APP_CLIENT_SECRET_NAME = '<% SHOPIFY_APP_CLIENT_SECRET_NAME %>';
const SHOPIFY_SHOP_INTERNAL_DOMAIN = '<% SHOPIFY_SHOP_INTERNAL_DOMAIN %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const MERCHANT_CENTER_ID = '<% MERCHANT_CENTER_ID %>';
const MERCHANT_DATASOURCE_PATH = '<% MERCHANT_DATASOURCE_PATH %>';
const RETENTION_DAYS = '<% RETENTION_DAYS %>';
const CONTENT_LANGUAGE = 'ja'; // 言語
const FEED_LABEL = 'JP'; // ターゲット国

// Craft Cross CMSのフィールド名とのマッピング
const CMS_FIELDS = {
  SKU: 'sku',
  FLAG: 'ad_feed_flag',
  TITLE: 'feed_ad_title',
  DESCRIPTION: 'feed_ad_description',
  CONDITION: 'product_condition',
  CATEGORY: 'google_product_category',
};

/**
 * CMSからコンテンツ詳細を取得
 */
async function fetchCmsContent({ modelId, contentId, token, logger }) {
  const cmsClient = api('@dev-karte/v1.0#lidu95tmk68fxdn');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentGet({ modelId, contentId });
    return contentResponse.data;
  } catch (error) {
    logger.error(`[CMS Error] Failed to fetch content (${contentId}): ${error.message}`);
    throw error;
  }
}

/**
 * CMSからコンテンツ一覧を取得
 */
async function fetchCmsContentList({ modelId, token, logger }) {
  const cmsClient = api('@dev-karte/v1.0#lidu95tmk68fxdn');
  try {
    cmsClient.auth(token);
    const contentResponse = await cmsClient.postV2betaCmsContentList({
      order: ['-sys.raw.updatedAt'],
      skip: 0,
      limit: 1000,
      modelId,
    });
    return contentResponse.data;
  } catch (error) {
    logger.error(`[CMS Error] Failed to fetch content list: ${error.message}`);
    throw error;
  }
}

/**
 * Shopifyアクセストークン取得
 */
async function getShopifyAccessToken({ shopDomain, clientId, clientSecret, logger }) {
  const url = `https://${shopDomain}/admin/oauth/access_token`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    logger.error(`[Shopify Auth Error] Failed to get access token: ${error.message}`);
    return null;
  }
}

/**
 * SKUを元にShopifyから商品情報を取得
 */
async function fetchShopifyProductBySku({ shopDomain, accessToken, sku, RetryableError, logger }) {
  const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

  // Shopifyから抽出する項目は必要に応じて変更してください
  const query = `query getProductBySku($query: String!) {
    productVariants(first: 1, query: $query) {
      edges {
        node {
          id sku price barcode compareAtPrice inventoryQuantity
          product { id title vendor productType handle status onlineStoreUrl descriptionHtml 
            images(first: 10) { edges { node { url } } }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables: { query: `sku:${sku}` } }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status >= 500 || status === 429) {
        throw new RetryableError(`Shopify API Temp Error: ${status}`, 3600);
      }
      const errorText = await response.text();
      throw new Error(`Shopify API Permanent Error: ${status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.errors) {
      const isThrottled = JSON.stringify(result.errors).includes('THROTTLED');
      if (isThrottled) {
        throw new RetryableError(`Shopify GraphQL Throttled`, 3600);
      }
      throw new Error(`Shopify GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    return result.data?.productVariants?.edges[0]?.node || null;
  } catch (error) {
    if (error.name === 'RetryableError') throw error;

    if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
      throw new RetryableError(`Shopify Network Error: ${error.message}`, 3600);
    }

    logger.error(`[Shopify Critical Error] SKU: ${sku}, Message: ${error.message}`);
    return null;
  }
}

/**
 * Google Merchant API v1 準拠のマッピング関数
 */
function buildMerchantProduct({ contentData, shopifyProduct, logger }) {
  try {
    const priceValue = parseFloat(shopifyProduct.price);
    const imageEdges = shopifyProduct.product.images.edges;
    const imageLink = imageEdges[0]?.node.url;
    const link = shopifyProduct.product.onlineStoreUrl;

    // URL形式のバリデーションチェック
    if (!imageLink || !imageLink.startsWith('http')) {
      logger.error(`[Mapping Error] SKU: ${contentData.sku} の画像URLが不正です: ${imageLink}`);
      return null;
    }
    if (!link || !link.startsWith('http')) {
      logger.error(`[Mapping Error] SKU: ${contentData.sku} の商品URLが不正です: ${link}`);
      return null;
    }

    const rawTitle = contentData[CMS_FIELDS.TITLE] || '';
    const rawDescription = contentData[CMS_FIELDS.DESCRIPTION] || '';
    const rawCondition = contentData[CMS_FIELDS.CONDITION] || 'new';
    const rawCategory = contentData[CMS_FIELDS.CATEGORY] || '';

    const cleanTitle = rawTitle.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 150);
    const cleanDescription = rawDescription.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 5000);

    // まずは必須もしくはそれに準ずる送信項目のマッピング
    const product = {
      offerId: contentData[CMS_FIELDS.SKU],
      title: cleanTitle,
      description: cleanDescription,
      link,
      imageLink,
      contentLanguage: CONTENT_LANGUAGE,
      feedLabel: FEED_LABEL,
      availability: shopifyProduct.inventoryQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      condition: rawCondition.toUpperCase(),
      price: {
        amountMicros: String(Math.round(priceValue * 1000000)),
        currencyCode: 'JPY',
      },
      brand: shopifyProduct.product.vendor,
      googleProductCategory: String(rawCategory),
    };

    // ここから先は任意項目、取得したデータに該当するものが存在すれば送信項目に追加する
    if (imageEdges.length > 1) {
      product.additionalImageLinks = imageEdges
        .slice(1, 11)
        .map(edge => edge.node.url)
        .filter(url => url && url.startsWith('http'));
    }

    if (shopifyProduct.product.id) {
      product.itemGroupId = shopifyProduct.product.id.split('/').pop();
    }

    if (shopifyProduct.barcode) {
      const cleanGtin = shopifyProduct.barcode.replace(/[-\s]/g, '');
      const validGtinLengths = [8, 12, 13, 14];
      if (/^\d+$/.test(cleanGtin) && validGtinLengths.includes(cleanGtin.length)) {
        product.gtin = cleanGtin;
      } else {
        logger.warn(
          `[Validation Warning] SKU: ${contentData.sku} の GTIN (${shopifyProduct.barcode}) は形式不備のため除外されました。`
        );
      }
    }

    if (shopifyProduct.compareAtPrice) {
      const originalPriceValue = parseFloat(shopifyProduct.compareAtPrice);
      if (originalPriceValue > priceValue) {
        product.price.amountMicros = String(Math.round(originalPriceValue * 1000000));
        product.salePrice = {
          amountMicros: String(Math.round(priceValue * 1000000)),
          currencyCode: 'JPY',
        };
      }
    }

    return product;
  } catch (error) {
    logger.error(`[Mapping Critical Error] SKU: ${contentData.sku}: ${error.message}`);
    return null;
  }
}

/**
 * Google Merchant API 送信
 */
async function insertProductToMerchantApi({
  merchantProduct,
  jsonKey,
  merchantId,
  dataSource,
  RetryableError,
  logger,
}) {
  const client = new JWT({
    email: jsonKey.client_email,
    key: jsonKey.private_key,
    scopes: ['https://www.googleapis.com/auth/content'],
  });

  const url = `https://merchantapi.googleapis.com/products/v1/accounts/${merchantId}/productInputs:insert?dataSource=${dataSource}`;

  const requestBody = {
    offerId: merchantProduct.offerId,
    contentLanguage: CONTENT_LANGUAGE,
    feedLabel: FEED_LABEL,
    productAttributes: {
      title: merchantProduct.title,
      description: merchantProduct.description,
      link: merchantProduct.link,
      imageLink: merchantProduct.imageLink,
      availability: merchantProduct.availability,
      condition: merchantProduct.condition,
      brand: merchantProduct.brand,
      googleProductCategory: merchantProduct.googleProductCategory,
      price: {
        amountMicros: merchantProduct.price.amountMicros,
        currencyCode: merchantProduct.price.currencyCode,
      },
      gtins: merchantProduct.gtin ? [merchantProduct.gtin] : undefined,
      itemGroupId: merchantProduct.itemGroupId,
      additionalImageLinks: merchantProduct.additionalImageLinks,
    },
  };

  if (merchantProduct.salePrice) {
    requestBody.productAttributes.salePrice = {
      amountMicros: merchantProduct.salePrice.amountMicros,
      currencyCode: merchantProduct.salePrice.currencyCode,
    };
  }

  const clean = obj => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) clean(obj[key]);
      else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
  };

  try {
    const finalData = clean(requestBody);
    logger.debug(`[API Request] Replicating success: ${finalData.offerId}`);

    const response = await client.request({
      url,
      method: 'POST',
      data: finalData,
    });
    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const detail = error.response ? JSON.stringify(error.response.data) : error.message;

    if (status >= 500 || status === 429) {
      throw new RetryableError(`Merchant API Temp Error: ${status}`, 3600);
    }
    logger.error(`[Merchant API Permanent Error] Status: ${status}. Detail: ${detail}`);
    throw error;
  }
}

/**
 * Google Merchant APIで削除用の関数、404の例外処理も入れる
 * 404 (既に削除済み) の場合は正常終了として扱う
 */
async function deleteProductFromMerchantApi({
  sku,
  jsonKey,
  merchantId,
  dataSource,
  RetryableError,
  logger,
}) {
  const client = new JWT({
    email: jsonKey.client_email,
    key: jsonKey.private_key,
    scopes: ['https://www.googleapis.com/auth/content'],
  });

  const productId = `${CONTENT_LANGUAGE}~${FEED_LABEL}~${sku}`;
  const url = `https://merchantapi.googleapis.com/products/v1/accounts/${merchantId}/productInputs/${productId}?dataSource=${encodeURIComponent(dataSource)}`;

  try {
    logger.debug(`[API Request] Attempting to delete SKU: ${sku}`);
    await client.request({ url, method: 'DELETE' });
    logger.debug(`[API Success] Successfully deleted SKU: ${sku} from Merchant Center.`);
    return { status: 200, message: 'Deleted' };
  } catch (error) {
    const status = error.response ? error.response.status : 500;

    // すでに存在しない場合は成功とみなす
    if (status === 404) {
      logger.debug(`[API Success] SKU: ${sku} was already deleted (404 Not Found).`);
      return { status: 200, message: 'Already deleted' };
    }

    if (status >= 500 || status === 429) {
      throw new RetryableError(`Merchant API Temp Error (Delete): ${status}`, 3600);
    }
    logger.error(`[API Error] Delete operation failed for SKU: ${sku}. Status: ${status}`);
    throw error;
  }
}

/**
 * 有効な商品の同期処理（Shopify取得 -> Merchant入稿）
 */
async function syncActiveProduct({ contentData, shopifyToken, jsonKey, RetryableError, logger }) {
  const sku = contentData[CMS_FIELDS.SKU];
  const shopifyProduct = await fetchShopifyProductBySku({
    shopDomain: SHOPIFY_SHOP_INTERNAL_DOMAIN,
    accessToken: shopifyToken,
    sku,
    RetryableError,
    logger,
  });

  if (!shopifyProduct || shopifyProduct.product.status !== 'ACTIVE') {
    logger.warn(`[Skip] SKU: ${sku} is not active in Shopify.`);
    return;
  }

  const merchantProduct = buildMerchantProduct({ contentData, shopifyProduct, logger });
  if (!merchantProduct) return;

  await insertProductToMerchantApi({
    merchantProduct,
    jsonKey,
    merchantId: MERCHANT_CENTER_ID,
    dataSource: MERCHANT_DATASOURCE_PATH,
    RetryableError,
    logger,
  });
}

/**
 * CMS Hook実行時のハンドリング
 */
async function handleCmsHook({ data, secrets, shopifyToken, RetryableError, logger }) {
  const eventType = data.jsonPayload.event_type;
  if (eventType !== 'cms/content/publish' && eventType !== 'cms/content/unpublish') {
    return;
  }

  const contentId = data.jsonPayload.data?.sys?.raw?.contentId || data.jsonPayload.data?.id;
  if (!contentId) return;

  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

  const contentData = await fetchCmsContent({
    modelId: CMS_MODEL_ID,
    contentId,
    token: secrets[KARTE_APP_TOKEN_SECRET],
    logger,
  });

  const sku = contentData[CMS_FIELDS.SKU];

  if (eventType === 'cms/content/unpublish' || contentData[CMS_FIELDS.FLAG] !== true) {
    await deleteProductFromMerchantApi({
      sku,
      jsonKey,
      merchantId: MERCHANT_CENTER_ID,
      dataSource: MERCHANT_DATASOURCE_PATH,
      RetryableError,
      logger,
    });

    const reason = eventType === 'cms/content/unpublish' ? 'Unpublished' : 'Flag OFF';
    logger.log(`[Hook] Deleted SKU: ${sku} (Reason: ${reason})`);
  } else {
    await syncActiveProduct({
      contentData,
      shopifyToken,
      jsonKey,
      RetryableError,
      logger,
    });
    logger.log(`[Hook] Successfully updated SKU: ${sku}`);
  }
}

/**
 * スケジュール実行時のハンドリング
 */
async function handleScheduler({ secrets, shopifyToken, RetryableError, logger }) {
  const rawContentList = await fetchCmsContentList({
    modelId: CMS_MODEL_ID,
    token: secrets[KARTE_APP_TOKEN_SECRET],
    logger,
  });

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - RETENTION_DAYS);

  const targetItems = rawContentList.items.filter(
    item => new Date(item.sys.raw.updatedAt) >= thresholdDate
  );

  logger.log(`[Batch] Processing ${targetItems.length} items (including potential deletes).`);
  const jsonKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);

  for (let i = 0; i < targetItems.length; i += 1) {
    const item = targetItems[i];
    const sku = item[CMS_FIELDS.SKU];

    if (sku) {
      const isCurrentlyPublished = item.sys?.raw?.publishedRevisionId !== null;
      const isFlagOn = item[CMS_FIELDS.FLAG] === true;

      if (!isCurrentlyPublished || !isFlagOn) {
        await deleteProductFromMerchantApi({
          sku,
          jsonKey,
          merchantId: MERCHANT_CENTER_ID,
          dataSource: MERCHANT_DATASOURCE_PATH,
          RetryableError,
          logger,
        });
        const reason = !isCurrentlyPublished ? 'Unpublished' : 'Flag OFF';
        logger.log(`[Batch] Deleted SKU: ${sku} (Reason: ${reason})`);
      } else {
        await syncActiveProduct({
          contentData: item,
          shopifyToken,
          jsonKey,
          RetryableError,
          logger,
        });
        logger.log(`[Batch] Synced SKU: ${sku}`);
      }
    } else {
      logger.warn(`[Skip] Item at index ${i} skipped: SKU is missing.`);
    }
  }
  logger.log(`[Scheduler] Completed. Processed items: ${targetItems.length}`);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret, RetryableError } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const secrets = await secret.get({
      keys: [KARTE_APP_TOKEN_SECRET, SHOPIFY_APP_CLIENT_SECRET_NAME, SERVICE_ACCOUNT_KEY_SECRET],
    });

    const shopifyToken = await getShopifyAccessToken({
      shopDomain: SHOPIFY_SHOP_INTERNAL_DOMAIN,
      clientId: SHOPIFY_APP_CLIENT_ID,
      clientSecret: secrets[SHOPIFY_APP_CLIENT_SECRET_NAME],
      logger,
    });
    if (!shopifyToken) return;

    if (data.kind === 'karte/apiv2-hook') {
      await handleCmsHook({ data, secrets, shopifyToken, RetryableError, logger });
      return;
    }

    if (data.kind === 'karte/craft-scheduler') {
      await handleScheduler({ secrets, shopifyToken, RetryableError, logger });
      return;
    }

    logger.warn(`Invalid Trigger: ${data.kind}`);
  } catch (error) {
    if (error.name === 'RetryableError') throw error;
    logger.error(`[Critical Error] ${error.message}`);
  }
}
