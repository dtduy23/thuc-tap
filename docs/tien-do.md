# Tiến độ

Đọc file này **đầu mỗi phiên**. Cập nhật **cuối mỗi phiên**: xong gì, dở gì, phát hiện gì.

## Các mốc

| Mốc   | Nội dung                                                                             | Trạng thái                                  |
| ----- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| **0** | Khởi tạo repo, CI, ADR, khung dùng chung                                             | ✅ Xong tại máy — chờ push + kiểm runner CI |
| **1** | Nền móng: tài khoản, đơn vị, vai trò & quyền, RLS, nhật ký, khung portal + cây 4 cấp | Chưa bắt đầu                                |
| **2** | Đưa lên máy thử (image, nginx, CI/CD)                                                | Chưa bắt đầu                                |
| **3** | Module Dự án (từ PMS)                                                                | Chưa bắt đầu                                |
| **4** | Module Khiếu nại đất đai                                                             | Chưa bắt đầu                                |
| **5** | Nối FOXAI Native (văn bản, tóm tắt, hỏi đáp)                                         | Chưa bắt đầu — **chờ đội Native**           |
| **6** | Điều hành: dashboard, báo cáo                                                        | Chưa bắt đầu                                |
| **7** | Thiết lập: bật/tắt module theo đơn vị, cảnh báo, luồng duyệt                         | Chưa bắt đầu                                |

## Mốc 0 — Khởi tạo (30/09/2026)

**Đã làm**

- Monorepo pnpm: `apps/api` (NestJS + Drizzle), `apps/web` (React + Vite + Tailwind),
  `packages/shared` (khung cây 4 cấp).
- `packages/shared`: danh sách đóng Tầng/Nhóm, `kiemTraCay()`, `locTheoQuyen()` + 14 test.
- API: cấu hình dừng khi thiếu thứ bắt buộc; `/api/health` (sống) và `/api/health/deps`
  (503 kèm tên phụ thuộc hỏng) + 9 test, gồm test dựng module Nest thật.
- Web: trang nền móng gọi API qua proxy, đọc khung từ `@gdos/shared` + 4 test.
- `pnpm kiem-tra`: lint có thông tin kiểu, chặn `dangerouslySetInnerHTML`/`innerHTML`, kiểm
  dữ liệu cá nhân thật, định dạng, kiểu, test, build — **xanh tại máy**.
- `pnpm audit --prod`: không có lỗ hổng.
- `.gitlab-ci.yml`: kiem-tra · gitleaks (toàn bộ lịch sử) · audit.
- `compose.yaml`: Postgres :5433, MinIO :9100 cho máy dev.
- ADR 0001–0005, `CLAUDE.md`, bản mẫu `docs/khung-mau.html`.

**Đã kiểm trên trình duyệt:** web ↔ API chạy đầu cuối; API báo đúng "postgres: chưa cấu hình".

**CHƯA kiểm được — phải làm trước khi coi Mốc 0 là xong hẳn**

- [ ] **Runner CI.** `.gitlab-ci.yml` viết cho docker executor. Repo cũ dùng runner tag
      `foxai-build` (nhiều khả năng là shell executor) — cần xác nhận rồi sửa trước lần push đầu.
- [ ] **`docker compose up`.** Máy làm Mốc 0 không có Docker. Cần chạy thử trên một máy có Docker.
- [ ] **Push nhánh `moc-0-khoi-tao`** lên GitLab — chờ người dùng cho phép.

**Phát hiện khi làm** (đã ghi vào ADR-0005)

- Biến `PORT` chung làm API chiếm nhầm cổng web → đổi sang `API_PORT`.
- Đường dẫn có dấu (`D:\FOXAI Tài liệu`) làm vỡ script `prepare` của pnpm trên Windows → bỏ
  `prepare`, các lệnh gốc tự build `@gdos/shared` trước.
- Máy dev có Postgres khác ở 5432 (nhiều khả năng của PMS, **có dữ liệu thật**) → GDOS dùng 5433,
  không kết nối vào 5432.

## Câu hỏi mở

| Câu hỏi                                                                                       | Hỏi ai          | Chặn mốc      |
| --------------------------------------------------------------------------------------------- | --------------- | ------------- |
| **Danh sách vai cho khối chính phủ** (và mỗi vai thấy/làm gì)                                 | Người dùng chốt | **Mốc 1**     |
| GDOS gọi Native thay mặt người dùng bằng cách nào? Quyền phía Native kiểm theo tài khoản nào? | Đội Native      | Mốc 5         |
| Runner CI là docker hay shell executor?                                                       | Quản trị GitLab | Push đầu tiên |
| Server + tên miền phụ cho máy thử                                                             | Hạ tầng         | Mốc 2         |
