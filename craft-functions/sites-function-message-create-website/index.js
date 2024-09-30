import api from 'api';
import { JSDOM } from 'jsdom';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const KARTE_APP_TOKEN_SECRET = '<% KARTE_APP_TOKEN_SECRET %>';
const KARTE_TAG = `<% KARTE_TAG %>`;
const SITE_NAME = `<% SITE_NAME %>`;
const DETAILS_PAGE_FOLDER = `<% DETAILS_PAGE_FOLDER %>`;
const LIST_PAGE_PATH = `<% LIST_PAGE_PATH %>`;
const DEFAULT_IMAGE_URL = `<% DEFAULT_IMAGE_URL %>`;

function extractImageSrc(htmlBody) {
  const dom = new JSDOM(htmlBody);
  const img = dom.window.document.querySelector('img');
  return img ? img.src : DEFAULT_IMAGE_URL;
}

function escapeHtml(string) {
  if (typeof string !== 'string') {
    return string;
  }
  return string.replace(/[&'`"<>]/g, match => ({
      '&': '&amp;',
      "'": '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
    }[match]));
}

function createListItem(contentBody) {
  const imgSrc = extractImageSrc(contentBody.htmlBody);
  const sanitizedTitle = escapeHtml(contentBody.title);
  const sanitizedFilename = escapeHtml(contentBody.filename);

  return `
    <li>
      <a href="${DETAILS_PAGE_FOLDER}/${sanitizedFilename}.html">
        <img src="${imgSrc}" alt="${sanitizedTitle}" width="450" height="300">
        <span>${sanitizedTitle}</span>
      </a>
    </li>
  `;
}

async function uploadUpdatedListPage(sites, updatedHtml) {
  const updatedListPageBase64 = Buffer.from(updatedHtml).toString('base64');
  await sites.postV2betaCraftSitesContentUpload({
    siteName: SITE_NAME,
    path: LIST_PAGE_PATH,
    content: updatedListPageBase64,
  });
}

async function addListItemToHtml(listPageHtml, contentBody) {
  const dom = new JSDOM(listPageHtml);
  const ul = dom.window.document.querySelector('ul');
  if (ul) {
    const newListItem = createListItem(contentBody);
    ul.insertAdjacentHTML('beforeend', newListItem);
  }
  return dom.serialize();
}

async function getListPageHtml(sites) {
  const listPageResponse = await sites.postV2betaCraftSitesContentGet({
    siteName: SITE_NAME,
    path: LIST_PAGE_PATH,
  });

  const listPageContent = listPageResponse.data.content;
  if (!listPageContent) {
    throw new Error('Failed to retrieve content for list page.');
  }

  return Buffer.from(listPageContent, 'base64').toString('utf-8');
}

async function updateListPage(sites, contentBody, logger) {
  try {
    const listPageHtml = await getListPageHtml(sites);
    const updatedHtml = await addListItemToHtml(listPageHtml, contentBody);
    await uploadUpdatedListPage(sites, updatedHtml);
  } catch (error) {
    logger.error('Failed to update list page', error);
    throw error;
  }
}

async function publishContent(sites, filename, logger) {
  try {
    await sites.postV2betaCraftSitesContentUpdatevisibility({
      isPublic: true,
      siteName: SITE_NAME,
      path: `${DETAILS_PAGE_FOLDER}${filename}.html`,
    });
  } catch (error) {
    logger.error('Failed to publish content', error);
    throw error;
  }
}

async function uploadNewPage(sites, contentBody, imgSrc, logger) {
  try {
    const htmlBody = contentBody.htmlBody.replace('</head>', `${KARTE_TAG}</head>`);
    const base64 = Buffer.from(htmlBody).toString('base64');

    await sites.postV2betaCraftSitesContentUpload({
      siteName: SITE_NAME,
      path: `${DETAILS_PAGE_FOLDER}${contentBody.filename}.html`,
      content: base64,
    });
  } catch (error) {
    logger.error('Failed to upload new page', error);
    throw error;
  }
}

export default async function (data, { MODULES }) {
  const { initLogger, secret } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });
  const { req, res } = data;
  try {
    const token = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET] });
    const karteApiToken = token[KARTE_APP_TOKEN_SECRET];

    const sites = api('@dev-karte/v1.0#3q52o2glxb1kejp');
    sites.auth(karteApiToken);

    const contentBody = req.body;
    const imgSrc = extractImageSrc(contentBody.htmlBody);

    await uploadNewPage(sites, contentBody, imgSrc, logger);
    await publishContent(sites, contentBody.filename, logger);
    await updateListPage(sites, contentBody, logger);

    res.status(200).json({ message: 'Sites updated successfully!' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'An error occurred while updating sites.' });
  }
}
