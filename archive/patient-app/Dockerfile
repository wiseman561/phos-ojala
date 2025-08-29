FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install && npm run build

EXPOSE 80
CMD ["npx", "serve", "-s", "build", "-l", "80"]
