FROM node:22.22.0-alpine@sha256:a9cd9bac76cf2396abf14ff0d1c3671a8175fe577ce350e62ab0fc1678050176 AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.22.0-alpine@sha256:a9cd9bac76cf2396abf14ff0d1c3671a8175fe577ce350e62ab0fc1678050176

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
