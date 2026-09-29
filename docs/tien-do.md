# Tiến độ

Đọc file này **đầu mỗi phiên**. Cập nhật **cuối mỗi phiên**: xong gì, dở gì, phát hiện gì.

## Các mốc

| Mốc   | Nội dung                                                                             | Trạng thái                                                |
| ----- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **0** | Khởi tạo repo, CI, ADR, khung dùng chung                                             | ✅ Đã push `moc-0-khoi-tao` — **chờ kết quả pipeline CI** |
| **1** | Nền móng: tài khoản, đơn vị, vai trò & quyền, RLS, nhật ký, khung portal + cây 4 cấp | 🔄 Phiên 1/4 xong (nền dữ liệu)                           |
| **2** | Đưa lên máy thử (image, nginx, CI/CD)                                                | Chưa bắt đầu                                              |
| **3** | Module Dự án (từ PMS)                                                                | Chưa bắt đầu                                              |
| **4** | Module Khiếu nại đất đai                                                             | Chưa bắt đầu                                              |
| **5** | Nối FOXAI Native (văn bản, tóm tắt, hỏi đáp)                                         | Chưa bắt đầu — **chờ đội Native**                         |
| **6** | Điều hành: dashboard, báo cáo                                                        | Chưa bắt đầu                                              |
| **7** | Thiết lập: bật/tắt module theo đơn vị, cảnh báo, luồng duyệt                         | Chưa bắt đầu                                              |

## Mốc 1 — Nền móng

| Phiên | Việc                                                                                                                        | Trạng thái    |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **1** | Vai trò & tính quyền · lược đồ · RLS · nhật ký · test bảo mật DB                                                            | ✅ 30/09/2026 |
| 2     | Đăng nhập (argon2id của Node, cookie HttpOnly, refresh xoay vòng, khóa khi sai) · CLI tạo quản trị viên · guard quyền ở API | Tiếp theo     |
| 3     | Web: khung portal + cây 4 cấp lọc quyền (mang từ `docs/khung-mau.html` + GDOS cũ) · màn đăng nhập                           |               |
| 4     | Web Tầng 2: Tài khoản · Phân công · Đơn vị · Nhật ký thao tác                                                               |               |

### Phiên 1 — nền dữ liệu (30/09/2026)

**Đã làm**

- ADR-0006: ba vai (Lãnh đạo · Chuyên viên · Thanh tra) + cờ quản trị; quyền = vai × phân công.
- `@gdos/shared`: `HANH_DONG` (7 hành động), mã quyền **ghép** bằng `quyenCua()` thay vì gõ tay;
  `tinhQuyen()`, `kiemTraPhanCong()`. Tầng 2 bắt buộc mã quyền `QT_`, Tầng 1 cấm `QT_`.
- Lược đồ: `don_vi`, `tai_khoan`, `phan_cong`, `phien_dang_nhap`, `nhat_ky_thao_tac`.
- Migration `0002_bao-mat.sql`: role `gdos_app`, RLS theo đơn vị, không cấp `DELETE`, không cấp
  đọc `mat_khau_bam`, nhật ký do trigger ghi và không sửa/xóa được, `updated_at` tự cập nhật,
  hai hàm `SECURITY DEFINER` cho đăng nhập (tìm tài khoản, đếm sai và khóa).
- `trongPhamVi()` / `khongNguCanh()` / `truyVan()` — lối vào database duy nhất.
- Test: shared 34 · API bảo mật DB 19 (chạy trên PGlite — Postgres thật, không cần Docker).

**Phát hiện**

- `FORCE ROW LEVEL SECURITY` làm hàm đăng nhập không tìm thấy ai → bỏ `FORCE`, dựa vào việc app
  luôn chạy dưới `gdos_app`. ADR-0004 đã sửa (chưa trộn vào `main` nên sửa thẳng, có ghi chú).
- Drizzle bọc lỗi Postgres trong `cause` — test kiểm lỗi phải đọc lỗi gốc (`loiGoc()`), không thì
  một câu lệnh hỏng vì lý do khác cũng "đạt".

**Mặc định đang dùng — người dùng xác nhận sau**

- Khóa tài khoản sau **5** lần sai liên tiếp, trong **15** phút (tham số của `dang_nhap_ghi`).

## Mốc 0 — Khởi tạo (30/09/2026)

Monorepo, CI, ADR 0001–0005, `CLAUDE.md`, bản mẫu HTML. `pnpm kiem-tra` xanh; đã đẩy nhánh.

**Còn treo**

- [ ] **Kết quả pipeline CI** của nhánh `moc-0-khoi-tao`. File CI viết cho docker executor; nếu
      runner là shell (tag `foxai-build` như repo cũ) thì phải sửa.
- [ ] **`docker compose up`** trên một máy có Docker.

**Phát hiện** (đã ghi vào ADR-0005): `PORT` chung làm API chiếm cổng web → `API_PORT`; đường dẫn
có dấu làm vỡ script `prepare` của pnpm trên Windows; máy dev có Postgres khác ở 5432 với dữ liệu
thật → GDOS dùng 5433.

## Câu hỏi mở

| Câu hỏi                                                                                       | Hỏi ai                | Chặn       |
| --------------------------------------------------------------------------------------------- | --------------------- | ---------- |
| Kết quả pipeline CI / runner là docker hay shell executor                                     | Người dùng xem GitLab | Trộn Mốc 0 |
| GDOS gọi Native thay mặt người dùng bằng cách nào? Quyền phía Native kiểm theo tài khoản nào? | Đội Native            | Mốc 5      |
| Server + tên miền phụ cho máy thử                                                             | Hạ tầng               | Mốc 2      |
| Ngưỡng khóa tài khoản (đang 5 lần / 15 phút)                                                  | Người dùng            | Không chặn |
