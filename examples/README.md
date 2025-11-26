# Examples

This directory contains configuration examples for GitLab MCP.

## Configuration Example

### `mcp-config.json`

**The MCP configuration is identical for all clients** - Cursor, VS Code, and Claude Desktop all use the same JSON structure. Only the file location differs:

**Cursor:**

- Settings → MCP Settings
- Or: `~/.cursor/mcp.json`

**VS Code:**

- Settings → Extensions → Claude Dev → MCP Settings

**Claude Desktop:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Quick Setup:**

1. Copy `mcp-config.json` to the appropriate location for your client
2. Replace `your_gitlab_token_here` with your GitLab access token
3. Replace `https://gitlab.com` with your GitLab instance URL (if different)
4. Restart your IDE/MCP client

## Library Usage Example

### `basic-usage.ts`

Example showing how to use GitLab MCP as a library in your TypeScript/Node.js projects.

**Usage:**

```bash
# Set environment variables first
export GITLAB_BASE_URL=https://gitlab.com
export GITLAB_TOKEN=your_token_here

# Build and run
npm run build
node dist/examples/basic-usage.js
```

For more examples and usage patterns, see the main [README.md](../README.md).
