FROM oven/bun:1.3.3-alpine

WORKDIR /app

ARG VITE_SERVER_URL=http://server:3001
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

COPY package.json tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["bunx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
