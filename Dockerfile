# Build stage — runs `shadcn build` for every package, emits per-brand JSON
FROM node:22-alpine AS builder
WORKDIR /build
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile=false
RUN pnpm run build:all

# Runtime stage — nginx serves the static JSON
FROM nginx:alpine
COPY --from=builder /build/public /usr/share/nginx/html
EXPOSE 80
