# Front-end – multi-stage Node build
ARG NODE_VERSION=18-bookworm-slim

####################  Build stage  ####################
FROM node:${NODE_VERSION} AS build
WORKDIR /app
# Copy package files separately to leverage Docker cache
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
# Copy source and build
COPY . .
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
        npm run build ; \
    else \
        echo "Skip build in development"; \
    fi

####################  Runtime stage  ###################
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
# Bring built files & node_modules
COPY --from=build /app /app
EXPOSE ${PORT}
# If PROD bundle exists, serve it; otherwise run dev server
CMD [ "sh", "-c", "if [ -d build ]; then npx serve -s build -l ${PORT}; else npm run dev -- --port ${PORT}; fi" ]
