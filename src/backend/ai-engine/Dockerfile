# Stage 1: Builder
FROM node:18-slim AS node-builder

WORKDIR /app

# Copy package files
COPY src/backend/ai-engine/package*.json ./

# Install Node.js dependencies including OpenAI
RUN npm install --production
RUN npm install openai

# Stage 2: Python Builder
FROM python:3.9-slim AS python-builder

WORKDIR /app

# Install dependencies
COPY src/backend/ai-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final
FROM node:18-slim

WORKDIR /app

# Install Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Copy Node.js dependencies from node-builder
COPY --from=node-builder /app/node_modules ./node_modules

# Copy Python dependencies from python-builder
COPY --from=python-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src/backend/ai-engine/ .

# Create directory for Vault secrets
RUN mkdir -p /vault/secrets && chown -R appuser:appuser /vault/secrets

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production

# Expose port
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Run the application using Node.js
CMD ["node", "integration.js"]
