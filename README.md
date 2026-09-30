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

## Tài liệu

|                                            |                                               |
| ------------------------------------------ | --------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                     | Luật làm việc — cho cả người lẫn AI           |
| [docs/tien-do.md](docs/tien-do.md)         | Đang ở mốc nào, việc gì mở                    |
| [docs/adr/](docs/adr/)                     | Quyết định kiến trúc đã chốt                  |
| [docs/khung-mau.html](docs/khung-mau.html) | Bản mẫu giao diện — mở thẳng bằng trình duyệt |
