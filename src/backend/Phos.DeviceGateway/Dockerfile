FROM node:18-slim
WORKDIR /app

# Create non-root user
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --shell /bin/bash appuser

# Copy package files and install dependencies
COPY --chown=appuser:appgroup package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY --chown=appuser:appgroup . .

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/healthz || exit 1

EXPOSE 80
CMD ["npm", "start"]
