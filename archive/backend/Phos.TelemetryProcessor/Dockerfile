FROM node:18-slim as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY src/backend/Phos.TelemetryProcessor/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src/backend/Phos.TelemetryProcessor/ ./

# Expose port
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production

# Create directory for Vault secrets
RUN mkdir -p /vault/secrets

# Start the application
CMD ["node", "processor.js"]
