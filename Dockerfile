FROM node:22.21.0-alpine@sha256:b410676781397cabae22f81547ddb3e6b975dc04b43626098ce17ea53a447ef1 AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.21.0-alpine@sha256:b410676781397cabae22f81547ddb3e6b975dc04b43626098ce17ea53a447ef1

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
