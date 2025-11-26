# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-XX

### 🎉 Stable Release

First stable release of GitLab MCP - a Model Context Protocol server that brings GitLab merge requests into AI assistants.

### Added

- **8 MCP Tools** for comprehensive merge request operations:
  - `get_merge_request` - Fetch complete MR with commits, discussions, diffs, approvals
  - `get_merge_request_commits` - Get all commits for an MR
  - `get_merge_request_discussions` - Get all discussions/comments
  - `get_merge_request_diffs` - Get file changes/diffs
  - `get_merge_request_approvals` - Get approval status and approvers
  - `get_merge_requests_by_user` - Find MRs by username
  - `create_merge_request` - Create new merge requests
  - `health_check` - Check GitLab connectivity

- **CLI Commands** for developer convenience:
  - `gitlab-mcp auth` - Interactive token setup
  - `gitlab-mcp open <mr-url>` - Open merge request in browser
  - `gitlab-mcp sync-extensions` - Show recommended extensions

- **HTTP Server Mode** for custom integrations
  - REST API endpoints for tool access
  - MCP protocol endpoint
  - Health check endpoint
  - SSE streaming support

- **Library Usage** - Importable TypeScript/JavaScript module
- **Docker Support** - Dockerfile and docker-compose.yml
- **Comprehensive Documentation**:
  - Complete README with examples
  - CONTRIBUTING.md
  - CODE_OF_CONDUCT.md
  - DOCKER.md
  - Configuration examples

### Features

- Deep merge request reading (commits, discussions, diffs, approvals, pipelines)
- Query merge requests by user
- Create merge requests via AI
- Built-in caching for performance
- Comprehensive error handling with helpful messages
- Support for GitLab.com and self-hosted instances
- Works with Cursor, Claude Desktop, VS Code, and custom clients

### Technical

- TypeScript implementation
- Model Context Protocol (MCP) compliant
- GitLab GraphQL + REST API integration
- stdio and HTTP transport support
- LRU cache for API responses
- Retry logic with exponential backoff
- Rate limit handling

## [0.1.0] - 2024-XX-XX

### Added

- Initial release
- Basic merge request fetching capabilities
- MCP server implementation



