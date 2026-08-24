FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.23.2-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
