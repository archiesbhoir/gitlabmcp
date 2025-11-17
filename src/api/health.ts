/**
 * Health check and connectivity verification
 */
import { loadConfig } from '../utils/config.js';
import { GitLabErrorCode, createGitLabError } from '../utils/errors.js';

export interface HealthCheckResult {
  version: string;
  reachable: boolean;
  error?: string;
}

/**
 * Check GitLab connectivity and return version info
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const config = loadConfig();
  const url = `${config.gitlabBaseUrl}/api/v4/version`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': config.gitlabToken,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw createGitLabError(
          GitLabErrorCode.GITLAB_AUTH_ERR,
          'Authentication failed. Check your GITLAB_TOKEN.',
          response.status
        );
      }

      throw createGitLabError(
        GitLabErrorCode.GITLAB_UNKNOWN_ERR,
        `Health check failed with status ${response.status}`,
        response.status
      );
    }

    const data = (await response.json()) as { version?: string };

    return {
      version: data.version || 'unknown',
      reachable: true,
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'GITLAB_AUTH_ERR') {
      throw error;
    }

    return {
      version: 'unknown',
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
