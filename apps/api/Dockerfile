FROM node:22-alpine AS build
RUN apk add --no-cache openssl && corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY patches ./patches
RUN pnpm install --filter @lifebook/api... --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @lifebook/api prisma:generate && pnpm --filter @lifebook/api build
ENV NODE_ENV=production
USER node
WORKDIR /repo/apps/api
CMD ["node","dist/main.js"]
