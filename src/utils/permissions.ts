/**
 * Permission and token scope detection
 */
import { GitLabErrorCode, GitLabError } from './errors.js';

export interface PermissionCheckResult {
  hasReadApi: boolean;
  hasApi: boolean;
  message?: string;
}

/**
 * Check token permissions from error response
 */
export function checkTokenPermissions(error: unknown): PermissionCheckResult {
  if (!(error instanceof GitLabError)) {
    return {
      hasReadApi: false,
      hasApi: false,
      message: 'Unable to determine token permissions',
    };
  }

  // 401/403 typically indicate missing scopes
  if (
    error.code === GitLabErrorCode.GITLAB_AUTH_ERR &&
    (error.statusCode === 401 || error.statusCode === 403)
  ) {
    return {
      hasReadApi: false,
      hasApi: false,
      message: 'Token missing read_api or api scope. Please check your token permissions.',
    };
  }

  // If we got past auth, assume we have at least read_api
  return {
    hasReadApi: true,
    hasApi: true,
  };
}

/**
 * Get user-friendly error message for permission issues
 */
export function getPermissionErrorMessage(error: unknown): string {
  const check = checkTokenPermissions(error);
  if (check.message) {
    return check.message;
  }

  if (error instanceof GitLabError) {
    return error.message;
  }

  return 'Unknown permission error';
}
