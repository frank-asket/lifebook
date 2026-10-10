FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @lifebook/api... --no-frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @lifebook/api prisma:generate && pnpm --filter @lifebook/api build
WORKDIR /repo/apps/api
CMD ["node","dist/main.js"]
