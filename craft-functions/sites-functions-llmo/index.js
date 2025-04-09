import api from 'api';
import { JSDOM } from 'jsdom';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const CRAFT_SITES_NAME = '<% CRAFT_SITES_NAME %>';
const WEB_SITE_TITLE = '<% WEB_SITE_TITLE %>';
const WEB_SITE_OVERVIEW = '<% WEB_SITE_OVERVIEW %>';
const CATEGORY_NAME = '<% CATEGORY_NAME %>';

async function getDescription(url, logger) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const metaDescription = dom.window.document.querySelector('meta[name="description"]');

    return metaDescription ? metaDescription.getAttribute('content') : 'No description available';
  } catch (error) {
    logger.error(`Failed to fetch description for URL: ${url}`, error);
    return 'No description available';
  }
}

async function createLlmsTextFile(jobflowData, logger) {
  let markdownContent = `# ${WEB_SITE_TITLE}\n\n> ${WEB_SITE_OVERVIEW}\n\n## ${CATEGORY_NAME}\n\n`;

  const rows = jobflowData.value.split('\n').slice(1);

  const descriptionPromises = rows.map(async row => {
    const [title, url] = row.split(',');
    if (title && url) {
      const description = await getDescription(url, logger);
      return ` - [${title}](${url}): ${description}\n`;
    }
    return null;
  });

  const descriptions = await Promise.all(descriptionPromises);
  const validDescriptions = descriptions.filter(desc => desc !== null);
  markdownContent += validDescriptions.join('');

  return markdownContent;
}

async function uploadNewPage(sites, content, logger) {
  try {
    const path = '/llms.txt';
    const base64 = Buffer.from(content, 'utf8').toString('base64');

    const response = await sites.postV2betaCraftSitesContentUpload({
      contentType: 'text/plain; charset=UTF-8',
      siteName: CRAFT_SITES_NAME,
      path,
      content: base64,
    });

    logger.debug(`Uploaded new page: ${path}`, response);
  } catch (error) {
    logger.error('Failed to upload new page:', error);
  }
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

    const sites = api('@dev-karte/v1.0#5ospm3nxfkqw');
    sites.auth(karteApiToken);

    const markdownContent = await createLlmsTextFile(jobflowData, logger);
    await uploadNewPage(sites, markdownContent, logger);
  } catch (error) {
    logger.error('An error occurred during the process:', error);
  }
}
