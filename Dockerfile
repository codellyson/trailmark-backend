FROM node:lts-bookworm-slim AS base
WORKDIR /app
RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*

#install pnpm
RUN npm install -g pnpm

# Base installer
FROM base AS installer
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
# Copy package files first
COPY package.json pnpm-lock.yaml ./

# All deps stage
FROM installer AS deps
RUN pnpm install --frozen-lockfile

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
ADD package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build --ignore-ts-errors

# Production stage
FROM base
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0
WORKDIR /app

# Copy production files
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build/ace.js ./ace.js
COPY --from=build /app/build/adonisrc.js ./adonisrc.js
COPY --from=build /app/database ./database

EXPOSE 3333

# Run migrations and start the server
CMD node ace migration:run --force && node ./build/bin/server.js

# Add health check after CMD to ensure application is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1
