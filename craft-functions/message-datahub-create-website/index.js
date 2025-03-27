import api from 'api';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const SITE_NAME = `<% SITE_NAME %>`;
const DETAILS_PAGE_FOLDER = `<% DETAILS_PAGE_FOLDER %>`.replace(/\/$/, '');
const LIST_PAGE_PATH = `<% LIST_PAGE_PATH %>`;
const DEFAULT_THUMBNAIL_URL = `<% DEFAULT_THUMBNAIL_URL %>`;

function parseCsv(value, logger) {
  try {
    const records = parse(value, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      quote: '"',
      escape: '"',
    });
    return records;
  } catch (error) {
    logger.error('CSV parsing failed:', error);
    return [];
  }
}

async function uploadNewPage(sites, subject, content, filename, logger) {
  try {
    const path = `${DETAILS_PAGE_FOLDER}/${filename}.html`;
    const base64 = Buffer.from(content, 'utf8').toString('base64');
    const response = await sites.postV2betaCraftSitesContentUpload({
      siteName: SITE_NAME,
      path,
      content: base64,
    });

    logger.debug(`Uploaded new page: ${path}`, response);
  } catch (error) {
    logger.error('Failed to upload new page:', error);
  }
}

async function publishPage(sites, filename, logger) {
  try {
    const path = `${DETAILS_PAGE_FOLDER}/${filename}.html`;
    const visResponse = await sites.postV2betaCraftSitesContentUpdatevisibility({
      isPublic: true,
      siteName: SITE_NAME,
      path,
    });

    logger.debug(`Updated page visibility: ${path}`, visResponse);
  } catch (error) {
    logger.error('Failed to update page visibility:', error);
  }
}

function extractThumbnailSrc(content) {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match && match[1] ? match[1] : DEFAULT_THUMBNAIL_URL;
}

function createListItem(subject, filename, thumbnailSrc, created) {
  return `
        <li>
            <a href="${DETAILS_PAGE_FOLDER}/${filename}.html">
                <img src="${thumbnailSrc}" alt="${subject}" width="450" height="300">
                <span>${subject}</span>
                <br>
                <small>${created}</small>
            </a>
        </li>
    `;
}

async function updateListPage(sites, subject, filename, thumbnailSrc, created, logger) {
  try {
    const listPageResponse = await sites.postV2betaCraftSitesContentGet({
      siteName: SITE_NAME,
      path: LIST_PAGE_PATH,
    });

    let listPageHtml = listPageResponse?.data?.content
      ? Buffer.from(listPageResponse.data.content, 'base64').toString('utf-8')
      : null;

    if (!listPageHtml) {
      logger.warn('List page not found, creating a new one.');
      listPageHtml = '<html><body><ul></ul></body></html>';
    }

    const newListItem = createListItem(subject, filename, thumbnailSrc, created);
    listPageHtml = listPageHtml.replace('</ul>', `${newListItem}</ul>`);

    const updatedListPageBase64 = Buffer.from(listPageHtml, 'utf-8').toString('base64');
    const listUploadResponse = await sites.postV2betaCraftSitesContentUpload({
      siteName: SITE_NAME,
      path: LIST_PAGE_PATH,
      content: updatedListPageBase64,
    });

    logger.debug('Updated list page:', listUploadResponse);
  } catch (error) {
    logger.error('Failed to update list page:', error);
  }
}

function sanitizeHtml(content) {
  if (!content) return '';
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:[^\s"]*/gi, '');
}

function parsePushData(parsedData, logger) {
  const pushType = parsedData.push_type;
  if (!pushType || !['ses', 'native_app', 'line'].includes(pushType)) {
    logger.warn(`Unsupported or missing push_type: ${pushType}, skipping.`);
    return null;
  }

  let subject = 'No Title';
  let content = '';
  let thumbnailSrc = DEFAULT_THUMBNAIL_URL;
  const created = parsedData.created || 'No Date';

  switch (pushType) {
    case 'ses': {
      subject = parsedData.SES_SUBJECT || subject;
      const htmlContentBase64 = parsedData.SES_CONTENT_HTML_BASE64 || '';

      if (!htmlContentBase64) {
        logger.error('SES_CONTENT_HTML_BASE64 is empty, skipping.');
        return null;
      }

      const decoded = Buffer.from(htmlContentBase64, 'base64').toString('utf8');
      content = sanitizeHtml(decoded);
      thumbnailSrc = extractThumbnailSrc(content);
      break;
    }

    case 'native_app':
    case 'line': {
      if (!parsedData.title) {
        logger.error(`Title is missing for push_type: ${pushType}, skipping.`);
        return null;
      }
      subject = parsedData.title;
      content = sanitizeHtml(parsedData.body || '');
      break;
    }

    default: {
      logger.warn(`Unhandled push_type: ${pushType}, skipping.`);
      return null;
    }
  }

  return { subject, content, thumbnailSrc, created };
}

function generateFilename(campaignId) {
  return `page_${crypto.createHash('sha256').update(campaignId).digest('hex').slice(0, 16)}`;
}

async function processRecord(sites, parsedData, logger) {
  const parsedDataObj = parsePushData(parsedData, logger);
  if (!parsedDataObj) return;

  const { subject, content, thumbnailSrc, created } = parsedDataObj;
  const campaignId = parsedData.campaign_id || `${Date.now()}_${Math.random()}`;
  const filename = generateFilename(campaignId);

  await uploadNewPage(sites, subject, content, filename, logger);
  await publishPage(sites, filename, logger);
  await updateListPage(sites, subject, filename, thumbnailSrc, created, logger);
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  try {
    const token = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const karteApiToken = token[KARTE_APP_TOKEN_SECRET];
    const jobflowData = data.jsonPayload.data;
    if (!jobflowData.value) {
      logger.error('jobflowData.value is undefined or null');
      return;
    }

    const records = parseCsv(jobflowData.value, logger);
    if (records.length === 0) {
      logger.error('No valid records found in CSV');
      return;
    }

    const sites = api('@dev-karte/v1.0#5ospm3nxfkqw');
    sites.auth(karteApiToken);

    await Promise.allSettled(records.map(parsedData => processRecord(sites, parsedData, logger)));
  } catch (error) {
    logger.error('Execution failed:', error);
  }
}
