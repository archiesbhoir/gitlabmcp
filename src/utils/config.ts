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
    throw new Error('GITLAB_BASE_URL environment variable is required');
  }

  if (!gitlabToken) {
    throw new Error('GITLAB_TOKEN environment variable is required');
  }

  const normalizedUrl = gitlabBaseUrl.replace(/\/$/, '');

  return {
    gitlabBaseUrl: normalizedUrl,
    gitlabToken,
  };
}
