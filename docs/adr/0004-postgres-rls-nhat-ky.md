# ADR-0004 — Postgres, RLS theo đơn vị, nhật ký thao tác, xóa mềm

- Trạng thái: **Đã chốt** · Ngày: 2026-09-29 · Người chốt: Nguyễn Mạnh Toàn
- Tham khảo: FOXAI Platform `docs/06`, `docs/13`, `docs/adr/ADR-0003`
- Hiện thực: `apps/api/drizzle/0002_bao-mat.sql` · `apps/api/src/db/pham-vi.ts` · test
  `apps/api/src/db/bao-mat.test.ts`
- **Sửa 30/09/2026, trước khi trộn vào `main`:** bỏ `FORCE ROW LEVEL SECURITY` (xem mục 3);
  đổi tên biến ngữ cảnh sang tiếng Việt; nhật ký do trigger ghi thay vì code.

## Bối cảnh

GDOS phục vụ nhiều đơn vị trên một cài đặt. Lỗi rò dữ liệu giữa đơn vị là lỗi im lặng: không
văng exception, màn hình vẫn đẹp. Đã có tiền lệ thật — Document Service của Native đọc nhầm
claim `organizationId` (số ít) thay vì `organizationIds` (số nhiều), mọi người dùng ra `null`,
dữ liệu không được phân tách theo tổ chức.

## Quyết định

1. **Postgres 16**, một database cho GDOS.
2. **Mọi bảng nghiệp vụ có `don_vi_id` và bật Row Level Security.** Mỗi request chạy trong một
   transaction có `SET LOCAL ROLE gdos_app` và hai biến `app.don_vi_ids`, `app.tai_khoan_id`;
   policy đọc hai biến đó. Quên `WHERE don_vi_id = …` thì RLS vẫn chặn. **Chưa đặt ngữ cảnh thì
   không thấy dòng nào** — mặc định an toàn. Lối vào duy nhất: `trongPhamVi()`.
3. **App luôn chạy dưới role `gdos_app`, không sở hữu bảng**, nên RLS luôn có hiệu lực với nó.
   **Không dùng `FORCE`**: chủ bảng phải vượt được RLS cho migration và cho hai hàm
   `SECURITY DEFINER` của đăng nhập — lúc đăng nhập chưa biết đơn vị, `FORCE` làm đăng nhập
   không tìm thấy ai. Hai hàm đó là lối vượt RLS duy nhất và chỉ làm đúng một việc.
4. **Nhật ký thao tác** (`nhat_ky_thao_tac`): ai, lúc nào, bảng nào, bản ghi nào, giá trị cũ →
   mới — **do trigger ghi** trong cùng transaction, không do code gọi (code quên được, trigger
   không quên). `gdos_app` chỉ được đọc; không ai sửa/xóa được, kể cả chủ bảng. Đây là bằng
   chứng pháp lý (NĐ 30/2020, TCVN 11930:2017), khác nhật ký hệ thống.
5. **Xóa mềm** (`deleted_at`). Hồ sơ hành chính có thời hạn lưu trữ bắt buộc. **`gdos_app` không
   có quyền `DELETE`** — xóa mềm là cách xóa duy nhất, chặn bằng database.
6. **Tệp đính kèm ở MinIO**, Postgres chỉ giữ đường dẫn và metadata.
7. **Tìm kiếm tiếng Việt:** `unaccent` + cấu hình `simple`, index `tsvector` ngay khi tạo bảng.

## Hệ quả

- Mốc 1: test tự động _ba tài khoản ở ba đơn vị thấy ba tập dữ liệu khác nhau_ — chạy trong CI,
  không được tắt. Kèm test riêng cho việc đọc đúng danh sách đơn vị của người dùng.
- Mỗi migration tạo bảng nghiệp vụ phải có: cột `don_vi_id`, `deleted_at`,
  `ENABLE ROW LEVEL SECURITY`, policy, trigger `ghi_nhat_ky` và `dat_updated_at`, `GRANT` cho
  `gdos_app` **không có `DELETE`**. Thiếu là không trộn.
- Cột bí mật (như `mat_khau_bam`) không cấp `SELECT` cho `gdos_app` — endpoint lỡ `select *` sẽ
  lỗi ngay thay vì lặng lẽ trả bí mật ra ngoài.
- Test database chạy trên **PGlite** (Postgres thật dạng WebAssembly) — không cần Docker ở máy
  dev hay CI. PGlite là Postgres 18, production là 16: cần thêm một job CI chạy trên Postgres 16
  thật ở Mốc 2.

## Phương án đã loại

- **Lọc theo đơn vị ở tầng ứng dụng:** chỉ một chỗ quên `WHERE` là rò. GDOS cũ và PMS đều có lỗi
  "nhật ký / đôn đốc không lọc phạm vi".
- **Mỗi đơn vị một schema:** hàng trăm xã = hàng trăm schema phải migrate.
- **Lưu tệp trong Postgres (`bytea`):** phình backup, chậm, không phục vụ tải trực tiếp được.
