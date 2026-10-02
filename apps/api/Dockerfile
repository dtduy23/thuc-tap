# ============================================================================
# Image API — bối cảnh build là GỐC REPO (cần packages/shared).
#
#   docker build -f apps/api/Dockerfile -t gdos-api .
#
# Hai chặng: chặng `dung` có đủ devDependencies để biên dịch TypeScript, chặng
# chạy chỉ mang mã đã biên dịch + phụ thuộc production. Không có tsc, không có
# drizzle-kit, không có PGlite trong bản chạy (ADR-0004: migration chạy bằng
# CHỦ BẢNG qua lệnh riêng, API không bao giờ tự migrate).
# ============================================================================
FROM node:24 AS dung

ENV CI=true PNPM_HOME=/pnpm
WORKDIR /gdos
RUN corepack enable

# Bản kê khai trước, mã nguồn sau: sửa mã không phải cài lại phụ thuộc.
# Copy CẢ package.json của web: pnpm-workspace.yaml quét apps/* nên thiếu một
# bản kê khai là pnpm coi workspace không khớp lockfile.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @gdos/api...

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @gdos/shared build && pnpm --filter @gdos/api build

# Hạ xuống chỉ còn phụ thuộc chạy thật — bản chạy không mang theo tsc, vitest,
# drizzle-kit, PGlite (PGlite bị cấm ở production, xem cau-hinh.ts).
RUN pnpm install --frozen-lockfile --prod --filter @gdos/api...

FROM node:24-slim AS chay

ARG PHIEN_BAN=dev
ENV NODE_ENV=production \
    API_PORT=4100 \
    APP_VERSION=$PHIEN_BAN \
    KHO_TEP_THU_MUC=/du-lieu/tep

# Thư mục tệp đính kèm là ĐIỂM GẮN Ổ ĐĨA: tạo sẵn và cho user `node` sở hữu,
# không thì container chạy non-root không ghi được tệp nào.
RUN mkdir -p /du-lieu/tep && chown -R node:node /du-lieu

COPY --from=dung --chown=node:node /gdos /gdos
WORKDIR /gdos/apps/api

USER node
EXPOSE 4100

# /api/health không chạm Postgres — Docker không giết container chỉ vì DB chậm
# một nhịp (readiness là /api/health/deps, do người triển khai gọi).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.API_PORT+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "dist/main.js"]
