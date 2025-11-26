import dotenv from 'dotenv';
import { existsSync } from 'fs';

if (existsSync('.env')) {
  dotenv.config();
}

export interface Config {
  gitlabBaseUrl: string;
  gitlabToken: string;
}

export function loadConfig(): Config {
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;

  if (!gitlabBaseUrl) {
    throw new Error(
      'GITLAB_BASE_URL environment variable is required.\n' +
        'Please set it to your GitLab instance URL (e.g., https://gitlab.com).\n' +
        'For help, see: https://github.com/archisbhoir/gitlabmcp#configuration'
    );
  }

  if (!gitlabToken) {
    throw new Error(
      'GITLAB_TOKEN environment variable is required.\n' +
        'Please create a GitLab access token with "read_api" or "api" scope.\n' +
        'Create one at: https://gitlab.com/-/profile/personal_access_tokens\n' +
        'For help, see: https://github.com/archisbhoir/gitlabmcp#configuration'
    );
  }

  const normalizedUrl = gitlabBaseUrl.replace(/\/$/, '');

  return {
    gitlabBaseUrl: normalizedUrl,
    gitlabToken,
  };
}
