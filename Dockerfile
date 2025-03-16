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
WORKDIR /app

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy all build artifacts
COPY --from=build /app/build ./
COPY --from=build /app/package.json ./

EXPOSE 3333
CMD ["node", "server.js"]

# Add health check after CMD to ensure application is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1
