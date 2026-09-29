# GDOS

Nền tảng quản trị điều hành số — bản chính thức, làm trước cho khối chính phủ.

## Chạy

Cần Node 24+, pnpm 11+. Docker chỉ cần cho Postgres/MinIO.

```bash
pnpm install
cp .env.example .env        # rồi đổi các mật khẩu
docker compose up -d        # Postgres :5433, MinIO :9100
pnpm dev                    # web http://localhost:5174 · api http://localhost:4100/api/health
```

Chưa có Docker vẫn chạy được `pnpm dev` — trang chủ sẽ báo "postgres: chưa cấu hình".

Trước khi đẩy mã: `pnpm kiem-tra` phải xanh.

## Tài liệu

|                                            |                                               |
| ------------------------------------------ | --------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                     | Luật làm việc — cho cả người lẫn AI           |
| [docs/tien-do.md](docs/tien-do.md)         | Đang ở mốc nào, việc gì mở                    |
| [docs/adr/](docs/adr/)                     | Quyết định kiến trúc đã chốt                  |
| [docs/khung-mau.html](docs/khung-mau.html) | Bản mẫu giao diện — mở thẳng bằng trình duyệt |
