import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const LOG_LEVEL = '<% LOG_LEVEL %>';
const ACCESS_TOKEN_SECRET = '<% ACCESS_TOKEN_SECRET %>';
const MCP_TOOL_NAME = '<% MCP_TOOL_NAME %>';
const MCP_TOOL_DESCRIPTION = '<% MCP_TOOL_DESCRIPTION %>';
const RAG_CORPUS_ID = '<% RAG_CORPUS_ID %>';
const VECTOR_DISTANCE_THRESHOLD = 0.8; // RAG検索時のベクトル距離の閾値です。0.0〜1.0の範囲で指定します
const JSON_RPC_INTERNAL_ERROR = -32603;

function isValidHttpMethod(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return false;
  }
  return true;
}

async function getTokenFromSecretManager(secret, logger) {
  try {
    const secrets = await secret.get({ keys: [ACCESS_TOKEN_SECRET] });
    return secrets[ACCESS_TOKEN_SECRET];
  } catch (error) {
    logger.error(`Failed to get token from Secret Manager. error: ${error.message}`);
    return null;
  }
}

async function queryRagContent(question, rag, logger) {
  try {
    const results = await rag.retrieveContexts({
      corpusId: RAG_CORPUS_ID,
      text: question,
      vectorDistanceThreshold: VECTOR_DISTANCE_THRESHOLD,
    });

    const formattedResults = results.map(item => ({
      text: item.text,
      score: item.score,
    }));

    const responseText = JSON.stringify(formattedResults, null, 2);

    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Failed to execute RAG query. error: ${error.message}`);
    throw error;
  }
}

function isValidAuthentication(req, res, token, logger) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authorization header is missing or not in Bearer format');
    res.status(401).send('Unauthorized: Bearer token is required');
    return false;
  }

  const receivedToken = authHeader.split(' ')[1];

  if (receivedToken !== token) {
    logger.warn('Token does not match');
    res.status(401).send('Unauthorized: Invalid token');
    return false;
  }

  return true;
}

function createMcpServer(rag, logger) {
  const server = new McpServer({
    name: 'Craft RAG MCP Server',
    version: '1.0.0',
  });

  server.registerTool(
    MCP_TOOL_NAME,
    {
      description: MCP_TOOL_DESCRIPTION,
      inputSchema: { question: z.string() },
    },
    async ({ question }) => queryRagContent(question, rag, logger)
  );

  return server;
}

function handleServerError(error, res, logger) {
  logger.error(`Error handling MCP request. error: ${error.message}`);

  if (!res.headersSent) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: JSON_RPC_INTERNAL_ERROR,
        message: 'Internal server error',
      },
      id: null,
    });
  }
}

export default async function (data, { MODULES }) {
  const { req, res } = data;
  const { initLogger, secret, rag } = MODULES;
  const logger = initLogger({ logLevel: LOG_LEVEL });

  if (!isValidHttpMethod(req, res)) {
    return;
  }

  const token = await getTokenFromSecretManager(secret, logger);
  if (!token) {
    logger.error('Failed to get token');
    res.status(500).send('Internal Server Error');
    return;
  }

  if (!isValidAuthentication(req, res, token, logger)) {
    return;
  }

  try {
    const server = createMcpServer(rag, logger);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
      server.close();
      logger.debug('MCP server closed successfully.');
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    handleServerError(error, res, logger);
  }
}
