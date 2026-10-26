FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
