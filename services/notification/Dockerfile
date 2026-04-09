FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "--loader", "ts-node/esm", "server.ts"]
