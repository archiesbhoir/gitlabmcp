#!/usr/bin/env node
/**
 * MCP Server for GitLab Merge Request Viewer - HTTP/SSE Transport
 * Supports multiple concurrent clients via HTTP with Server-Sent Events
 */
import express from 'express';
import {
  getMergeRequestView,
  healthCheck,
  fetchAllCommits,
  fetchAllDiscussions,
  getMRChangesRest,
  getMRApprovalsRest,
} from './api/index.js';
import { getLogger } from './utils/logger.js';
import { GitLabError } from './utils/errors.js';
import { loadConfig } from './utils/config.js';

const logger = getLogger();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// CORS middleware for multi-client access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const health = await healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to handle tool calls
async function handleToolCall(name: string, args: unknown): Promise<unknown> {
  switch (name) {
    case 'get_merge_request': {
      const {
        projectPath,
        iid,
        includeCommits = true,
        includeDiscussions = true,
        includeDiffs = false,
        includeApprovals = false,
        forceRefresh = false,
      } = args as {
        projectPath: string;
        iid: string;
        includeCommits?: boolean;
        includeDiscussions?: boolean;
        includeDiffs?: boolean;
        includeApprovals?: boolean;
        forceRefresh?: boolean;
      };

      logger.info('Fetching merge request', { projectPath, iid });

      const view = await getMergeRequestView(projectPath, iid, {
        commitsFirst: includeCommits ? 50 : 0,
        discussionsFirst: includeDiscussions ? 50 : 0,
        forceRefresh,
      });

      // Fetch additional data if requested
      if (includeDiffs) {
        try {
          const changes = await getMRChangesRest(projectPath, iid);
          view.diffs = changes.changes;
        } catch (error) {
          logger.warn('Failed to fetch diffs', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (includeApprovals) {
        try {
          const approvals = await getMRApprovalsRest(projectPath, iid);
          view.approvals = approvals;
        } catch (error) {
          logger.warn('Failed to fetch approvals', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(view, null, 2),
          },
        ],
      };
    }

    case 'get_merge_request_commits': {
      const { projectPath, iid } = args as { projectPath: string; iid: string };
      logger.info('Fetching commits', { projectPath, iid });

      const commits = await fetchAllCommits(projectPath, iid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(commits, null, 2),
          },
        ],
      };
    }

    case 'get_merge_request_discussions': {
      const { projectPath, iid } = args as { projectPath: string; iid: string };
      logger.info('Fetching discussions', { projectPath, iid });

      const discussions = await fetchAllDiscussions(projectPath, iid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(discussions, null, 2),
          },
        ],
      };
    }

    case 'get_merge_request_diffs': {
      const { projectPath, iid } = args as { projectPath: string; iid: string };
      logger.info('Fetching diffs', { projectPath, iid });

      const changes = await getMRChangesRest(projectPath, iid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(changes, null, 2),
          },
        ],
      };
    }

    case 'get_merge_request_approvals': {
      const { projectPath, iid } = args as { projectPath: string; iid: string };
      logger.info('Fetching approvals', { projectPath, iid });

      const approvals = await getMRApprovalsRest(projectPath, iid);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(approvals, null, 2),
          },
        ],
      };
    }

    case 'health_check': {
      logger.info('Health check requested');
      const health = await healthCheck();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(health, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// MCP protocol endpoint - handles MCP JSON-RPC style requests
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC 2.0 format
    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: id ?? null,
      });
    }

    // For requests (not notifications), id must be present
    // If id is missing, generate one or use a default
    const requestId = id !== undefined ? id : 'default';

    let result;

    if (method === 'initialize') {
      // MCP initialization handshake
      result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'gitlab-mcp',
          version: '0.1.0',
        },
      };
    } else if (method === 'tools/list') {
      result = {
        tools: [
          {
            name: 'get_merge_request',
            description:
              'Fetch a merge request with commits, pipelines, approvals, diffs, and discussions. Returns comprehensive MR data.',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Full project path (e.g., "group/project")',
                },
                iid: {
                  type: 'string',
                  description: 'Merge request IID (number as string, e.g., "123")',
                },
                includeCommits: {
                  type: 'boolean',
                  description: 'Include commits in the response',
                  default: true,
                },
                includeDiscussions: {
                  type: 'boolean',
                  description: 'Include discussions in the response',
                  default: true,
                },
                includeDiffs: {
                  type: 'boolean',
                  description: 'Include diffs/changes in the response (uses REST API)',
                  default: false,
                },
                includeApprovals: {
                  type: 'boolean',
                  description: 'Include full approval details (uses REST API)',
                  default: false,
                },
                forceRefresh: {
                  type: 'boolean',
                  description: 'Force refresh from API, bypassing cache',
                  default: false,
                },
              },
              required: ['projectPath', 'iid'],
            },
          },
          {
            name: 'get_merge_request_commits',
            description: 'Fetch all commits for a merge request with pagination support.',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Full project path (e.g., "group/project")',
                },
                iid: {
                  type: 'string',
                  description: 'Merge request IID',
                },
              },
              required: ['projectPath', 'iid'],
            },
          },
          {
            name: 'get_merge_request_discussions',
            description: 'Fetch all discussions for a merge request with pagination support.',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Full project path (e.g., "group/project")',
                },
                iid: {
                  type: 'string',
                  description: 'Merge request IID',
                },
              },
              required: ['projectPath', 'iid'],
            },
          },
          {
            name: 'get_merge_request_diffs',
            description: 'Fetch diffs/changes for a merge request using REST API.',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Full project path (e.g., "group/project")',
                },
                iid: {
                  type: 'string',
                  description: 'Merge request IID',
                },
              },
              required: ['projectPath', 'iid'],
            },
          },
          {
            name: 'get_merge_request_approvals',
            description: 'Fetch approval details for a merge request using REST API.',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Full project path (e.g., "group/project")',
                },
                iid: {
                  type: 'string',
                  description: 'Merge request IID',
                },
              },
              required: ['projectPath', 'iid'],
            },
          },
          {
            name: 'health_check',
            description: 'Check GitLab connectivity and return version information.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params as { name: string; arguments: unknown };
      result = await handleToolCall(name, args);
    } else if (method === 'resources/list') {
      result = {
        resources: [
          {
            uri: 'gitlab://health',
            name: 'GitLab Health Status',
            description: 'GitLab instance health and version information',
            mimeType: 'application/json',
          },
        ],
      };
    } else if (method === 'resources/read') {
      const { uri } = params as { uri: string };
      if (uri === 'gitlab://health') {
        const health = await healthCheck();
        result = {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      } else {
        throw new Error(`Unknown resource: ${uri}`);
      }
    } else if (method === 'notifications/initialized') {
      // MCP initialization notification - sent after initialize to confirm client is ready
      // Even though it's a notification, if it has an id, we should respond
      result = {};
    } else {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Method not found: ${method}` },
        id: requestId,
      });
    }

    return res.json({
      jsonrpc: '2.0',
      result,
      id: requestId,
    });
  } catch (error) {
    logger.error('MCP request error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof GitLabError) {
      return res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message,
          data: {
            gitlabErrorCode: error.code,
            statusCode: error.statusCode,
          },
        },
        id: req.body?.id ?? 'error',
      });
    }

    return res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
      id: req.body?.id ?? 'error',
    });
  }
});

// REST API endpoints for easier direct access
app.get('/api/tools', (_req, res) => {
  res.json({
    tools: [
      'get_merge_request',
      'get_merge_request_commits',
      'get_merge_request_discussions',
      'get_merge_request_diffs',
      'get_merge_request_approvals',
      'health_check',
    ],
  });
});

app.post('/api/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const result = await handleToolCall(toolName, req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof GitLabError) {
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// SSE endpoint for streaming (optional, for real-time updates)
app.get('/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sessionId = (req.headers['x-session-id'] as string) || `session-${Date.now()}`;
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  req.on('close', () => {
    logger.info('SSE connection closed', { sessionId });
  });
});

// Start server
async function main() {
  try {
    // Validate config on startup
    loadConfig();
    logger.info('Configuration loaded successfully');

    app.listen(PORT, () => {
      logger.info(`GitLab MCP HTTP Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`MCP endpoint: http://localhost:${PORT}/mcp`);
      logger.info(`REST API: http://localhost:${PORT}/api/tools`);
      logger.info(`SSE endpoint: http://localhost:${PORT}/mcp/sse`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

main();
