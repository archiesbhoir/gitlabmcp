# GitLab Merge Request Viewer via MCP

A comprehensive GitLab Merge Request viewer that fetches MR data (commits, pipelines, approvals, diffs, discussions) using GitLab GraphQL + REST APIs, similar to IntelliJ's MR viewer.

## Features

✅ **GraphQL API Integration** - Primary data fetching via GitLab GraphQL API
✅ **REST API Fallbacks** - Fallback to REST API when needed
✅ **Pagination Support** - Cursor-based pagination for commits and discussions
✅ **Caching** - LRU cache with configurable TTL (30s for MR, 2min for diffs)
✅ **Real-time Updates** - Polling mechanism for MR updates
✅ **Error Handling** - Standardized errors with retry logic and rate limit handling
✅ **Permission Detection** - Token scope validation
✅ **Observability** - JSON logging for requests, cache hits, and errors
✅ **TypeScript** - Full type safety with comprehensive interfaces
✅ **Testing** - Unit tests with Vitest

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with your GitLab credentials:

```bash
GITLAB_BASE_URL=https://git.egnyte-internal.com
GITLAB_TOKEN=your_token_here
```

**Note:** Your token needs `read_api` or `api` scope to access merge requests.

3. Build the project:

```bash
npm run build
```

## Running the MCP Server

The MCP server communicates via stdio and is designed to be used with MCP-compatible clients (like Claude Desktop, Cursor, etc.).

### Start the server:

```bash
npm start
```

Or directly:

```bash
node dist/server.js
```

### MCP Client Configuration

To use this server with an MCP client, add it to your client configuration. For example, in Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "node",
      "args": ["/path/to/gitlabmcp/dist/server.js"],
      "env": {
        "GITLAB_BASE_URL": "https://git.egnyte-internal.com",
        "GITLAB_TOKEN": "your_token_here"
      }
    }
  }
}
```

Or use environment variables from `.env` file (the server will automatically load them).

## Development

- `npm run build` - Build TypeScript to `dist/`
- `npm run dev` - Watch mode for development
- `npm test` - Run tests
- `npm test -- --watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check without building

## MCP Tools

The server exposes the following tools that can be called by MCP clients:

### `get_merge_request`

Fetch a complete merge request with all data.

**Parameters:**

- `projectPath` (required): Full project path (e.g., `"delphi/delphi-platform"`)
- `iid` (required): Merge request IID (e.g., `"123"`)
- `includeCommits` (optional): Include commits (default: `true`)
- `includeDiscussions` (optional): Include discussions (default: `true`)
- `includeDiffs` (optional): Include diffs/changes via REST API (default: `false`)
- `includeApprovals` (optional): Include full approval details via REST API (default: `false`)
- `forceRefresh` (optional): Bypass cache (default: `false`)

**Returns:** Complete `MergeRequestView` object with commits, pipelines, approvals, diffs, and discussions.

### `get_merge_request_commits`

Fetch all commits for a merge request with automatic pagination.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

**Returns:** Array of commit objects.

### `get_merge_request_discussions`

Fetch all discussions for a merge request with automatic pagination.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

**Returns:** Array of discussion objects with notes.

### `get_merge_request_diffs`

Fetch diffs/changes for a merge request using REST API.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

**Returns:** Changes object with diff data.

### `get_merge_request_approvals`

Fetch approval details for a merge request using REST API.

**Parameters:**

- `projectPath` (required): Full project path
- `iid` (required): Merge request IID

**Returns:** Approval information with approvers and requirements.

### `health_check`

Check GitLab connectivity and version.

**Parameters:** None

**Returns:** Health status with version and reachability.

## MCP Resources

### `gitlab://health`

Resource URI that returns GitLab health status as JSON.

## Library Usage (Direct API)

You can also use the library directly in your code:

### With Polling

```typescript
import { pollMergeRequest } from './src/index.js';

const controller = pollMergeRequest('group/project', '123', {
  intervalMs: 30000, // Poll every 30 seconds
  onUpdate: (updatedView) => {
    console.log('MR updated:', updatedView.updatedAt);
  },
  onError: (error) => {
    console.error('Polling error:', error);
  },
});

// Stop polling
controller.stop();
```

### With Pagination

```typescript
import { fetchAllCommits, fetchAllDiscussions } from './src/index.js';

// Fetch all commits (handles pagination automatically)
const allCommits = await fetchAllCommits('group/project', '123');

// Fetch all discussions
const allDiscussions = await fetchAllDiscussions('group/project', '123');
```

### REST Fallbacks

```typescript
import { getMRRest, getMRCommitsRest, getMRChangesRest, getMRApprovalsRest } from './src/index.js';

// Use REST API directly
const mr = await getMRRest('group/project', '123');
const commits = await getMRCommitsRest('group/project', '123');
const changes = await getMRChangesRest('group/project', '123');
const approvals = await getMRApprovalsRest('group/project', '123');
```

## Project Structure

```
src/
  api/
    graphql.ts           # GraphQL client with retry logic
    rest.ts              # REST client with pagination
    mergeRequest.ts      # GraphQL-based MR fetcher
    mergeRequestRest.ts  # REST-based MR fetchers
    mergeRequestView.ts  # High-level API with caching
    normalize.ts         # Data normalization layer
    pagination.ts        # Pagination helpers
    polling.ts           # Real-time polling
    health.ts            # Health check
  types/
    index.ts             # TypeScript interfaces
  queries/
    mergeRequest.ts      # GraphQL queries and types
  utils/
    config.ts            # Configuration loader
    errors.ts            # Error types and helpers
    cache.ts             # LRU cache implementation
    permissions.ts       # Permission checking
    logger.ts            # JSON logger
  __tests__/            # Unit tests
```

## API Reference

### Core Functions

- `healthCheck()` - Check GitLab connectivity and version
- `getMergeRequestView(fullPath, iid, options?)` - Get normalized MR view with caching
- `getMergeRequest(fullPath, iid, options?)` - Get raw GraphQL MR data
- `pollMergeRequest(fullPath, iid, options?)` - Poll for MR updates

### Pagination

- `fetchMoreCommits(fullPath, iid, cursor, options?)` - Fetch next page of commits
- `fetchMoreDiscussions(fullPath, iid, cursor, options?)` - Fetch next page of discussions
- `fetchAllCommits(fullPath, iid, options?)` - Fetch all commits (auto-paginate)
- `fetchAllDiscussions(fullPath, iid, options?)` - Fetch all discussions (auto-paginate)

### REST API

- `getMRRest(projectId, iid, options?)` - Get MR via REST
- `getMRCommitsRest(projectId, iid, options?)` - Get commits via REST
- `getMRChangesRest(projectId, iid, options?)` - Get changes/diffs via REST
- `getMRApprovalsRest(projectId, iid, options?)` - Get approvals via REST
- `getMRPipelinesRest(projectId, sha, options?)` - Get pipelines via REST

## Error Handling

The library uses standardized error codes:

- `GITLAB_NET_ERR` - Network errors
- `GITLAB_AUTH_ERR` - Authentication failures (401/403)
- `GITLAB_RATE_LIMIT` - Rate limit exceeded (429)
- `GITLAB_NOT_FOUND` - Resource not found (404)
- `GITLAB_GRAPHQL_ERR` - GraphQL errors
- `GITLAB_UNKNOWN_ERR` - Other errors

All errors include retry logic with exponential backoff and jitter, except for auth and not-found errors.

## Caching

The library includes an LRU cache with configurable TTL:

- Default MR cache: 30 seconds
- Default diffs cache: 2 minutes
- Configurable via `getDefaultCache(options)`

Use `forceRefresh: true` in options to bypass cache.

## Logging

The library uses JSON logging. Set log level via environment variable or programmatically:

```typescript
import { getLogger, LogLevel } from './src/index.js';

const logger = getLogger(LogLevel.DEBUG);
```

## Testing

### Unit Tests

Run unit tests (mocked API):

```bash
npm test
# or
npm run test:unit
```

### End-to-End Tests

Run end-to-end tests against real GitLab API:

```bash
npm run test:e2e
```

**Requirements for E2E tests:**

- `GITLAB_BASE_URL` and `GITLAB_TOKEN` must be set in your environment
- `E2E_TEST_PROJECT_PATH` and `E2E_TEST_MR_IID` are **required** to test specific MRs
- E2E tests are automatically skipped if any required variables are not available

**Example:**

```bash
export GITLAB_BASE_URL=https://git.egnyte-internal.com
export GITLAB_TOKEN=your_token_here
export E2E_TEST_PROJECT_PATH=your-group/your-project
export E2E_TEST_MR_IID=123
npm run test:e2e
```

**Note:** Replace `your-group/your-project` with an actual project path from your GitLab instance, and `123` with a real merge request IID.

### Coverage

Generate coverage reports:

```bash
npm test -- --coverage
```

## License

MIT
