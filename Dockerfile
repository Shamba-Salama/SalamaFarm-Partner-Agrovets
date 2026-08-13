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
RUN npm install --no-audit

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

# TanStack Start/Nitro emits static assets to .output/public
COPY --from=build /app/.output/public /usr/share/nginx/html

EXPOSE 80

# Use nginx with daemon off
CMD ["nginx", "-g", "daemon off;"]