# ──────────────────────────────────────────────────────────────────────────────
# SalamaFarm Partner Agrovets — React frontend (Vite/TanStack Start)
# Multi-stage build: Node.js 20 → nginx:alpine
# ──────────────────────────────────────────────────────────────────────────────

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit

# Copy source code
COPY . .

# Build for production - configurable API URL
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 101 -S nginx && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

EXPOSE 80

# Use nginx with daemon off
CMD ["nginx", "-g", "daemon off;"]