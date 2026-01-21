import api from 'api';
import { JWT } from 'google-auth-library';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const SERVICE_ACCOUNT_KEY_SECRET = '<% SERVICE_ACCOUNT_KEY_SECRET %>';
const SHOPIFY_WEBHOOK_SHARED_SECRET_NAME = '<% SHOPIFY_WEBHOOK_SHARED_SECRET_NAME %>';
const SHOPIFY_SHOP_PUBLIC_DOMAIN = '<% SHOPIFY_SHOP_PUBLIC_DOMAIN %>';
const MERCHANT_CENTER_ID = '<% MERCHANT_CENTER_ID %>';
const MERCHANT_DATASOURCE_PATH = '<% MERCHANT_DATASOURCE_PATH %>';
const CONTENT_LANGUAGE = 'ja'; // 言語
const FEED_LABEL = 'JP'; // ターゲット国

const CMS_FIELDS = {
  SKU: 'sku',
  FLAG: 'ad_feed_flag',
  TITLE: 'feed_ad_title',
  DESCRIPTION: 'feed_ad_description',
  CONDITION: 'product_condition',
  CATEGORY: 'google_product_category',
};

/**
 * Shopify HMAC検証用関数
 */
function verifyShopifyWebhook({ rawBody, hmacHeader, secret, logger }) {
  if (!hmacHeader || !secret) {
    logger.error('[Security Error] Missing HMAC header or Shared Secret.');
    return false;
  }

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  const isVerified = crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmacHeader));

  if (!isVerified) {
    logger.error(`[Security Error] HMAC verification failed.`);
    logger.debug(`Generated: ${generatedHash} vs Header: ${hmacHeader}`);
  }
  return isVerified;
}

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

async function fetchCmsContentBySku({ sku, modelId, token, logger }) {
  const contentData = await fetchCmsContentList({ modelId, token, logger });
  const items = contentData?.items || [];

  logger.log(`[Debug] CMS Items count: ${items.length}`);

  const found = items.find(item => {
    const cmsSku = item[CMS_FIELDS.SKU];
    return cmsSku === sku;
  });

  if (!found) {
    logger.warn(`[CMS] SKU: ${sku} not found in the list.`);
    return null;
  }

  return found;
}

function buildMerchantProduct({ contentData, publicDomain, webhookBody, logger }) {
  try {
    const variant = webhookBody.variants?.[0];
    const priceValue = parseFloat(variant.price);

    const imageLink = webhookBody.image?.src || webhookBody.images?.[0]?.src;
    const link = `https://${publicDomain}/products/${webhookBody.handle}`;

    if (!imageLink || !imageLink.startsWith('http')) {
      logger.error(`[Mapping Error] SKU: ${contentData.sku} の画像URLが不正です`);
      return null;
    }

    const rawTitle = contentData[CMS_FIELDS.TITLE] || '';
    const rawDescription = contentData[CMS_FIELDS.DESCRIPTION] || '';
    const rawCondition = contentData[CMS_FIELDS.CONDITION] || 'new';

    const product = {
      offerId: contentData[CMS_FIELDS.SKU],
      title: rawTitle.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 150),
      description: rawDescription.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 5000),
      link,
      imageLink,
      contentLanguage: CONTENT_LANGUAGE,
      feedLabel: FEED_LABEL,
      availability: variant.inventory_quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      condition: rawCondition.toUpperCase(),
      price: {
        amountMicros: String(Math.round(priceValue * 1000000)),
        currencyCode: 'JPY',
      },
      brand: webhookBody.vendor,
      googleProductCategory: String(contentData[CMS_FIELDS.CATEGORY] || ''),
    };

    // ここから先は任意項目
    if (webhookBody.images?.length > 1) {
      product.additionalImageLinks = webhookBody.images
        .slice(1, 11)
        .map(img => img.src)
        .filter(src => src && src.startsWith('http'));
    }

    if (webhookBody.id) {
      product.itemGroupId = String(webhookBody.id);
    }

    if (variant.barcode) {
      const cleanGtin = variant.barcode.replace(/[-\s]/g, '');
      if (/^\d+$/.test(cleanGtin) && [8, 12, 13, 14].includes(cleanGtin.length)) {
        product.gtin = cleanGtin;
      }
    }

    if (variant.compare_at_price) {
      const originalPrice = parseFloat(variant.compare_at_price);
      if (originalPrice > priceValue) {
        product.price.amountMicros = String(Math.round(originalPrice * 1000000));
        product.salePrice = {
          amountMicros: String(Math.round(priceValue * 1000000)),
          currencyCode: 'JPY',
        };
      }
    }

    return product;
  } catch (error) {
    logger.error(`[Mapping Critical Error]: ${error.message}`);
    return null;
  }
}

async function insertProductToMerchantApi({
  merchantProduct,
  jsonKey,
  merchantId,
  dataSource,
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
    contentLanguage: merchantProduct.contentLanguage,
    feedLabel: merchantProduct.feedLabel,
    productAttributes: {
      title: merchantProduct.title,
      description: merchantProduct.description,
      link: merchantProduct.link,
      imageLink: merchantProduct.imageLink,
      availability: merchantProduct.availability,
      condition: merchantProduct.condition,
      brand: merchantProduct.brand,
      googleProductCategory: merchantProduct.googleProductCategory,
      price: merchantProduct.price,
      gtins: merchantProduct.gtin ? [merchantProduct.gtin] : undefined,
      itemGroupId: merchantProduct.itemGroupId,
      additionalImageLinks: merchantProduct.additionalImageLinks,
      salePrice: merchantProduct.salePrice,
    },
  };

  const clean = obj => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) clean(obj[key]);
      else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
  };

  const finalData = clean(requestBody);

  try {
    const response = await client.request({
      url,
      method: 'POST',
      data: finalData,
    });

    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : 'No Status';
    const detail = error.response ? JSON.stringify(error.response.data) : error.message;
    logger.error(`[Merchant API Error] Status: ${status}. Detail: ${detail}`);
    throw error;
  }
}

async function deleteProductFromMerchantApi({ sku, jsonKey, merchantId, dataSource, logger }) {
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

    if (status === 404) {
      logger.debug(`[API Success] SKU: ${sku} was already deleted (404 Not Found).`);
      return { status: 200, message: 'Already deleted' };
    }

    logger.error(`[API Error] Delete operation failed for SKU: ${sku}. Status: ${status}`);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;

  try {
    const secrets = await secret.get({
      keys: [
        KARTE_APP_TOKEN_SECRET,
        SERVICE_ACCOUNT_KEY_SECRET,
        SHOPIFY_WEBHOOK_SHARED_SECRET_NAME,
      ],
    });

    const appToken = secrets[KARTE_APP_TOKEN_SECRET];
    const serviceAccountKey = JSON.parse(secrets[SERVICE_ACCOUNT_KEY_SECRET]);
    const shopifySharedSecret = secrets[SHOPIFY_WEBHOOK_SHARED_SECRET_NAME];

    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const isVerified = verifyShopifyWebhook({
      rawBody: req.rawBody,
      hmacHeader,
      secret: shopifySharedSecret,
      logger,
    });

    if (!isVerified) {
      return res.status(401).send('Unauthorized: HMAC verification failed');
    }

    logger.log('[Security] HMAC verification successful.');

    const variant = req.body.variants?.[0];
    const sku = variant?.sku?.trim();

    if (!sku) {
      logger.warn('[Skip] No SKU in Webhook payload');
      return res.status(200).send('No SKU');
    }

    logger.log(`[Start] Webhook Syncing SKU: ${sku}`);

    const cmsItem = await fetchCmsContentBySku({
      sku,
      modelId: CMS_MODEL_ID,
      token: appToken,
      logger,
    });

    const isCmsPublished = cmsItem?.sys?.raw?.publishedRevisionId !== null;
    const isFlagOn = cmsItem ? cmsItem[CMS_FIELDS.FLAG] === true : false;
    const isShopifyActive = req.body.status === 'active';

    if (cmsItem && isCmsPublished && isFlagOn && isShopifyActive) {
      const merchantProduct = buildMerchantProduct({
        contentData: cmsItem,
        publicDomain: SHOPIFY_SHOP_PUBLIC_DOMAIN,
        webhookBody: req.body,
        logger,
      });

      if (!merchantProduct) throw new Error('Mapping failed');

      await insertProductToMerchantApi({
        merchantProduct,
        jsonKey: serviceAccountKey,
        merchantId: MERCHANT_CENTER_ID,
        dataSource: MERCHANT_DATASOURCE_PATH,
        logger,
      });

      logger.log(`[Success] Merchant Center updated via Shopify Webhook. SKU: ${sku}`);
      return res.status(200).send('Updated');
    }

    if (!isShopifyActive || !cmsItem) {
      await deleteProductFromMerchantApi({
        sku,
        jsonKey: serviceAccountKey,
        merchantId: MERCHANT_CENTER_ID,
        dataSource: MERCHANT_DATASOURCE_PATH,
        logger,
      });

      const deleteReason = !isShopifyActive ? `Shopify status: ${req.body.status}` : 'Not in CMS';
      logger.log(`[Clean Up] SKU: ${sku} deleted from Merchant Center. Reason: ${deleteReason}`);
      return res.status(200).send('Deleted');
    }

    let skipReason = '';
    if (!isCmsPublished) {
      skipReason = 'CMS Unpublished';
    } else if (!isFlagOn) {
      skipReason = 'CMS Flag OFF';
    }

    logger.log(
      `[Skip] SKU: ${sku} is not target for sync. Reason: ${skipReason}. No API call made.`
    );
    return res.status(200).send('Skipped');
  } catch (error) {
    logger.error(`[Error] ${error.message}`);
    res.status(500).send('Error');
  }
}
