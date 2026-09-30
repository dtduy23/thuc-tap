# GDOS

Nền tảng quản trị điều hành số — bản chính thức, làm trước cho khối chính phủ.

## Chạy ở máy dev

Cần Node 24+, pnpm 11+.

```bash
pnpm install
cp .env.example .env
```

**Có Docker** — Postgres thật:

```bash
docker compose up -d        # Postgres :5433, MinIO :9100 (đổi mật khẩu trong .env trước)
```

**Không có Docker** — trong `.env` bỏ dòng `DATABASE_URL`, bật `DB_NHUNG=1`. API dùng database
nhúng (PGlite) ghi ra `.data/pglite`, cùng migration và RLS như Postgres thật.

Tạo quản trị viên đầu tiên (một lần), rồi chạy:

```bash
pnpm --filter @gdos/api build
pnpm --filter @gdos/api khoi-tao --don-vi-ma XA-01 --don-vi-ten "Xã Thử" --cap xa --toan-quyen
pnpm dev                    # web http://localhost:5174 · api http://localhost:4100/api/health
```

`--toan-quyen` chỉ dùng lúc xây dựng (quản trị viên thấy và làm được mọi thứ). Triển khai thật thì
bỏ — cán bộ CNTT chỉ cần cờ quản trị (ADR-0006).

Trước khi đẩy mã: `pnpm kiem-tra` phải xanh.

## Triển khai (Mốc 2)

Máy thử phục vụ ở **https://gdosfox.fox.ai.vn**. CI/CD chạy ở nhánh **`develop`** và chỉ ở đó
(`.gitlab-ci.yml`):

| Chặng    | Làm gì                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| `build`  | dựng image `api` + `web`, đẩy lên registry GitLab, thẻ = SHA ngắn            |
| `deploy` | **bấm tay** — SSH sang máy thử: pull, chạy migration, `up -d`, kiểm sức khỏe |

CI **không chạy kiểm tra gì** (người dùng chốt 30/09/2026): không lint, không test, không quét bí
mật. `pnpm kiem-tra` ở máy là cửa duy nhất — phải xanh trước khi đẩy.

Dựng image tại máy (bối cảnh build là **gốc repo**, vì image cần `packages/shared`):

```bash
docker build -f apps/api/Dockerfile -t gdos-api .
docker build -f apps/web/Dockerfile -t gdos-web .
```

Trên máy thử chỉ cần `compose.trien-khai.yaml` (CI tự chép sang) và một file `.env` do kỹ thuật
đặt một lần — danh sách biến ghi ở đầu `compose.trien-khai.yaml`. Bí mật **không** đi qua CI.

TLS và tên miền do nginx **của máy chủ** lo, container web chỉ nghe `127.0.0.1:8080`. Mẫu vhost:
[nginx.may-thu.conf](nginx.may-thu.conf) — còn phải điền đường dẫn chứng thư.

Lệnh `di-tru` chỉ chạy migration; `khoi-tao` (tạo đơn vị gốc + quản trị viên đầu tiên) vẫn là việc
làm tay đúng một lần, vì có nhập mật khẩu.

## Tài liệu

|                                                    |                                                 |
| -------------------------------------------------- | ----------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                             | Luật làm việc — cho cả người lẫn AI             |
| [docs/tu-duy-xay-dung.md](docs/tu-duy-xay-dung.md) | Tư duy xây hệ thống — đọc trước khi thêm module |
| [docs/tien-do.md](docs/tien-do.md)                 | Đang ở mốc nào, việc gì mở                      |
| [docs/adr/](docs/adr/)                             | Quyết định kiến trúc đã chốt                    |
| [docs/khung-mau.html](docs/khung-mau.html)         | Bản mẫu giao diện — mở thẳng bằng trình duyệt   |
