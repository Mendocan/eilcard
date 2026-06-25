# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
RUN addgroup --system --gid 1001 gateway && adduser --system --uid 1001 gateway
COPY packages/pilot-gateway-sinyalle/package.json ./
COPY packages/pilot-gateway-sinyalle/src ./src
USER gateway
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "src/server.mjs"]
