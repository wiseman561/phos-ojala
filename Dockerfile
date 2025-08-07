FROM node:18-slim as build

WORKDIR /app

# Create non-root user
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --shell /bin/bash appuser && \
    chown -R appuser:appgroup /app

# Only copy the package.json and package-lock.json first for better caching
COPY src/backend/Phos.TelemetryProcessor/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy only the rest of the source after dependencies are installed
COPY src/backend/Phos.TelemetryProcessor/ ./

# Set correct permissions
RUN chown -R appuser:appgroup /app

# (Optional but recommended) Clean up npm cache to reduce image size
RUN npm cache clean --force

# Create directory for Vault secrets
RUN mkdir -p /vault/secrets

# Expose port (optional unless needed in Docker Compose)
EXPOSE 80

ENV NODE_ENV=production

# Switch to non-root user
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start the application
CMD ["node", "processor.js"]
