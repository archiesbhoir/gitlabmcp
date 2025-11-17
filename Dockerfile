FROM node:20-slim

WORKDIR /app

# Remove any existing npm config files and set environment variables
# to force use of public npm registry
RUN rm -rf ~/.npmrc /root/.npmrc /etc/npmrc /usr/local/etc/npmrc && \
    npm config delete registry 2>/dev/null || true && \
    npm config delete @*:registry 2>/dev/null || true

# Set environment variables to override any npm config
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
ENV NPM_CONFIG_STRICT_SSL=true

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use environment variable and explicit flag to ensure public registry
RUN npm ci --registry https://registry.npmjs.org/

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start HTTP server
CMD ["node", "dist/server-http.js"]

