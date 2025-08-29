FROM node:22.19.0-alpine@sha256:67bb653363ee5f3aa8b132cb3f800f202bb5fb244f7cf0669225737ee84d30cd AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.19.0-alpine@sha256:67bb653363ee5f3aa8b132cb3f800f202bb5fb244f7cf0669225737ee84d30cd

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
