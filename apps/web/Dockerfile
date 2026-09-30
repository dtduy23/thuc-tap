# ============================================================================
# Image web — bối cảnh build là GỐC REPO (cần packages/shared).
#
#   docker build -f apps/web/Dockerfile -t gdos-web .
#
# Kết quả là nginx + bản build tĩnh. KHÔNG nhúng địa chỉ API vào bundle: web
# luôn gọi đường dẫn tương đối /api, nginx chuyển tiếp (xem nginx.conf).
# ============================================================================
FROM node:24 AS dung

ENV CI=true
WORKDIR /gdos
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @gdos/web...

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @gdos/shared build && pnpm --filter @gdos/web build

FROM nginx:1.27-alpine AS chay

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=dung /gdos/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1
