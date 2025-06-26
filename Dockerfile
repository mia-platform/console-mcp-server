FROM node:22.17.0-alpine@sha256:5340cbfc2df14331ab021555fdd9f83f072ce811488e705b0e736b11adeec4bb AS builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts
RUN rm -fr src tsconfig.* package-lock.json

FROM node:22.17.0-alpine@sha256:5340cbfc2df14331ab021555fdd9f83f072ce811488e705b0e736b11adeec4bb

WORKDIR /app

RUN apk add --no-cache tini

# Tini is now available at /sbin/tini
ENTRYPOINT ["/sbin/tini", "--", "docker-entrypoint.sh"]

COPY --from=builder /app .

ENV NODE_ENV=production

CMD ["mcp-server", "start"]

USER 1000
