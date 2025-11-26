#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const CONFIG_FILE = join(homedir(), '.gitlabmcp', 'config.json');

interface Config {
  gitlabBaseUrl?: string;
  gitlabToken?: string;
}

function readConfig(): Config {
  if (existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function writeConfig(config: Config): void {
  const configDir = join(homedir(), '.gitlabmcp');
  if (!existsSync(configDir)) {
    execSync(`mkdir -p "${configDir}"`, { stdio: 'ignore' });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function authCommand(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const config = readConfig();

    console.log('GitLab MCP Authentication Setup\n');
    console.log('You need a GitLab access token with "read_api" or "api" scope.');
    console.log('Create one at: https://gitlab.com/-/profile/personal_access_tokens\n');

    const baseUrl = await question(
      rl,
      `GitLab Base URL [${config.gitlabBaseUrl || 'https://gitlab.com'}]: `
    );
    const token = await question(rl, 'GitLab Access Token: ');

    const finalConfig: Config = {
      gitlabBaseUrl: baseUrl.trim() || config.gitlabBaseUrl || 'https://gitlab.com',
      gitlabToken: token.trim() || config.gitlabToken,
    };

    if (!finalConfig.gitlabToken) {
      console.error('\nError: GitLab token is required');
      process.exit(1);
    }

    writeConfig(finalConfig);

    console.log('\n✓ Configuration saved to', CONFIG_FILE);
    console.log('\nTo use this configuration:');
    console.log('  export GITLAB_BASE_URL=' + finalConfig.gitlabBaseUrl);
    console.log('  export GITLAB_TOKEN=' + finalConfig.gitlabToken);
    console.log('\nOr add to your MCP client config:');
    console.log(
      JSON.stringify(
        {
          env: {
            GITLAB_BASE_URL: finalConfig.gitlabBaseUrl,
            GITLAB_TOKEN: finalConfig.gitlabToken,
          },
        },
        null,
        2
      )
    );
  } finally {
    rl.close();
  }
}

async function openCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('Usage: gitlab-mcp open <mr-url>');
    console.error('Example: gitlab-mcp open https://gitlab.com/group/project/-/merge_requests/123');
    process.exit(1);
  }

  const url = args[0];

  // Validate GitLab MR URL
  if (!url.includes('merge_requests')) {
    console.error('Error: Invalid GitLab merge request URL');
    process.exit(1);
  }

  try {
    // Use platform-specific open command
    const platform = process.platform;
    let command: string;

    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    execSync(command, { stdio: 'ignore' });
    console.log('Opened:', url);
  } catch (error) {
    console.error('Error opening URL:', error);
    console.error('Please open manually:', url);
    process.exit(1);
  }
}

function syncExtensionsCommand(): void {
  console.log('GitLab MCP Recommended Extensions\n');
  console.log('For the best experience with GitLab MCP, consider installing:');
  console.log('');
  console.log('1. Cursor IDE - Built-in MCP support');
  console.log('   https://cursor.sh/');
  console.log('');
  console.log('2. Claude Desktop - MCP client');
  console.log('   https://claude.ai/download');
  console.log('');
  console.log('3. VS Code with Claude Dev extension');
  console.log('   https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev');
  console.log('');
  console.log('Configuration examples are available in:');
  console.log('  - examples/cursor-mcp-config.json');
  console.log('  - examples/vscode-mcp-config.json');
  console.log('  - examples/claude-desktop-config.json');
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'auth':
      authCommand().catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
      break;
    case 'open':
      openCommand(args.slice(1)).catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
      break;
    case 'sync-extensions':
      syncExtensionsCommand();
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log('GitLab MCP CLI\n');
      console.log('Commands:');
      console.log('  auth              Interactive token setup');
      console.log('  open <mr-url>     Open a merge request in browser');
      console.log('  sync-extensions   Show recommended extensions');
      console.log('  help              Show this help message');
      break;
    default:
      if (command) {
        console.error(`Unknown command: ${command}`);
        console.error('Run "gitlab-mcp help" for usage information');
        process.exit(1);
      } else {
        console.log('GitLab MCP CLI');
        console.log('Run "gitlab-mcp help" for usage information');
      }
  }
}

main();
