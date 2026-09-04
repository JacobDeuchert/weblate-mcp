# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies (cached unless lockfile/manifest changes)
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build the project
COPY . .
RUN pnpm run build

# Prune dev dependencies so only production deps are copied into the runtime image
RUN pnpm prune --prod

# ---- Runtime stage ----
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Copy production node_modules and build output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Run as the non-root user that ships with the node image
USER node

# MCP server communicates over STDIO
ENTRYPOINT ["node", "dist/main.js"]
