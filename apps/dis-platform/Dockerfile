FROM node:24-bookworm-slim AS build
WORKDIR /app/apps/dis-platform
COPY apps/dis-platform/package.json apps/dis-platform/package-lock.json ./
RUN npm ci --include=dev --ignore-scripts --no-audit --no-fund
WORKDIR /app
COPY . .
WORKDIR /app/apps/dis-platform
# This publishable identifier is intentionally public. Secret identity,
# database, provider and object-store credentials are runtime variables only.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV DIS_HOST_PRODUCTION=1 NEXT_TELEMETRY_DISABLED=1
RUN node scripts/sync-operating-contract.mjs --check && npm run build
RUN ./node_modules/.bin/esbuild scripts/storage-canary.ts --bundle --platform=node --format=esm --packages=external --target=node24 --outfile=build/storage-canary.mjs
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production DIS_HOST_PRODUCTION=1 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/dis-platform
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["sh", "-c", "exec node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port ${PORT:-3000}"]
