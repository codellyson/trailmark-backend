FROM node:lts-bookworm-slim AS base
WORKDIR /app
RUN apt update
RUN apt install -y curl wget fontconfig
RUN rm -rf /var/lib/apt/lists/*

# Base installer
FROM base AS installer
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
COPY . .

# All deps stage
FROM installer AS deps
RUN pnpm install --frozen-lockfile

# Production only deps stage
FROM installer AS production-deps
RUN pnpm install --prod --frozen-lockfile

# Build stage
FROM installer AS build
COPY --from=deps /app/node_modules /app/node_modules
RUN node ace build --production --ignore-ts-errors

# Production stage
FROM base
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV FONTCONFIG_PATH=/etc/fonts

# Copy production files
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/ace /app/ace
COPY --from=build /app/database /app/database
COPY --from=build /app/config /app/config

EXPOSE 3333
CMD ["node", "./build/server.js"]
