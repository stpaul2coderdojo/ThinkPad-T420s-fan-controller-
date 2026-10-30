# =========================================================
# Multi-stage Dockerfile for ThinkPad T420s Antigravity Thermal Agent
# Author: Dr. Bheemaiah Anil K, Director, Synergy Robotics Seattle
# License: MIT
# =========================================================

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig*.json vite.config.ts index.html ./
RUN npm install

# Copy source and public assets
COPY src/ ./src/
COPY public/ ./public/

# Build production bundle
RUN npm run build

# =========================================================
# Stage 2: Production Runtime (Compatible with Docker & Render)
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for container health check & python3 for ThinkPad ACPI bridge
RUN apk add --no-cache curl python3 bash

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend assets from builder
COPY --from=builder /app/dist ./dist

# Copy production Express server
COPY server.js ./

# Copy companion hardware scripts
COPY scripts/ ./scripts/

# Container Healthcheck (matches Render & Docker Compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/healthz || exit 1

EXPOSE 3000 9090

# Launch production server (automatically binds to $PORT or default 3000)
CMD ["node", "server.js"]
