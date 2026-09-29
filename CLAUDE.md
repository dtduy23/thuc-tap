# CLAUDE.md

Hướng dẫn bắt buộc cho AI (và người) làm việc trong repo GDOS.

## 1. Đây là gì

**GDOS** — nền tảng quản trị điều hành số, bản chính thức, làm trước cho **khối chính phủ**.
Gộp từ hai repo cũ: `foxai-gdos` (portal React + nối FOXAI Native) và `fox/pms` (quản lý dự án,
Postgres). Hai repo cũ **không** phát triển tiếp cho bản chính thức.

## 2. Đọc trước khi làm bất cứ việc gì

1. `docs/tien-do.md` — đang ở mốc nào, việc gì dở, câu hỏi nào còn mở.
2. `docs/adr/` — quyết định đã chốt. **Không làm ngược một ADR**; thấy ADR sai thì dừng và hỏi.
3. `docs/khung-mau.html` — bản mẫu giao diện (đặc tả, không phải mã để copy).

## 3. Lệnh

```bash
pnpm install
pnpm dev          # shared (watch) + api :4100 + web :5174
pnpm kiem-tra     # lint · dữ liệu thật · định dạng · kiểu · test · build — PHẢI xanh trước khi báo xong
docker compose up -d   # Postgres :5433 + MinIO :9100 (cần .env, xem .env.example)
```

## 4. Cấu trúc

```text
apps/api/        NestJS + Drizzle + Postgres   — mọi route dưới /api
apps/web/        React + Vite + Tailwind       — gọi đường dẫn TƯƠNG ĐỐI /api
packages/shared/ Khung cây phân hệ 4 cấp + hàm lọc quyền — dùng chung cho api và web
docs/            ADR, tiến độ, bản mẫu HTML
scripts/         kiểm tra chạy trong CI
```

## 5. Luật cứng

**Cây phân hệ** (ADR-0002)

- Bốn cấp: Tầng › Nhóm › Module › Chức năng. Tầng và Nhóm là danh sách ĐÓNG trong
  `packages/shared/src/phan-he.ts`. Không thêm tầng/nhóm nếu chưa có ADR.
- Cấp 4 là **đường vào của cùng đối tượng** (bộ lọc · chặng hành trình · thao tác). Là đối tượng
  mới thì lên cấp 3.
- Thẻ bên trong một hồ sơ **không phải cấp 5** — đó là trục phạm vi, không lên sidebar.
- Không bao giờ có nhóm "Khác / Mở rộng / Tiện ích / AI".

**Dữ liệu** (ADR-0004)

- Mọi bảng nghiệp vụ: có `organization_id`, bật **RLS**, có `deleted_at` (xóa mềm), mọi thay
  đổi ghi nhật ký thao tác. Không có ngoại lệ "tạm thời".
- Tài khoản là của GDOS (ADR-0003). `native_user_id` chỉ là tham chiếu, được phép rỗng.
- Tệp đính kèm nằm ở MinIO; Postgres chỉ giữ đường dẫn.

**Bảo mật** (ADR-0003, ADR-0005)

- Không có mật khẩu, khóa, token nào trong mã — kể cả "giá trị dự phòng". Thiếu cấu hình bắt
  buộc thì **dừng**, không đoán.
- **Không dùng dữ liệu cá nhân thật** — kể cả làm dữ liệu mẫu. `scripts/kiem-du-lieu-that.mjs`
  chặn trong CI. Không copy `mocks/` của foxai-gdos (có email/SĐT cán bộ thật).
- HTML thô chỉ vào DOM qua DOMPurify. ESLint chặn `dangerouslySetInnerHTML` và gán `innerHTML`.
- Trình duyệt không bao giờ gọi thẳng hệ thống bên thứ ba — mọi cuộc gọi ra ngoài đi qua API.

**Chất lượng**

- Test quyền và RLS là **bắt buộc** cho mọi module có dữ liệu. Không tắt, không `skip`, không
  nới test để cho xanh. Lỗi nguy hiểm nhất là "chạy được nhưng sai quyền".
- Không dùng `any`. Không bỏ qua lỗi ESLint bằng comment nếu chưa ghi lý do ngay cạnh.
- Comment viết tiếng Việt, giải thích **vì sao**, không mô tả lại code.
- Toàn bộ chữ hiển thị là tiếng Việt. Mã định danh (id, slug) không dấu, gạch nối.

## 6. Một phiên làm việc

1. Đọc `docs/tien-do.md`, chọn **một** việc, viết tiêu chí xong trước khi code.
2. Làm. Chạy `pnpm kiem-tra`.
3. Cập nhật `docs/tien-do.md`: xong gì, dở gì, phát hiện gì.
4. Commit trên nhánh riêng, message tiếng Việt nói **vì sao**.

## 7. Không được tự ý

- `git push`, trộn nhánh, sửa lịch sử git — chỉ khi người dùng bảo.
- Thêm Tầng/Nhóm, đổi thư viện chính, nâng bản chính (major) của TypeScript/NestJS/React/Vite.
- Chốt nghiệp vụ thay người dùng: danh sách vai, luồng duyệt, cách tính hạn. Không rõ → hỏi.
- Kết nối vào Postgres nào khác ngoài Postgres của GDOS (cổng 5433). Máy dev có thể có
  Postgres của dự án khác ở 5432 với **dữ liệu thật**.
