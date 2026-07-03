FROM node:22-alpine AS base
RUN corepack enable

# ── Install dependencies ──────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/whatsapp/package.json ./packages/whatsapp/
COPY packages/db/package.json       ./packages/db/
COPY apps/api/package.json          ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json ./
RUN pnpm --filter @whatsup/shared   build && \
    pnpm --filter @whatsup/whatsapp build && \
    pnpm --filter @whatsup/db       db:generate && \
    pnpm --filter @whatsup/db       build && \
    pnpm --filter @whatsup/api      build

# ── Runtime ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# node_modules (root + each package — pnpm symlinks preserved)
COPY --from=builder /app/node_modules              ./node_modules
COPY --from=builder /app/packages/shared/node_modules  ./packages/shared/node_modules
COPY --from=builder /app/packages/whatsapp/node_modules ./packages/whatsapp/node_modules
COPY --from=builder /app/packages/db/node_modules  ./packages/db/node_modules
COPY --from=builder /app/apps/api/node_modules     ./apps/api/node_modules

# Built dist outputs
COPY --from=builder /app/packages/shared/dist   ./packages/shared/dist
COPY --from=builder /app/packages/whatsapp/dist ./packages/whatsapp/dist
COPY --from=builder /app/packages/db/dist       ./packages/db/dist
COPY --from=builder /app/apps/api/dist          ./apps/api/dist

# Prisma schema (needed for migrations at startup)
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# package.json files for module resolution
COPY packages/shared/package.json   ./packages/shared/
COPY packages/whatsapp/package.json ./packages/whatsapp/
COPY packages/db/package.json       ./packages/db/
COPY apps/api/package.json          ./apps/api/

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
