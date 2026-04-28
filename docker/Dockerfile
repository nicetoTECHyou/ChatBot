FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    python3 make g++ git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Build shared ----
FROM base AS build-shared
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src/ ./packages/shared/src/
RUN cd packages/shared && npm install && npm run build

# ---- Build bot ----
FROM base AS build-bot
COPY packages/shared/package.json ./packages/shared/
COPY --from=build-shared /app/packages/shared/dist/ ./packages/shared/dist/
COPY packages/shared/src/ ./packages/shared/src/
COPY packages/bot/package.json ./packages/bot/
COPY packages/bot/tsconfig.json ./packages/bot/
COPY packages/bot/src/ ./packages/bot/src/
RUN cd packages/bot && npm install && npm run build

# ---- Build admin dashboard ----
FROM base AS build-admin
COPY packages/admin/package.json ./packages/admin/
COPY packages/admin/tsconfig.json ./packages/admin/
COPY packages/admin/next.config.js ./packages/admin/
COPY packages/admin/tailwind.config.ts ./packages/admin/
COPY packages/admin/postcss.config.js ./packages/admin/
COPY packages/admin/src/ ./packages/admin/src/
RUN cd packages/admin && npm install && npm run build

# ---- Final image ----
FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages/shared/package.json ./packages/shared/
COPY --from=build-shared /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=build-shared /app/packages/shared/node_modules/ ./packages/shared/node_modules/

COPY packages/bot/package.json ./packages/bot/
COPY --from=build-bot /app/packages/bot/dist/ ./packages/bot/dist/
COPY --from=build-bot /app/packages/bot/node_modules/ ./packages/bot/node_modules/

COPY --from=build-admin /app/packages/admin/out/ ./packages/admin/out/

COPY package.json ./
COPY README.md ./

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV ADMIN_PORT=3001
ENV DB_PATH=/app/data/streamforge.db

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s \
    CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "packages/bot/dist/index.js"]
