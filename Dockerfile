FROM node:lts-bookworm-slim AS base
WORKDIR /app
RUN apt update
RUN apt install -y curl wget fontconfig
RUN rm -rf /var/lib/apt/lists/*

# Base installer
FROM base AS installer
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
# Copy package files first
COPY package.json pnpm-lock.yaml ./
COPY ace ace

# All deps stage
FROM installer AS deps
RUN pnpm install --frozen-lockfile

# Production only deps stage
FROM installer AS production-deps
RUN pnpm install --prod --frozen-lockfile

# Build stage
FROM installer AS build
COPY . .
COPY --from=deps /app/node_modules /app/node_modules
ENV NODE_ENV=production
RUN node ace build --ignore-ts-errors

# Production stage
FROM base
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV FONTCONFIG_PATH=/etc/fonts
WORKDIR /app

# Copy production files
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/ace ./ace
COPY --from=build /app/database ./database
COPY --from=build /app/config ./config

EXPOSE 3333
CMD ["node", "./build/server.js"]
