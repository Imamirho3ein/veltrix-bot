FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dependencies first (better layer caching).
# tsx runs the TypeScript sources directly, so dev dependencies are needed
# at runtime too (NODE_ENV=production would make plain `npm ci` skip them).
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src

RUN mkdir -p /app/data

# Long polling — no inbound port is needed.
CMD ["npm", "start"]
