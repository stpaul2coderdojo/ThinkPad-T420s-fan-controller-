# Multi-stage Dockerfile for ThinkPad T420s Antigravity Thermal Agent
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json tsconfig*.json vite.config.ts index.html ./
RUN npm ci

# Copy application source code
COPY src/ ./src/
COPY public/ ./public/

# Build production bundle
RUN npm run build

# =========================================================
# Production Runtime Stage
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install Python and curl for ThinkPad ACPI procfs bridge (optional hardware mode)
RUN apk add --no-cache python3 py3-pip bash curl

# Install lightweight static server
RUN npm install -g serve

# Copy built frontend assets from builder
COPY --from=builder /app/dist /app/dist

# Copy companion daemon scripts
COPY scripts/ /app/scripts/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

EXPOSE 3000 9090

# Default entrypoint starts the dashboard web interface
CMD ["serve", "-s", "dist", "-l", "3000"]
