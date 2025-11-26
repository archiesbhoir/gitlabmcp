# Docker Setup Guide

## Quick Start

1. **Build and run with Docker Compose:**

   ```bash
   docker-compose up -d
   ```

2. **Verify it's running:**

   ```bash
   curl http://localhost:8080/health
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f
   ```

4. **Stop the server:**
   ```bash
   docker-compose down
   ```

## Manual Docker Commands

**Build the image:**

```bash
docker build -t gitlab-mcp .
```

**Run the container:**

```bash
docker run -d \
  --name gitlab-mcp \
  -p 8080:8080 \
  --env-file .env \
  gitlab-mcp
```

**Or pass env vars directly:**

```bash
docker run -d \
  --name gitlab-mcp \
  -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.example.com \
  -e GITLAB_TOKEN=your_token_here \
  gitlab-mcp
```

**View logs:**

```bash
docker logs -f gitlab-mcp
```

**Stop and remove:**

```bash
docker stop gitlab-mcp
docker rm gitlab-mcp
```

## Environment Variables

The container needs these environment variables:

### Option 1: Using `.env` file (Recommended)

Create a `.env` file in the project root:

```bash
GITLAB_BASE_URL=https://gitlab.example.com
GITLAB_TOKEN=your_token_here
PORT=8080
```

Then use `--env-file .env` when running Docker:

```bash
docker run -p 8080:8080 --env-file .env gitlab-mcp
```

Or use `docker-compose` which automatically loads `.env`:

```bash
docker-compose up -d
```

### Option 2: Pass directly to Docker

```bash
docker run -p 8080:8080 \
  -e GITLAB_BASE_URL=https://gitlab.example.com \
  -e GITLAB_TOKEN=your_token_here \
  -e PORT=8080 \
  gitlab-mcp
```

### Option 3: In docker-compose.yml

You can also set them directly in `docker-compose.yml`:

```yaml
environment:
  - GITLAB_BASE_URL=https://gitlab.example.com
  - GITLAB_TOKEN=your_token_here
  - PORT=8080
```

**Required Variables:**

- `GITLAB_BASE_URL` - Your GitLab instance URL
- `GITLAB_TOKEN` - Your GitLab access token
- `PORT` - Server port (default: 8080)

## Accessing the Server

Once running, the server is available at:

- **Health Check:** `http://localhost:8080/health`
- **MCP Endpoint:** `http://localhost:8080/mcp`
- **REST API:** `http://localhost:8080/api/tools`
- **SSE Stream:** `http://localhost:8080/mcp/sse`

## Testing the API

**List available tools:**

```bash
curl http://localhost:8080/api/tools
```

**Call a tool:**

```bash
curl -X POST http://localhost:8080/api/tools/get_merge_request \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "delphi/delphi-platform", "iid": "1"}'
```

**MCP protocol call:**

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_merge_request",
      "arguments": {
        "projectPath": "delphi/delphi-platform",
        "iid": "1"
      }
    },
    "id": 1
  }'
```
