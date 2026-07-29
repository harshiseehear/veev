FROM node:20-slim
WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

# Build the frontend, then keep the server + built assets.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.js"]
