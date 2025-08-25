FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/main.js"]
