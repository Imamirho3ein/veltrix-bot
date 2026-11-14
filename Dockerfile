FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dependencies first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/data

# Long polling — no inbound port is needed.
CMD ["npm", "start"]
