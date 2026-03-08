FROM oven/bun:1.3.3-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install --production

COPY src ./src
RUN mkdir -p /app/data

ENV APP_PORT=3001
EXPOSE 3001

CMD ["bun", "run", "start"]
