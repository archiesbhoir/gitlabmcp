/**
 * Standardized error types for GitLab API interactions
 */

export enum GitLabErrorCode {
  GITLAB_NET_ERR = 'GITLAB_NET_ERR',
  GITLAB_AUTH_ERR = 'GITLAB_AUTH_ERR',
  GITLAB_RATE_LIMIT = 'GITLAB_RATE_LIMIT',
  GITLAB_NOT_FOUND = 'GITLAB_NOT_FOUND',
  GITLAB_GRAPHQL_ERR = 'GITLAB_GRAPHQL_ERR',
  GITLAB_UNKNOWN_ERR = 'GITLAB_UNKNOWN_ERR',
}

export class GitLabError extends Error {
  constructor(
    public code: GitLabErrorCode,
    message: string,
    public statusCode?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GitLabError';
  }
}

export function createGitLabError(
  code: GitLabErrorCode,
  message: string,
  statusCode?: number,
  retryAfter?: number
): GitLabError {
  return new GitLabError(code, message, statusCode, retryAfter);
}
