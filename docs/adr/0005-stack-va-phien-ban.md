# ADR-0005 — Stack và phiên bản

- Trạng thái: **Đã chốt** · Ngày: 2026-09-30 · Người chốt: Nguyễn Mạnh Toàn

## Quyết định

| Lớp      | Chọn                       | Phiên bản  | Vì sao                                                                                                                         |
| -------- | -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Ngôn ngữ | TypeScript toàn bộ         | **6.0**    | Xem "Không dùng bản mới nhất"                                                                                                  |
| Runtime  | Node                       | **24** LTS |                                                                                                                                |
| Gói      | pnpm workspaces            | **11**     |                                                                                                                                |
| API      | **NestJS**                 | 12         | Khuôn chặt (module, DI, guard) giúp mã AI viết đồng đều giữa các phiên; khớp tài liệu FOXAI Platform                           |
| ORM      | **Drizzle**                | 0.45       | Gần SQL; RLS cần `SET LOCAL` trong transaction — Drizzle làm tự nhiên, Prisma phải dùng interactive transaction giữ connection |
| DB       | Postgres                   | 16         |                                                                                                                                |
| Tệp      | MinIO                      |            | Tương thích S3                                                                                                                 |
| Web      | React + Vite               | 19 · **8** | Giữ stack GDOS cũ để mang code sang                                                                                            |
| CSS      | Tailwind                   | 4          | Token khai một chỗ, không viết mã màu trong JSX                                                                                |
| UI       | HeroUI                     | 3          | Cài ở Mốc 1, khi mang khung portal GDOS sang                                                                                   |
| Test     | Vitest                     | 5          | Một bộ chạy cho cả repo; API dùng SWC để có decorator metadata cho NestJS                                                      |
| Lint     | ESLint + typescript-eslint | **10** · 8 | Kiểm tra có thông tin kiểu; `jsx-a11y` cho tiếp cận                                                                            |
| Lọc HTML | DOMPurify                  |            | Thay bộ lọc tự viết của GDOS cũ (có lỗ `<img onerror>`)                                                                        |

### Không dùng bản mới nhất — ghi lại để không ai "nâng cho mới"

- **TypeScript 7 chưa dùng:** `typescript-eslint` 8.x chỉ nhận TypeScript `<6.1`. Nâng khi
  typescript-eslint hỗ trợ.
- **`@types/node` giữ 24**, khớp runtime — bản 26 cho gọi hàm Node 24 không có mà vẫn biên dịch.

### Ngoại lệ đã biết

- `eslint-plugin-jsx-a11y` 6.10 khai peer tới ESLint 9, repo chạy ESLint 10. Đã kiểm: chạy đúng.
  ESLint 9 bị đánh dấu hết hỗ trợ nên không lùi về. Theo dõi bản jsx-a11y hỗ trợ ESLint 10.
- `drizzle-kit` kéo theo `@esbuild-kit/*` đã bị đánh dấu cũ — chỉ là công cụ dev, không vào
  bản chạy.

## Hệ quả

- API đọc cổng từ **`API_PORT`**, không phải `PORT`: công cụ dev và nhiều nền tảng tự đặt `PORT`
  cho cả nhóm tiến trình — API từng lặng lẽ chiếm cổng của web.
- Gói `@gdos/shared` build ra `dist/` trước khi api/web dùng. Không dùng script `prepare` lúc
  cài: trên Windows, đường dẫn có dấu (`D:\FOXAI Tài liệu`) làm vỡ script vòng đời của pnpm.

## Phương án đã loại

- **Express như PMS:** quen tay hơn, nhưng lỏng khuôn — mỗi phiên AI dễ tự chế một kiểu tổ chức.
- **Prisma:** đội đã quen (dự án IOC), nhưng RLS + connection pooling khó hơn Drizzle.
