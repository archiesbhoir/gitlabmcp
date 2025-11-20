# GitLab Merge Request Viewer via MCP

A GitLab Merge Request viewer that fetches MR data (commits, pipelines, approvals, diffs, discussions) using GitLab GraphQL + REST APIs.

## Quick Start

### Using npx

```bash
# Stdio server (for MCP clients like Claude Desktop)
npx @archisbhoir/gitlabmcp@latest

# HTTP server (for REST API access)
npx -p @archisbhoir/gitlabmcp@latest node dist/server-http.js
```

Set environment variables:

```bash
export GITLAB_BASE_URL=https://gitlab.example.com
export GITLAB_TOKEN=your_token_here
```

### Install from npm

```bash
npm install -g @archisbhoir/gitlabmcp

# Run stdio server
gitlabmcp

# Run HTTP server
gitlabmcp-http
```

## Configuration

Create `.env` file or set environment variables:

```bash
GITLAB_BASE_URL=https://gitlab.example.com
GITLAB_TOKEN=your_token_here
```

**Note:** Token needs `read_api` or `api` scope to access merge requests.

## MCP Client Configuration

### Stdio (Claude Desktop)

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "npx",
      "args": ["@archisbhoir/gitlabmcp@latest"],
      "env": {
        "GITLAB_BASE_URL": "https://gitlab.example.com",
        "GITLAB_TOKEN": "your_token_here"
      }
    }
  }
}
```

### HTTP

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "url": "http://localhost:8080/mcp",
      "transport": "http"
    }
  }
}
```

## MCP Tools

### `get_merge_request`

Fetch a complete merge request with all data.

**Parameters:**

- `projectPath` (required): Full project path (e.g., `"group/project"`)
- `iid` (required): Merge request IID (e.g., `"123"`)
- `includeCommits` (optional): Include commits (default: `true`)
- `includeDiscussions` (optional): Include discussions (default: `true`)
- `includeDiffs` (optional): Include diffs/changes (default: `false`)
- `includeApprovals` (optional): Include approval details (default: `false`)
- `forceRefresh` (optional): Bypass cache (default: `false`)

### `get_merge_request_commits`

Fetch all commits for a merge request.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

### `get_merge_request_discussions`

Fetch all discussions for a merge request.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

### `get_merge_request_diffs`

Fetch diffs/changes for a merge request.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

### `get_merge_request_approvals`

Fetch approval details for a merge request.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

### `get_merge_requests_by_user`

Fetch all merge requests for a username.

**Parameters:**

- `username` (required): GitLab username
- `projectPath` (optional): Filter by project path
- `state` (optional): Filter by state (`"opened"`, `"closed"`, `"locked"`, `"merged"`)

### `create_merge_request`

Create a new merge request. Requires `api` scope in token.

**Parameters:**

- `projectPath` (required): Full project path
- `sourceBranch` (required): Source branch
- `targetBranch` (required): Target branch
- `title` (required): Merge request title
- `description` (optional): Description
- `assigneeIds` (optional): Array of user IDs
- `reviewerIds` (optional): Array of user IDs
- `labels` (optional): Array of label names
- `removeSourceBranch` (optional): Remove source branch when merged
- `squash` (optional): Squash commits when merging

### `health_check`

Check GitLab connectivity and version.

## HTTP Server Endpoints

When running the HTTP server (`gitlabmcp-http`):

- `GET /health` - Health check
- `POST /mcp` - MCP protocol endpoint
- `GET /api/tools` - List available tools
- `POST /api/tools/:toolName` - Call a tool via REST API

## Library Usage

```bash
npm install @archisbhoir/gitlabmcp
```

```typescript
import {
  getMergeRequestView,
  fetchAllCommits,
  fetchAllDiscussions,
  getMRChangesRest,
  getMRApprovalsRest,
} from '@archisbhoir/gitlabmcp';

// Get complete MR view
const view = await getMergeRequestView('group/project', '123');

// Fetch all commits
const commits = await fetchAllCommits('group/project', '123');

// Fetch all discussions
const discussions = await fetchAllDiscussions('group/project', '123');

// Get diffs and approvals via REST
const changes = await getMRChangesRest('group/project', '123');
const approvals = await getMRApprovalsRest('group/project', '123');
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
