import { loadConfig } from '../utils/config.js';
import { GitLabErrorCode, createGitLabError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

export interface GraphQLRequestOptions {
  retries?: number;
  retryDelay?: number;
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options: GraphQLRequestOptions = {}
): Promise<T> {
  const logger = getLogger();
  const config = loadConfig();
  const url = `${config.gitlabBaseUrl}/api/graphql`;

  const { retries = 3, retryDelay = 1000 } = options;

  logger.debug('GraphQL request', { url, variables });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PRIVATE-TOKEN': config.gitlabToken,
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;

        if (attempt < retries) {
          const jitter = Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000 + jitter));
          continue;
        }

        throw createGitLabError(
          GitLabErrorCode.GITLAB_RATE_LIMIT,
          `Rate limit exceeded. Please retry after ${retryAfterSeconds} seconds.\n` +
            'GitLab API rate limits: https://docs.gitlab.com/ee/api/#rate-limits',
          429,
          retryAfterSeconds
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_AUTH_ERR,
          'Authentication failed. Token may be missing read_api or api scope.\n' +
            'Create a token at: https://gitlab.com/-/profile/personal_access_tokens\n' +
            'Required scopes: read_api (for read operations) or api (for read/write operations)',
          response.status
        );
      }

      if (!response.ok) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_UNKNOWN_ERR,
          `GraphQL request failed with status ${response.status}`,
          response.status
        );
      }

      const result = (await response.json()) as GraphQLResponse<T>;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join(', ');
        throw createGitLabError(
          GitLabErrorCode.GITLAB_GRAPHQL_ERR,
          `GraphQL errors: ${errorMessages}`,
          response.status
        );
      }

      if (!result.data) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_GRAPHQL_ERR,
          'GraphQL response missing data',
          response.status
        );
      }

      logger.debug('GraphQL request successful');
      return result.data;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && 'code' in error) {
        const gitlabError = error as { code: GitLabErrorCode };
        if (
          gitlabError.code === GitLabErrorCode.GITLAB_AUTH_ERR ||
          gitlabError.code === GitLabErrorCode.GITLAB_RATE_LIMIT
        ) {
          logger.error('GraphQL request failed (non-retryable)', {
            code: gitlabError.code,
            message: error.message,
          });
          throw error;
        }
      }

      if (attempt < retries) {
        const jitter = Math.random() * 500;
        const delay = retryDelay * Math.pow(2, attempt) + jitter;
        logger.warn('GraphQL request failed, retrying', {
          attempt: attempt + 1,
          retries,
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (lastError) {
    if (lastError instanceof Error && 'code' in lastError) {
      throw lastError;
    }
    throw createGitLabError(
      GitLabErrorCode.GITLAB_NET_ERR,
      `Network error after ${retries} retries: ${lastError.message}`
    );
  }

  throw createGitLabError(GitLabErrorCode.GITLAB_NET_ERR, 'Unknown network error');
}
