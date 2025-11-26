#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getMergeRequestView,
  healthCheck,
  fetchAllCommits,
  fetchAllDiscussions,
  getMRChangesRest,
  getMRApprovalsRest,
  getMRsByUsername,
  createMergeRequest,
  getMRPipelines,
  getPipeline,
  getPipelineJobs,
} from './api/index.js';
import { getLogger } from './utils/logger.js';
import { GitLabError } from './utils/errors.js';

const logger = getLogger();

class GitLabMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'gitlab-mcp',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
          name: 'get_merge_request_pipelines',
          description: 'Fetch all pipelines associated with a merge request using REST API.',
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
          name: 'get_pipeline',
          description: 'Fetch a single pipeline by ID for a given project.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Full project path (e.g., "group/project")',
              },
              pipelineId: {
                type: 'string',
                description: 'Pipeline ID from GitLab',
              },
            },
            required: ['projectPath', 'pipelineId'],
          },
        },
        {
          name: 'get_pipeline_jobs',
          description: 'Fetch all jobs for a pipeline.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Full project path (e.g., "group/project")',
              },
              pipelineId: {
                type: 'string',
                description: 'Pipeline ID from GitLab',
              },
              scope: {
                type: 'string',
                enum: ['created', 'pending', 'running', 'failed', 'success', 'canceled', 'skipped', 'manual'],
                description: 'Optional: Filter jobs by scope/status',
              },
            },
            required: ['projectPath', 'pipelineId'],
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
        {
          name: 'get_merge_requests_by_user',
          description:
            'Fetch all merge requests for a given username. Supports filtering by project and state.',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'GitLab username to fetch merge requests for',
              },
              projectPath: {
                type: 'string',
                description:
                  'Optional: Filter by project path (e.g., "group/project"). If not provided, returns MRs from all accessible projects.',
              },
              state: {
                type: 'string',
                enum: ['opened', 'closed', 'locked', 'merged'],
                description: 'Optional: Filter by merge request state',
              },
            },
            required: ['username'],
          },
        },
        {
          name: 'create_merge_request',
          description: 'Create a new merge request. Requires api scope in token.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Full project path (e.g., "group/project")',
              },
              sourceBranch: {
                type: 'string',
                description: 'Source branch to merge from',
              },
              targetBranch: {
                type: 'string',
                description: 'Target branch to merge into',
              },
              title: {
                type: 'string',
                description: 'Merge request title',
              },
              description: {
                type: 'string',
                description: 'Optional: Merge request description',
              },
              assigneeIds: {
                type: 'array',
                items: { type: 'number' },
                description: 'Optional: Array of user IDs to assign',
              },
              reviewerIds: {
                type: 'array',
                items: { type: 'number' },
                description: 'Optional: Array of user IDs to request review from',
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional: Array of label names',
              },
              removeSourceBranch: {
                type: 'boolean',
                description: 'Optional: Remove source branch when MR is merged',
              },
              squash: {
                type: 'boolean',
                description: 'Optional: Squash commits when merging',
              },
            },
            required: ['projectPath', 'sourceBranch', 'targetBranch', 'title'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'gitlab://health',
          name: 'GitLab Health Status',
          description: 'GitLab instance health and version information',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      if (request.params.uri === 'gitlab://health') {
        const health = await healthCheck();
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      }
      throw new Error(`Unknown resource: ${request.params.uri}`);
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
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

          case 'get_merge_request_pipelines': {
            const { projectPath, iid } = args as { projectPath: string; iid: string };
            logger.info('Fetching pipelines for merge request', { projectPath, iid });

            const pipelines = await getMRPipelines(projectPath, iid);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pipelines, null, 2),
                },
              ],
            };
          }

          case 'get_pipeline': {
            const { projectPath, pipelineId } = args as { projectPath: string; pipelineId: string };
            logger.info('Fetching pipeline', { projectPath, pipelineId });

            const pipeline = await getPipeline(projectPath, pipelineId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pipeline, null, 2),
                },
              ],
            };
          }

          case 'get_pipeline_jobs': {
            const { projectPath, pipelineId, scope } = args as {
              projectPath: string;
              pipelineId: string;
              scope?:
                | 'created'
                | 'pending'
                | 'running'
                | 'failed'
                | 'success'
                | 'canceled'
                | 'skipped'
                | 'manual';
            };
            logger.info('Fetching pipeline jobs', { projectPath, pipelineId, scope });

            const jobs = await getPipelineJobs(projectPath, pipelineId, { scope });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(jobs, null, 2),
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

          case 'get_merge_requests_by_user': {
            const { username, projectPath, state } = args as {
              username: string;
              projectPath?: string;
              state?: 'opened' | 'closed' | 'locked' | 'merged';
            };

            logger.info('Fetching merge requests by username', { username, projectPath, state });

            const mrs = await getMRsByUsername(username, {
              projectPath,
              state,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(mrs, null, 2),
                },
              ],
            };
          }

          case 'create_merge_request': {
            const {
              projectPath,
              sourceBranch,
              targetBranch,
              title,
              description,
              assigneeIds,
              reviewerIds,
              labels,
              removeSourceBranch,
              squash,
            } = args as {
              projectPath: string;
              sourceBranch: string;
              targetBranch: string;
              title: string;
              description?: string;
              assigneeIds?: number[];
              reviewerIds?: number[];
              labels?: string[];
              removeSourceBranch?: boolean;
              squash?: boolean;
            };

            logger.info('Creating merge request', {
              projectPath,
              sourceBranch,
              targetBranch,
              title,
            });

            const mr = await createMergeRequest(projectPath, {
              sourceBranch,
              targetBranch,
              title,
              description,
              assigneeIds,
              reviewerIds,
              labels,
              removeSourceBranch,
              squash,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(mr, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('Tool execution error', {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof GitLabError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: {
                      code: error.code,
                      message: error.message,
                      statusCode: error.statusCode,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        throw error;
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('Server error', { error: error.message });
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('GitLab MCP Server started');
  }
}

const server = new GitLabMCPServer();
server.run().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
