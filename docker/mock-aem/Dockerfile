# Mock AEM Server for WebMCP Testing
# Provides a lightweight mock of AEM endpoints for E2E testing

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 4502

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:4502/health || exit 1

# Start server
CMD ["node", "server.js"]
