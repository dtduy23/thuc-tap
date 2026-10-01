# ADR-0003 — Tài khoản độc lập, `native_user_id` là tham chiếu

- Trạng thái: **Đã chốt** · Ngày: 2026-09-29 · Người chốt: Nguyễn Mạnh Toàn

## Bối cảnh

Ba hệ hiện dùng ba cách định danh: GDOS cũ dựa vào System Service của FOXAI Native (JWT HS256,
không JWKS — hệ hạ nguồn muốn tự verify phải cầm chung secret); PMS tự cấp JWT với bảng tài khoản
riêng; FOXAI Platform thiết kế Keycloak OIDC. GDOS phải **đứng một mình được**: triển khai cho
một xã không có FOXAI Native thì vẫn chạy.

## Quyết định

1. **Bảng tài khoản thuộc Postgres của GDOS.** Mật khẩu băm **argon2id**. Không có tài khoản
   hay mật khẩu mặc định nào trong mã.
2. **`native_user_id`** — tham chiếu tài khoản FOXAI Native, **được phép rỗng**:
   - Rỗng: dùng đủ các module của GDOS, không dùng được tính năng gọi Native (văn bản, tóm tắt,
     hỏi đáp AI).
   - Có giá trị: được gọi Native; quyền phía Native kiểm theo tài khoản được tham chiếu.
3. **Quản trị hệ thống là cờ `is_system_admin`**, độc lập với vai nghiệp vụ — đúng mô hình PMS
   (vai × cờ). Không có "vai Quản trị" giành chỗ của một vai nghiệp vụ.
4. **Phiên đăng nhập trong cookie `HttpOnly; Secure; SameSite=Lax`.** API và web cùng tên miền,
   nên không lưu token trong `localStorage` (GDOS cũ lưu token 7 ngày ở đó — XSS đọc được).
   Access token ngắn hạn + refresh token xoay vòng.
5. **Quản trị viên đầu tiên tạo bằng lệnh CLI** trên server, không qua màn hình, không có mật
   khẩu mặc định.
6. **Quản trị viên không đặt mật khẩu cho người khác.** Tạo tài khoản hoặc đặt lại mật khẩu thì
   hệ thống sinh **mật khẩu tạm**, hiện đúng một lần, và bật cờ `phai_doi_mat_khau`: tới khi người
   dùng tự đổi, API từ chối mọi route cần quyền (chỉ còn xem mình và đổi mật khẩu). Khóa tài khoản
   hay đặt lại mật khẩu thì thu hồi mọi phiên của người đó ngay. _(Bổ sung ở Mốc 1 phiên 4 — chưa
   trộn vào `main` nên thêm thẳng.)_
7. **Chính sách đăng nhập là cấu hình, không phải hằng số trong mã**: ngưỡng khóa tạm, hạn vé,
   hạn phiên, độ dài mật khẩu tối thiểu — quản trị ở đơn vị gốc chỉnh trên màn Cấu hình hệ
   thống. Mã chỉ giữ giá trị mặc định và khoảng cho phép (`@gdos/shared` › `CHINH_SACH`), để
   không ai đặt được giá trị vô lý (vd khóa sau 1 lần sai). _(Bổ sung ở Mốc 1 phiên 5.)_

## Hệ quả

- Mốc 1 xây: bảng tài khoản, đăng nhập/làm mới/đăng xuất, đổi mật khẩu, khóa sau nhiều lần sai,
  CLI tạo quản trị viên, màn liên kết `native_user_id`.
- **Còn mở, phải hỏi đội Native trước Mốc 5:** GDOS gọi Native thay mặt người dùng bằng cách nào
  (tài khoản dịch vụ + `native_user_id`, hay đổi token), và quyền phía Native kiểm theo tài
  khoản nào. Không tự chọn khi chưa có câu trả lời.
- Mất một nguồn đăng nhập duy nhất cho cả họ sản phẩm (SSO). Nếu sau này cần, thêm OIDC làm
  _phương thức đăng nhập bổ sung_, bảng tài khoản vẫn là của GDOS.

## Phương án đã loại

- **Dùng System Service của Native làm nguồn định danh:** GDOS không đứng một mình được; và
  verify token HS256 buộc phải chia sẻ secret — điều đã cấm từ review 15/09/2026.
- **Keycloak ngay từ đầu:** thêm một hệ phải vận hành cho mỗi lần triển khai cấp xã; để sau,
  khi thật sự cần SSO.
