# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules node_modules
COPY package.json package-lock.json* ./
COPY tsconfig*.json ./
COPY shared shared
COPY backend backend
RUN npm -w shared run build \
 && npm -w backend run prisma:generate \
 && npm -w backend run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache openssl && addgroup -S app && adduser -S app -G app
COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/backend/prisma ./prisma
COPY --from=build /repo/backend/package.json ./package.json
COPY --from=build /repo/shared/dist ./node_modules/shared/dist
COPY --from=build /repo/shared/package.json ./node_modules/shared/package.json
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["sh","-c","npx prisma migrate deploy && node dist/server.js"]
