#!/usr/bin/env bash
set -euo pipefail

# Script auto-deploy thủ công từ máy local lên Neon + Render + Vercel.
# Yêu cầu đặt sẵn các biến trong môi trường hoặc file .env.deploy (không commit):
#   DATABASE_URL            (Direct connection string từ Neon)
#   RENDER_DEPLOY_HOOK_URL  (Deploy Hook URL của service gdos-api trên Render)
#   VERCEL_TOKEN            (nếu muốn deploy Vercel không cần login tay)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f ".env.deploy" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.deploy"
  set +a
fi

: "${DATABASE_URL:?Thiếu DATABASE_URL (Neon Direct connection string)}"
: "${RENDER_DEPLOY_HOOK_URL:?Thiếu RENDER_DEPLOY_HOOK_URL}"

echo "==> 1/4 Build @gdos/shared và @gdos/api..."
pnpm --filter @gdos/shared build
pnpm --filter @gdos/api build

echo "==> 2/4 Chạy migration lên Neon..."
DATABASE_URL_CHU_BANG="$DATABASE_URL" DATABASE_URL="$DATABASE_URL" \
  node apps/api/dist/cli/di-tru.js

echo "==> 3/4 Trigger Render deploy API..."
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
echo ""

echo "==> 4/4 Deploy Web lên Vercel..."
if [ -n "${VERCEL_TOKEN:-}" ]; then
  npx --yes vercel@latest deploy --prod --yes --token="$VERCEL_TOKEN"
else
  npx --yes vercel@latest deploy --prod --yes
fi

echo "✓ Hoàn tất! Nhớ chạy 'khoi-tao.js' nếu đây là lần deploy đầu tiên."
