# Stage 1: Dependencies
FROM node:20-alpine as dependencies
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine as builder
RUN npm install -g pnpm
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine as runner
RUN npm install -g pnpm
WORKDIR /app

# Copy built assets
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy necessary files for migrations
COPY --from=builder /app/database ./database
COPY --from=builder /app/config ./config
COPY --from=builder /app/ace ./ace

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Expose the port
EXPOSE 3333

# Start the server
CMD ["pnpm", "start"]
