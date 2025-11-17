/**
 * Configuration loader from environment variables
 */
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Only load .env file if it exists (for local development)
// In Docker, environment variables are passed directly, so .env file won't exist
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

  // Ensure base URL doesn't end with a slash
  const normalizedUrl = gitlabBaseUrl.replace(/\/$/, '');

  return {
    gitlabBaseUrl: normalizedUrl,
    gitlabToken,
  };
}
