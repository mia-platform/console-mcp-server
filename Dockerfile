FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build
RUN rm -fr src tsconfig.json

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts

FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["node", "build/index.js"]

USER 1000
