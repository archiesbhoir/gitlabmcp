import { loadConfig } from '../utils/config.js';
import { GitLabErrorCode, createGitLabError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

export interface RestRequestOptions {
  retries?: number;
  retryDelay?: number;
}

export interface RestPostOptions extends RestRequestOptions {
  body?: unknown;
}

export async function restRequest<T = unknown>(
  path: string,
  options: RestRequestOptions = {}
): Promise<T> {
  const logger = getLogger();
  const config = loadConfig();
  const url = `${config.gitlabBaseUrl}/api/v4${path}`;

  const { retries = 3, retryDelay = 1000 } = options;

  logger.debug('REST request', { path, url });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': config.gitlabToken,
        },
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
          'Rate limit exceeded',
          429,
          retryAfterSeconds
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_AUTH_ERR,
          'Authentication failed. Token may be missing read_api or api scope.',
          response.status
        );
      }

      if (response.status === 404) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_NOT_FOUND,
          `Resource not found: ${path}`,
          404
        );
      }

      if (!response.ok) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_UNKNOWN_ERR,
          `REST request failed with status ${response.status}`,
          response.status
        );
      }

      logger.debug('REST request successful', { path });
      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && 'code' in error) {
        const gitlabError = error as { code: GitLabErrorCode };
        if (
          gitlabError.code === GitLabErrorCode.GITLAB_AUTH_ERR ||
          gitlabError.code === GitLabErrorCode.GITLAB_NOT_FOUND ||
          gitlabError.code === GitLabErrorCode.GITLAB_RATE_LIMIT
        ) {
          logger.error('REST request failed (non-retryable)', {
            code: gitlabError.code,
            message: error.message,
            path,
          });
          throw error;
        }
      }

      if (attempt < retries) {
        const jitter = Math.random() * 500;
        const delay = retryDelay * Math.pow(2, attempt) + jitter;
        logger.warn('REST request failed, retrying', {
          attempt: attempt + 1,
          retries,
          delay,
          path,
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

export async function restPaginate<T = unknown>(
  path: string,
  options: RestRequestOptions & { perPage?: number } = {}
): Promise<T[]> {
  const { perPage = 100, ...restOptions } = options;
  const allResults: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const separator = path.includes('?') ? '&' : '?';
    const paginatedPath = `${path}${separator}page=${page}&per_page=${perPage}`;

    const results = await restRequest<T[]>(paginatedPath, restOptions);

    if (Array.isArray(results)) {
      allResults.push(...results);
      hasMore = results.length === perPage;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allResults;
}

export async function restPost<T = unknown>(
  path: string,
  options: RestPostOptions = {}
): Promise<T> {
  const logger = getLogger();
  const config = loadConfig();
  const url = `${config.gitlabBaseUrl}/api/v4${path}`;

  const { retries = 3, retryDelay = 1000, body } = options;

  logger.debug('REST POST request', { path, url });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': config.gitlabToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
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
          'Rate limit exceeded',
          429,
          retryAfterSeconds
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_AUTH_ERR,
          'Authentication failed. Token may be missing api scope.',
          response.status
        );
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { message?: string; error?: string }).message ||
          (errorData as { error?: string }).error ||
          'Bad request';
        throw createGitLabError(GitLabErrorCode.GITLAB_UNKNOWN_ERR, errorMessage, 400);
      }

      if (response.status === 404) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_NOT_FOUND,
          `Resource not found: ${path}`,
          404
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { message?: string; error?: string }).message ||
          (errorData as { error?: string }).error ||
          `REST POST request failed with status ${response.status}`;
        throw createGitLabError(GitLabErrorCode.GITLAB_UNKNOWN_ERR, errorMessage, response.status);
      }

      logger.debug('REST POST request successful', { path });
      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && 'code' in error) {
        const gitlabError = error as { code: GitLabErrorCode; statusCode?: number };
        if (
          gitlabError.code === GitLabErrorCode.GITLAB_AUTH_ERR ||
          gitlabError.code === GitLabErrorCode.GITLAB_NOT_FOUND ||
          gitlabError.code === GitLabErrorCode.GITLAB_RATE_LIMIT ||
          gitlabError.statusCode === 400
        ) {
          logger.error('REST POST request failed (non-retryable)', {
            code: gitlabError.code,
            message: error.message,
            path,
          });
          throw error;
        }
      }

      if (attempt < retries) {
        const jitter = Math.random() * 500;
        const delay = retryDelay * Math.pow(2, attempt) + jitter;
        logger.warn('REST POST request failed, retrying', {
          attempt: attempt + 1,
          retries,
          delay,
          path,
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
