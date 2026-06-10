# final image base: scratch by default, set to alpine for debugging
ARG APP_STAGE_IMAGE=scratch

# 0. frontend build stage
FROM node:24-alpine AS web-build
WORKDIR /app
RUN npm install -g pnpm@11.5.3
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 1. server build stage — static musl binary
# pinned like the other mows services; floating tags break reproducibility
FROM clux/muslrust:1.92.0-stable AS server-build
RUN apt-get update && apt-get install -y --no-install-recommends upx-ucl && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY server/ ./
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/root/.cargo/git \
    --mount=type=cache,target=/build/target \
    cargo build --release --locked \
    && cp target/x86_64-unknown-linux-musl/release/impedanz-server /impedanz-server
RUN upx --best --lzma /impedanz-server

# 2. execution stage
FROM ${APP_STAGE_IMAGE}
COPY --from=server-build /impedanz-server /impedanz-server
COPY server/config.yaml /config.yaml
COPY --from=web-build /app/dist/ /public/
EXPOSE 80
ENTRYPOINT ["/impedanz-server"]
