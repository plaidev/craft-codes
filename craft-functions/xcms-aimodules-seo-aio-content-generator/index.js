import api from 'api';
import MarkdownIt from 'markdown-it';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ALLOWED_ORIGINS = '<% ALLOWED_ORIGINS %>';
const KARTE_APP_TOKEN_SECRET_NAME = '<% KARTE_APP_TOKEN_SECRET_NAME %>';
const CMS_MODEL_ID = '<% CMS_MODEL_ID %>';
const GEMINI_MODEL = '<% GEMINI_MODEL %>';
const CMS_SPEC_URI = '@dev-karte/v1.0#7pblxhpmo2hfu7z';
const METADATA_SYSTEM_INSTRUCTION = '<% METADATA_SYSTEM_INSTRUCTION %>';
const BODY_SYSTEM_INSTRUCTION = '<% BODY_SYSTEM_INSTRUCTION %>';

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const METADATA_MAX_OUTPUT_TOKENS = parsePositiveNumber('<% METADATA_MAX_OUTPUT_TOKENS %>', 1024);
const BODY_MAX_OUTPUT_TOKENS = parsePositiveNumber('<% BODY_MAX_OUTPUT_TOKENS %>', 8192);
const METADATA_TEMPERATURE = parsePositiveNumber('<% METADATA_TEMPERATURE %>', 0.5);
const BODY_TEMPERATURE = parsePositiveNumber('<% BODY_TEMPERATURE %>', 0.7);

const markdownRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const PARAGRAPH_ATTRS = { textAlign: null };
const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'link']);
const TABLE_CELL_ATTRS = { colspan: 1, rowspan: 1, colwidth: null };

function createHeadingNode(level, inlineContent, anchorId = null) {
  const normalizedLevel = level === 1 ? 2 : Math.min(level, 3);
  const attrs = { textAlign: null, level: normalizedLevel };
  if (anchorId) {
    attrs.id = anchorId;
  }
  return {
    type: 'heading',
    attrs,
    content: inlineContent,
  };
}

function createParagraphNode(inlineContent) {
  const node = {
    type: 'paragraph',
    attrs: { ...PARAGRAPH_ATTRS },
  };

  if (inlineContent && inlineContent.length > 0) {
    node.content = inlineContent;
  }

  return node;
}

function createTextNode(text, marks = []) {
  const node = { type: 'text', text };
  if (marks.length > 0) {
    node.marks = marks;
  }
  return node;
}

function hasInlineContent(nodes = []) {
  return nodes.some(node => node.type === 'text' && node.text);
}

function parseInline(tokens, start, end) {
  const nodes = [];
  const activeMarks = [];
  let i = start;

  while (i < end) {
    const token = tokens[i];

    if (token.type === 'inline') {
      const children = token.children || [];
      nodes.push(...parseInline(children, 0, children.length));
      i++;
    } else if (token.type === 'text') {
      nodes.push(createTextNode(token.content, [...activeMarks]));
      i++;
    } else if (token.type === 'code_inline') {
      nodes.push(createTextNode(token.content, [...activeMarks, { type: 'code' }]));
      i++;
    } else if (token.type === 'softbreak' || token.type === 'hardbreak') {
      nodes.push({ type: 'hard_break' });
      i++;
    } else if (token.type === 'strong_open') {
      activeMarks.push({ type: 'bold' });
      i++;
    } else if (token.type === 'strong_close') {
      activeMarks.pop();
      i++;
    } else if (token.type === 'em_open') {
      activeMarks.push({ type: 'italic' });
      i++;
    } else if (token.type === 'em_close') {
      activeMarks.pop();
      i++;
    } else if (token.type === 'link_open') {
      activeMarks.push({
        type: 'link',
        attrs: {
          href: token.attrGet('href') || '',
        },
      });
      i++;
    } else if (token.type === 'link_close') {
      activeMarks.pop();
      i++;
    } else {
      i++;
    }
  }

  return nodes;
}

function looksLikeMarkdown(text) {
  if (!text || typeof text !== 'string') return false;
  return /(?:^|\n)\s{0,3}#{1,6}\s+\S/.test(text) || /(?:^|\n)\s*[-*+]\s+\S/.test(text);
}

function extractHeadingAnchor(inlineNodes = []) {
  const nodes = inlineNodes.map(node =>
    node.type === 'text'
      ? { ...node, marks: node.marks ? [...node.marks] : undefined }
      : { ...node }
  );
  const fullText = nodes
    .filter(node => node.type === 'text')
    .map(node => node.text || '')
    .join('');
  const matched = fullText.match(/\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
  if (!matched) {
    return { content: nodes, anchorId: null };
  }

  const anchorId = matched[1];
  let remaining = matched[0].length;

  for (let nodeIndex = nodes.length - 1; nodeIndex >= 0 && remaining > 0; nodeIndex -= 1) {
    if (nodes[nodeIndex].type === 'text') {
      const text = nodes[nodeIndex].text || '';
      if (text.length <= remaining) {
        remaining -= text.length;
        nodes[nodeIndex].text = '';
      } else {
        nodes[nodeIndex].text = text.slice(0, text.length - remaining);
        remaining = 0;
      }
    }
  }

  return {
    content: nodes.filter(node => node.type !== 'text' || node.text),
    anchorId,
  };
}

function parseBlocks(tokens, start = 0, end = tokens.length) {
  const blocks = [];
  let i = start;

  while (i < end) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      const level = Number(token.tag.replace('h', ''));
      i++;
      const inlineStart = i;
      while (i < end && tokens[i].type !== 'heading_close') i++;
      const inlineNodes = parseInline(tokens, inlineStart, i);
      const { content: headingContent, anchorId } = extractHeadingAnchor(inlineNodes);
      if (hasInlineContent(headingContent)) {
        blocks.push(createHeadingNode(level, headingContent, anchorId));
      }
      i++;
    } else if (token.type === 'paragraph_open') {
      i++;
      const inlineStart = i;
      while (i < end && tokens[i].type !== 'paragraph_close') i++;
      blocks.push(createParagraphNode(parseInline(tokens, inlineStart, i)));
      i++;
    } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const listType = token.type === 'bullet_list_open' ? 'bullet_list' : 'ordered_list';
      const closeType = token.type.replace('_open', '_close');
      i++;
      const listStart = i;
      while (i < end && tokens[i].type !== closeType) i++;
      // eslint-disable-next-line no-use-before-define -- mutual recursion with parseList
      blocks.push(parseList(tokens, listStart, i, listType));
      i++;
    } else if (token.type === 'hr') {
      blocks.push(createParagraphNode([]));
      i++;
    } else if (token.type === 'fence') {
      const codeText = token.content.replace(/\n$/, '');
      // AIが本文全体を ```markdown ... ``` で包むケースでは再パースする
      if (looksLikeMarkdown(codeText)) {
        const nestedTokens = markdownRenderer.parse(codeText, {});
        blocks.push(...parseBlocks(nestedTokens));
      } else {
        blocks.push(createParagraphNode([createTextNode(codeText)]));
      }
      i++;
    } else if (token.type === 'blockquote_open') {
      i++;
      const innerStart = i;
      while (i < end && tokens[i].type !== 'blockquote_close') i++;
      blocks.push(...parseBlocks(tokens, innerStart, i));
      i++;
    } else {
      i++;
    }
  }

  return blocks;
}

function parseList(tokens, start, end, listType) {
  const items = [];
  let i = start;

  while (i < end) {
    if (tokens[i].type === 'list_item_open') {
      i++;
      const itemStart = i;
      while (i < end && tokens[i].type !== 'list_item_close') i++;
      items.push({ type: 'list_item', content: parseBlocks(tokens, itemStart, i) });
      i++;
    } else {
      i++;
    }
  }

  return { type: listType, content: items };
}

function flattenListItems(listNode) {
  let order = 0;

  return listNode.content.flatMap(item => {
    order += 1;
    const prefix = listNode.type === 'ordered_list' ? `${order}. ` : '・';

    return (item.content || []).flatMap(block => {
      if (block.type === 'paragraph') {
        const content = [...(block.content || [])];
        if (prefix) {
          content.unshift(createTextNode(prefix));
        }
        return [createParagraphNode(content)];
      }

      if (block.type === 'heading' && hasInlineContent(block.content)) {
        return [
          createHeadingNode(block.attrs?.level || 3, block.content || [], block.attrs?.id || null),
        ];
      }

      return [];
    });
  });
}

function sanitizeRichTextContent(nodes) {
  return nodes.flatMap(node => {
    if (node.type === 'heading') {
      const content = node.content || [];
      if (!hasInlineContent(content)) {
        return [];
      }
      return [createHeadingNode(node.attrs?.level || 2, content, node.attrs?.id || null)];
    }

    if (node.type === 'paragraph') {
      return [createParagraphNode(node.content || [])];
    }

    if (node.type === 'table') {
      return [node];
    }

    if (node.type === 'bullet_list' || node.type === 'ordered_list') {
      return flattenListItems(node);
    }

    if (node.type === 'blockquote') {
      return sanitizeRichTextContent(node.content || []);
    }

    if (node.type === 'code_block') {
      const text = node.content?.find(child => child.type === 'text')?.text || '';
      return [createParagraphNode([createTextNode(text)])];
    }

    if (node.type === 'horizontal_rule') {
      return [createParagraphNode([])];
    }

    return [];
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInlineHtml(nodes = []) {
  return nodes
    .map(node => {
      if (node.type === 'text') {
        let text = escapeHtml(node.text);
        (node.marks || []).forEach(mark => {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'code') text = `<code>${text}</code>`;
          if (mark.type === 'link') {
            const href = escapeHtml(mark.attrs?.href || '');
            text = `<a href="${href}">${text}</a>`;
          }
        });
        return text;
      }

      if (node.type === 'hard_break') {
        return '<br>';
      }

      return '';
    })
    .join('');
}

function richTextJsonToHtml(doc) {
  return (doc.content || [])
    .map(node => {
      if (node.type === 'heading') {
        const level = node.attrs?.level || 2;
        const idAttr = node.attrs?.id ? ` id="${escapeHtml(node.attrs.id)}"` : '';
        return `<h${level}${idAttr}>${renderInlineHtml(node.content)}</h${level}>`;
      }

      if (node.type === 'paragraph') {
        return `<p>${renderInlineHtml(node.content)}</p>`;
      }

      if (node.type === 'table') {
        const rows = (node.content || [])
          .map(row => {
            const cells = (row.content || [])
              .map(cell => {
                const tag = cell.type === 'tableHeader' ? 'th' : 'td';
                const cellHtml = (cell.content || [])
                  .map(block =>
                    block.type === 'paragraph' ? `<p>${renderInlineHtml(block.content)}</p>` : ''
                  )
                  .join('');
                return `<${tag} colspan="1" rowspan="1">${cellHtml}</${tag}>`;
              })
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        return `<table><tbody>${rows}</tbody></table>`;
      }

      return '';
    })
    .join('');
}

function richTextJsonToPlainText(doc) {
  const parts = [];

  (doc.content || []).forEach(node => {
    if (node.type === 'heading') {
      parts.push((node.content || []).map(child => child.text || '').join(''));
      parts.push('');
      return;
    }

    if (node.type === 'paragraph') {
      const text = (node.content || []).map(child => child.text || '').join('');
      parts.push(text);
      parts.push('');
      return;
    }

    if (node.type === 'table') {
      (node.content || []).forEach(row => {
        const cells = (row.content || []).map(cell =>
          (cell.content || [])
            .map(block => (block.content || []).map(child => child.text || '').join(''))
            .join('')
        );
        parts.push(cells.join('\t'));
      });
      parts.push('');
    }
  });

  return `${parts.join('\n')}\n`;
}

function unwrapMarkdownFence(source) {
  const trimmed = source.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function isTableSeparatorLine(line) {
  return /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line);
}

function splitTableRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);
  return row.split('|').map(cell => cell.trim());
}

function expandResidualBold(text, baseMarks = []) {
  const nodes = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  const matches = [...text.matchAll(re)];

  matches.forEach(match => {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).replace(/\*\*/g, '');
      if (before) {
        nodes.push(createTextNode(before, baseMarks));
      }
    }
    const boldMarks = [...baseMarks.filter(mark => mark.type !== 'bold'), { type: 'bold' }];
    nodes.push(createTextNode(match[1], boldMarks));
    lastIndex = match.index + match[0].length;
  });

  const rest = text.slice(lastIndex).replace(/\*\*/g, '');
  if (rest) {
    nodes.push(createTextNode(rest, baseMarks));
  }

  return nodes;
}

function repairResidualBoldInInlineNodes(nodes = []) {
  const normalized = nodes.map(node => {
    if (node.type === 'hard_break') {
      return { type: 'text', text: '\n' };
    }
    return node;
  });

  const hasResidual = normalized.some(
    node => node.type === 'text' && typeof node.text === 'string' && node.text.includes('**')
  );
  if (!hasResidual) {
    return normalized;
  }

  const hasLink = normalized.some(node => (node.marks || []).some(mark => mark.type === 'link'));

  if (hasLink) {
    return normalized.flatMap(node => {
      if (node.type === 'text' && node.text?.includes('**')) {
        const baseMarks = (node.marks || []).filter(mark => mark.type !== 'bold');
        return expandResidualBold(node.text, baseMarks);
      }
      return [node];
    });
  }

  // markdown-it が日本語約物まわりで ** を取りこぼした段落は、結合して再適用する
  const joined = normalized.map(node => (node.type === 'text' ? node.text || '' : '')).join('');
  return expandResidualBold(joined);
}

function parseCellInlineContent(cellMarkdown) {
  const source = typeof cellMarkdown === 'string' ? cellMarkdown : '';
  if (!source) {
    return [];
  }
  const tokens = markdownRenderer.parseInline(source, {});
  return repairResidualBoldInInlineNodes(parseInline(tokens, 0, tokens.length));
}

function buildTableCellNode(cellType, cellMarkdown) {
  const inlineContent = parseCellInlineContent(cellMarkdown);
  return {
    type: cellType,
    attrs: { ...TABLE_CELL_ATTRS },
    content: [createParagraphNode(inlineContent)],
  };
}

function buildCmsTableNode(headerCells, bodyRows) {
  const headerRow = {
    type: 'tableRow',
    content: headerCells.map(cell => buildTableCellNode('tableHeader', cell)),
  };
  const rows = bodyRows.map(cells => ({
    type: 'tableRow',
    content: cells.map(cell => buildTableCellNode('tableCell', cell)),
  }));

  return {
    type: 'table',
    content: [headerRow, ...rows],
  };
}

function parseMarkdownChunk(chunk) {
  if (!chunk || !chunk.trim()) {
    return [];
  }
  const tokens = markdownRenderer.parse(chunk, {});
  return sanitizeRichTextContent(parseBlocks(tokens));
}

function parseMarkdownDocument(source) {
  const lines = source.split('\n');
  const blocks = [];
  let markdownBuffer = [];
  let i = 0;

  const flushMarkdownBuffer = () => {
    if (markdownBuffer.length === 0) return;
    const chunk = markdownBuffer.join('\n');
    markdownBuffer = [];
    blocks.push(...parseMarkdownChunk(chunk));
  };

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    const headerCells = line.includes('|') ? splitTableRow(line) : [];

    if (next !== undefined && headerCells.length > 1 && isTableSeparatorLine(next)) {
      flushMarkdownBuffer();
      i += 2;
      const bodyRows = [];
      while (i < lines.length) {
        const row = lines[i];
        if (!row.trim() || !row.includes('|') || isTableSeparatorLine(row)) {
          break;
        }
        if (/^\s*#{1,6}\s/.test(row)) {
          break;
        }
        bodyRows.push(splitTableRow(row));
        i++;
      }
      blocks.push(buildCmsTableNode(headerCells, bodyRows));
    } else {
      markdownBuffer.push(line);
      i++;
    }
  }

  flushMarkdownBuffer();
  return blocks;
}

function attachAnchorsToHeadings(source) {
  // <a id="foo"></a> の直後の見出しに {#foo} を付与（ページ内リンク先）
  let result = source.replace(
    /<a\s+id=["']([^"']+)["']\s*><\/a>\s*\n+(#{1,6}\s+[^\n]+)/gi,
    (_match, id, headingLine) => {
      const cleaned = headingLine.replace(/\s*\{#[^}]+\}\s*$/, '');
      return `${cleaned} {#${id}}`;
    }
  );

  // 紐付けできなかったアンカーは除去
  result = result.replace(/<a\s+id=["'][^"']*["']\s*><\/a>/gi, '');
  return result;
}

function normalizeMarkdownSource(markdown) {
  let source = typeof markdown === 'string' ? markdown : '';

  source = source.replace(/\r\n/g, '\n').replace(/\\n/g, '\n');
  source = unwrapMarkdownFence(source);
  source = attachAnchorsToHeadings(source);

  return source.trim();
}

function shouldReparseAsMarkdown(content, source) {
  if (!looksLikeMarkdown(source)) return false;
  if (!Array.isArray(content) || content.length === 0) return true;

  const headingCount = content.filter(node => node.type === 'heading').length;
  if (headingCount > 0) return false;

  // 見出しがあるべきなのに段落1件だけ＝ブロック分解に失敗している可能性が高い
  return content.length === 1 && content[0].type === 'paragraph';
}

function logRichTextConversionSummary({ source, json, logger }) {
  if (!logger) return;

  const nodes = json.content || [];
  const headingCount = nodes.filter(node => node.type === 'heading').length;
  const paragraphCount = nodes.filter(node => node.type === 'paragraph').length;
  const tableCount = nodes.filter(node => node.type === 'table').length;
  const firstText = nodes[0]?.content?.[0]?.text || '';

  logger.log('Markdown converted to rich text', {
    sourceLength: source.length,
    nodeCount: nodes.length,
    headingCount,
    paragraphCount,
    tableCount,
  });

  if (headingCount === 0 && looksLikeMarkdown(source)) {
    logger.warn('Rich text has no headings; markdown may not have been parsed', {
      preview: firstText.slice(0, 120),
    });
  }
}

function sanitizeInlineNodes(nodes = []) {
  const sanitized = nodes
    .map(node => {
      if (node.type === 'text' && node.text) {
        const marks = (node.marks || [])
          .filter(mark => ALLOWED_MARK_TYPES.has(mark.type))
          .map(mark => {
            if (mark.type === 'link') {
              return {
                type: 'link',
                attrs: { href: mark.attrs?.href || '' },
              };
            }
            return { type: mark.type };
          });
        return createTextNode(node.text, marks);
      }
      if (node.type === 'hard_break') {
        return { type: 'text', text: '\n' };
      }
      return null;
    })
    .filter(Boolean);

  return repairResidualBoldInInlineNodes(sanitized);
}

function sanitizeCmsTableNode(node) {
  const rows = (node.content || [])
    .map(row => {
      if (row.type !== 'tableRow') return null;
      const cells = (row.content || [])
        .map(cell => {
          if (cell.type !== 'tableHeader' && cell.type !== 'tableCell') return null;
          const paragraphs = (cell.content || [])
            .filter(block => block.type === 'paragraph')
            .map(block => createParagraphNode(sanitizeInlineNodes(block.content || [])));
          if (paragraphs.length === 0) {
            paragraphs.push(createParagraphNode([]));
          }
          return {
            type: cell.type,
            attrs: {
              colspan: cell.attrs?.colspan || 1,
              rowspan: cell.attrs?.rowspan || 1,
              colwidth: cell.attrs?.colwidth ?? null,
            },
            content: paragraphs,
          };
        })
        .filter(Boolean);
      if (cells.length === 0) return null;
      return { type: 'tableRow', content: cells };
    })
    .filter(Boolean);

  if (rows.length === 0) return null;
  return { type: 'table', content: rows };
}

function sanitizeCmsRichTextNode(node) {
  if (node.type === 'heading') {
    const content = sanitizeInlineNodes(node.content || []);
    if (!hasInlineContent(content)) {
      return null;
    }
    return createHeadingNode(node.attrs?.level || 2, content, node.attrs?.id || null);
  }

  if (node.type === 'paragraph') {
    return createParagraphNode(sanitizeInlineNodes(node.content || []));
  }

  if (node.type === 'table') {
    return sanitizeCmsTableNode(node);
  }

  return null;
}

function sanitizeCmsRichTextDoc(doc) {
  const content = (doc.content || []).map(sanitizeCmsRichTextNode).filter(Boolean);

  if (content.length === 0) {
    content.push(createParagraphNode([]));
  }

  return { type: 'doc', content };
}

function markdownToRichText(markdown, logger) {
  let source = normalizeMarkdownSource(markdown);
  let content = parseMarkdownDocument(source || '');

  // まだ1段落に丸まっている場合は、フェンス除去後にもう一度パースする
  if (shouldReparseAsMarkdown(content, source)) {
    source = unwrapMarkdownFence(source);
    content = parseMarkdownDocument(source || '');
  }

  if (content.length === 0) {
    content.push(createParagraphNode([]));
  }

  const json = sanitizeCmsRichTextDoc({ type: 'doc', content });
  logRichTextConversionSummary({ source, json, logger });

  return {
    text: richTextJsonToPlainText(json),
    html: richTextJsonToHtml(json),
    json,
  };
}

function buildCmsCreatePayload({ title, slug, metaDescription, richTextJson }) {
  return {
    modelId: CMS_MODEL_ID,
    kickHookV2: false,
    data: {
      title,
      slug,
      description: metaDescription,
      content: {
        json: richTextJson,
      },
    },
  };
}

function getHttpStatus(error) {
  return error?.status || error?.response?.status || error?.data?.status;
}

async function createCmsContent({ cmsClient, payload, logger }) {
  try {
    const response = await cmsClient.postV2betaCmsContentCreate(payload);
    return response.data;
  } catch (error) {
    const status = getHttpStatus(error);
    const detail =
      error?.data?.error?.message ||
      error?.data?.error?.detail ||
      error?.data?.message ||
      JSON.stringify(error?.data) ||
      error.message;
    logger.error('CMS create error', { status, detail, payload: payload?.data });
    if (status === 400) {
      throw new Error(`CMS入稿に失敗しました（Bad Request）: ${detail}`);
    }
    throw new Error(`CMS入稿に失敗しました（status: ${status ?? 'unknown'}）: ${detail}`);
  }
}

function setCorsHeaders(res, origin, allowedOrigins) {
  const origins = allowedOrigins.split(',').map(o => o.trim());

  if (origins.includes(origin) || origins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }

  return false;
}

function validateRequest(req, res, logger) {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    const isOriginAllowed = setCorsHeaders(res, origin, ALLOWED_ORIGINS);
    if (isOriginAllowed) {
      res.status(204).send('');
    } else {
      logger.warn(`Origin not allowed: ${origin}`);
      res.status(403).json({ error: 'Origin not allowed' });
    }
    return false;
  }

  if (req.method !== 'POST') {
    logger.warn(`Invalid request method: ${req.method}`);
    res.status(405).json({ error: 'Method Not Allowed. Only POST requests are supported.' });
    return false;
  }

  if (origin) {
    setCorsHeaders(res, origin, ALLOWED_ORIGINS);
  } else {
    setCorsHeaders(res, '*', ALLOWED_ORIGINS);
  }

  if (!req.headers['content-type']) {
    logger.warn('Content-Type header is missing');
    res.status(400).json({ error: 'Content-Type header is missing' });
    return false;
  }

  return true;
}

async function verifyCraftAuthToken(auth, authHeader, logger) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Bearer token must be provided',
        status: 401,
      };
    }

    const idToken = authHeader.replace('Bearer ', '');
    const authResult = await auth.verify({ idToken });

    return {
      success: true,
      user: {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        roles: authResult.user.roles || [],
      },
    };
  } catch (error) {
    logger.warn('Token verification error:', error);
    return {
      success: false,
      error: error.message,
      status: error.status || 401,
    };
  }
}

function normalizeKeywords(keywords) {
  if (!keywords) return [];
  if (Array.isArray(keywords)) {
    return keywords.map(k => String(k).trim()).filter(Boolean);
  }
  if (typeof keywords === 'string') {
    return keywords
      .split(/[,、\n]/)
      .map(k => k.trim())
      .filter(Boolean);
  }
  return [];
}

function parseArticleInput(body) {
  const genre =
    body.productName || body.product_name || body.genre || body.theme || body.topic || '';
  const keywords = normalizeKeywords(body.keywords);
  const authorInfo = body.authorInfo || body.author_info || body.authorProfile || '';
  const productDesc = body.productDesc || body.product_desc || body.description || '';
  const targetPersona = body.targetPersona || body.target_persona || '';
  const toneManner = body.toneManner || body.tone_manner || body.tone || '';

  return {
    genre: typeof genre === 'string' ? genre.trim() : '',
    keywords,
    authorInfo: typeof authorInfo === 'string' ? authorInfo.trim() : '',
    productDesc: typeof productDesc === 'string' ? productDesc.trim() : '',
    targetPersona: typeof targetPersona === 'string' ? targetPersona.trim() : '',
    toneManner: typeof toneManner === 'string' ? toneManner.trim() : '',
  };
}

function buildSharedContext({
  genre,
  keywords,
  authorInfo,
  productDesc,
  targetPersona,
  toneManner,
}) {
  const sections = [`【対象テーマ / 店舗・企画名】\n${genre}`];

  if (keywords.length > 0) {
    sections.push(`【狙いたいキーワード】\n${keywords.join(', ')}`);
  }
  if (productDesc) {
    sections.push(`【記事の概要・特徴】\n${productDesc}`);
  }
  if (authorInfo) {
    sections.push(`【著者プロフィール・実績（EEAT）】\n${authorInfo}`);
  }
  if (targetPersona) {
    sections.push(`【ターゲット / ペルソナ】\n${targetPersona}`);
  }
  if (toneManner) {
    sections.push(`【トーン＆マナー】\n${toneManner}`);
  }

  return sections.join('\n\n');
}

function extractResponseText(response) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const rawText = parts
    .filter(part => part.text && !part.thought)
    .map(part => part.text)
    .join('');

  if (!rawText) {
    throw new Error('AI Modulesから有効なレスポンスが得られませんでした');
  }
  return rawText;
}

function parseJsonFromModelText(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error(`モデル応答がJSONではありません: ${candidate.slice(0, 80)}`);
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

function buildGenerationConfig(generationConfig) {
  const thinkingConfig = { includeThoughts: false };

  if (GEMINI_MODEL.includes('gemini-3')) {
    thinkingConfig.thinkingLevel = 'minimal';
  }

  return {
    ...generationConfig,
    thinkingConfig: {
      ...thinkingConfig,
      ...generationConfig.thinkingConfig,
    },
  };
}

function extractUsageMetadata(response) {
  return {
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: response.usageMetadata?.totalTokenCount || 0,
  };
}

function aggregateUsage(usages) {
  return usages.reduce(
    (acc, usage) => ({
      promptTokens: acc.promptTokens + usage.promptTokens,
      completionTokens: acc.completionTokens + usage.completionTokens,
      totalTokens: acc.totalTokens + usage.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  );
}

function normalizeSlug(slug) {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildFallbackSlug(articleInput, title) {
  const year = new Date().getFullYear();
  const keywordParts = articleInput.keywords.map(keyword => normalizeSlug(keyword)).filter(Boolean);

  if (keywordParts.length > 0) {
    return normalizeSlug(`${keywordParts.slice(0, 4).join('-')}-${year}`);
  }

  const titleSlug = normalizeSlug(title);
  if (titleSlug) {
    return normalizeSlug(`${titleSlug.slice(0, 60)}-${year}`);
  }

  return `article-${year}`;
}

async function callGemini({ aiModules, systemInstruction, userPrompt, generationConfig }) {
  const response = await aiModules.gcpGeminiGenerateContent({
    model: GEMINI_MODEL,
    systemInstruction,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: buildGenerationConfig(generationConfig),
  });

  return {
    text: extractResponseText(response),
    usage: extractUsageMetadata(response),
    finishReason: response.candidates?.[0]?.finishReason,
  };
}

async function generateMetadata({ articleInput, aiModules, logger }) {
  const sharedContext = buildSharedContext(articleInput);
  const userPrompt = `${sharedContext}

上記の情報をもとに、記事タイトル・URLスラッグ・メタディスクリプションをまとめて生成してください。
スラッグは必ずローマ字または英語のみで出力し、日本語文字は使用しないでください。`;

  const result = await callGemini({
    aiModules,
    systemInstruction: METADATA_SYSTEM_INSTRUCTION,
    userPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '生成した記事タイトル（30〜60文字程度を目安）',
          },
          slug: {
            type: 'string',
            description: 'URL末尾用のスラッグ（小文字英数字とハイフンのみ）',
          },
          meta_description: {
            type: 'string',
            description: '検索結果に表示されるメタディスクリプション（120〜160文字程度）',
          },
        },
        required: ['title', 'slug', 'meta_description'],
      },
      maxOutputTokens: METADATA_MAX_OUTPUT_TOKENS,
      temperature: METADATA_TEMPERATURE,
    },
  });

  const parsed = parseJsonFromModelText(result.text);
  const title = parsed.title?.trim();
  const metaDescription = parsed.meta_description?.trim();

  if (!title) {
    throw new Error('タイトルの生成に失敗しました');
  }
  if (!metaDescription) {
    throw new Error('メタディスクリプションの生成に失敗しました');
  }

  let slug = normalizeSlug(parsed.slug || '');
  if (!slug) {
    slug = buildFallbackSlug(articleInput, title);
    logger.warn(`AI slug was empty after normalization. Using fallback slug: ${slug}`);
  }

  return {
    title,
    slug,
    metaDescription,
    usage: result.usage,
  };
}

async function generateBody({ articleInput, title, slug, metaDescription, aiModules }) {
  const sharedContext = buildSharedContext(articleInput);
  const userPrompt = `${sharedContext}

【確定した記事タイトル】
${title}

【確定したスラッグ】
${slug}

【確定したメタディスクリプション】
${metaDescription}

上記をもとに、記事本文（Markdown形式）を生成してください。`;

  const result = await callGemini({
    aiModules,
    systemInstruction: BODY_SYSTEM_INSTRUCTION,
    userPrompt,
    generationConfig: {
      maxOutputTokens: BODY_MAX_OUTPUT_TOKENS,
      temperature: BODY_TEMPERATURE,
    },
  });

  const body = result.text.trim();
  if (!body) {
    throw new Error('本文の生成に失敗しました');
  }

  return {
    body,
    usage: result.usage,
  };
}

async function generateArticleContent({ articleInput, aiModules, logger }) {
  const { title, slug, metaDescription, usage: metadataUsage } = await generateMetadata({
    articleInput,
    aiModules,
    logger,
  });

  const { body, usage: bodyUsage } = await generateBody({
    articleInput,
    title,
    slug,
    metaDescription,
    aiModules,
  });

  return {
    title,
    slug,
    metaDescription,
    body,
    usage: aggregateUsage([metadataUsage, bodyUsage]),
  };
}

async function handleGenerateAction({ body, res, aiModules, logger }) {
  const articleInput = parseArticleInput(body);

  if (!articleInput.genre) {
    logger.warn('Missing required parameter: productName (genre/theme)');
    res.status(400).json({
      success: false,
      action: 'generate',
      error: 'Missing required parameter: productName',
      message: '対象テーマ / 店舗・企画名（productName）は必須です',
    });
    return;
  }

  if (articleInput.keywords.length === 0) {
    logger.warn('Missing required parameter: keywords');
    res.status(400).json({
      success: false,
      action: 'generate',
      error: 'Missing required parameter: keywords',
      message: '狙いたいキーワード（keywords）は必須です',
    });
    return;
  }

  try {
    const result = await generateArticleContent({
      articleInput,
      aiModules,
      logger,
    });

    logger.log('Article content generated', {
      titleLength: result.title.length,
      slugLength: result.slug.length,
      metaLength: result.metaDescription.length,
      bodyLength: result.body.length,
      totalTokens: result.usage.totalTokens,
    });

    res.json({
      success: true,
      action: 'generate',
      model: GEMINI_MODEL,
      title: result.title,
      slug: result.slug,
      metaDescription: result.metaDescription,
      body: result.body,
      usage: result.usage,
    });
  } catch (error) {
    logger.error(`Error generating article content: ${error.message}`);
    res.status(500).json({
      success: false,
      action: 'generate',
      error: 'Failed to generate article content',
      message: error.message,
    });
  }
}

async function handleSubmitAction({ body, res, logger, appToken }) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const metaDescription =
    typeof body.metaDescription === 'string' ? body.metaDescription.trim() : '';
  const articleBody = typeof body.body === 'string' ? body.body.trim() : '';

  if (!title || !slug || !metaDescription || !articleBody) {
    logger.warn('Missing required submit parameters');
    res.status(400).json({
      success: false,
      action: 'submit',
      error: 'Missing required parameters',
      message: 'title, slug, metaDescription, body はすべて必須です',
    });
    return;
  }

  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    res.status(400).json({
      success: false,
      action: 'submit',
      error: 'Invalid slug',
      message: '有効なスラッグを指定してください（小文字英数字とハイフン）',
    });
    return;
  }

  try {
    const cmsClient = api(CMS_SPEC_URI);
    cmsClient.auth(appToken);

    const richTextContent = markdownToRichText(articleBody, logger);
    const createPayload = buildCmsCreatePayload({
      title,
      slug: normalizedSlug,
      metaDescription,
      richTextJson: richTextContent.json,
    });

    logger.log('Creating CMS content', {
      modelId: CMS_MODEL_ID,
      title,
      slug: normalizedSlug,
      bodyLength: articleBody.length,
      richTextNodeCount: richTextContent.json.content?.length,
      richTextHeadingCount: (richTextContent.json.content || []).filter(
        node => node.type === 'heading'
      ).length,
    });

    const createdContent = await createCmsContent({
      cmsClient,
      payload: createPayload,
      logger,
    });

    const contentId = createdContent?.id;
    if (!contentId) {
      throw new Error('CMS入稿は成功しましたが、contentIdがレスポンスに含まれていません');
    }

    res.status(201).json({
      success: true,
      action: 'submit',
      contentId,
      slug: normalizedSlug,
      content: createdContent,
      message: 'Craft Cross CMSに下書き（Draft）として入稿しました',
    });
  } catch (error) {
    logger.error(`Error submitting CMS content: ${error.message}`);
    const statusCode = error.message.includes('Bad Request') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      action: 'submit',
      error: 'Failed to submit CMS content',
      message: error.message,
    });
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, aiModules, secret, auth } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (!validateRequest(req, res, logger)) {
    return;
  }

  const verifyResult = await verifyCraftAuthToken(auth, req.headers.authorization, logger);
  if (!verifyResult.success) {
    res.status(verifyResult.status).json({
      success: false,
      error: 'Unauthorized',
      message: verifyResult.error || '認証に失敗しました',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const action = typeof body?.action === 'string' ? body.action.trim() : 'generate';

  switch (action) {
    case 'generate':
      await handleGenerateAction({ body, res, aiModules, logger });
      return;
    case 'submit': {
      let appToken;
      try {
        const secrets = await secret.get({ keys: [KARTE_APP_TOKEN_SECRET_NAME] });
        appToken = secrets[KARTE_APP_TOKEN_SECRET_NAME];
      } catch (error) {
        logger.error(`Error retrieving KARTE API token: ${error.message}`);
        res.status(500).json({
          success: false,
          action: 'submit',
          error: 'Failed to retrieve KARTE API token',
          message: 'KARTE APIトークンの取得に失敗しました',
        });
        return;
      }

      if (!appToken) {
        logger.error('KARTE API token is missing in secret store');
        res.status(500).json({
          success: false,
          action: 'submit',
          error: 'Failed to retrieve KARTE API token',
          message: 'KARTE APIトークンの取得に失敗しました',
        });
        return;
      }

      await handleSubmitAction({ body, res, logger, appToken });
      return;
    }
    default:
      logger.warn(`Unknown action: ${action}`);
      res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: `不明なactionです: ${action}（generate または submit を指定してください）`,
      });
  }
}
