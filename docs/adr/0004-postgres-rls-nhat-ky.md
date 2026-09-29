# ADR-0004 — Postgres, RLS theo đơn vị, nhật ký thao tác, xóa mềm

- Trạng thái: **Đã chốt** · Ngày: 2026-09-29 · Người chốt: Nguyễn Mạnh Toàn
- Tham khảo: FOXAI Platform `docs/06`, `docs/13`, `docs/adr/ADR-0003`

## Bối cảnh

GDOS phục vụ nhiều đơn vị trên một cài đặt. Lỗi rò dữ liệu giữa đơn vị là lỗi im lặng: không
văng exception, màn hình vẫn đẹp. Đã có tiền lệ thật — Document Service của Native đọc nhầm
claim `organizationId` (số ít) thay vì `organizationIds` (số nhiều), mọi người dùng ra `null`,
dữ liệu không được phân tách theo tổ chức.

## Quyết định

1. **Postgres 16**, một database cho GDOS.
2. **Mọi bảng nghiệp vụ có `organization_id` và bật Row Level Security.** Mỗi request chạy trong
   một transaction có `SET LOCAL app.user_id` và `SET LOCAL app.org_ids`; policy đọc hai biến đó.
   Lập trình viên quên `WHERE organization_id = …` thì RLS vẫn chặn.
3. **App kết nối bằng role KHÔNG sở hữu bảng**, để RLS luôn có hiệu lực (chủ bảng bỏ qua RLS trừ
   khi `FORCE ROW LEVEL SECURITY`).
4. **Nhật ký thao tác** (`audit_log`): ai, lúc nào, bảng nào, bản ghi nào, giá trị cũ → mới —
   ghi trong **cùng transaction** với thay đổi. Đây là bằng chứng pháp lý (NĐ 30/2020, TCVN
   11930:2017), khác nhật ký hệ thống.
5. **Xóa mềm** (`deleted_at`). Hồ sơ hành chính có thời hạn lưu trữ bắt buộc; `DELETE` thật là
   sai nghiệp vụ.
6. **Tệp đính kèm ở MinIO**, Postgres chỉ giữ đường dẫn và metadata.
7. **Tìm kiếm tiếng Việt:** `unaccent` + cấu hình `simple`, index `tsvector` ngay khi tạo bảng.

## Hệ quả

- Mốc 1: test tự động _ba tài khoản ở ba đơn vị thấy ba tập dữ liệu khác nhau_ — chạy trong CI,
  không được tắt. Kèm test riêng cho việc đọc đúng danh sách đơn vị của người dùng.
- Mỗi migration tạo bảng nghiệp vụ phải có: cột `organization_id`, `deleted_at`, `ENABLE` +
  `FORCE ROW LEVEL SECURITY`, policy. Thiếu là không trộn.
- Drizzle dùng được RLS qua transaction có `SET LOCAL` (xem ADR-0005).

## Phương án đã loại

- **Lọc theo đơn vị ở tầng ứng dụng:** chỉ một chỗ quên `WHERE` là rò. GDOS cũ và PMS đều có lỗi
  "nhật ký / đôn đốc không lọc phạm vi".
- **Mỗi đơn vị một schema:** hàng trăm xã = hàng trăm schema phải migrate.
- **Lưu tệp trong Postgres (`bytea`):** phình backup, chậm, không phục vụ tải trực tiếp được.
