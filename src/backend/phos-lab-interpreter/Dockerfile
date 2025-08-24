FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./ 2>/dev/null || true
RUN npm i -g @nestjs/cli && (npm ci || npm install)
COPY . .
RUN npm run build && npm prune --omit=dev || true

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 8094
CMD ["node", "dist/main.js"]


