# ADR-0007 — Một chủ, nhiều lối vào

- Trạng thái: **Đã chốt** · Ngày: 2026-09-30 · Người chốt: Nguyễn Mạnh Toàn
- Diễn giải cho đội: `docs/tu-duy-xay-dung.md` mục 2–3

## Bối cảnh

Khi đưa PMS vào cây bốn cấp, có hai cách đặt báo cáo:

1. Mỗi nghiệp vụ một module riêng ở Điều hành ("Báo cáo dự án", "KPI dự án", "Cảnh báo dự án"…).
2. Cùng một báo cáo xuất hiện ở hai nơi: trong module nghiệp vụ, và ở trung tâm báo cáo của Điều
   hành. Đây là cách SAP làm: SAP GUI treo cùng một báo cáo ở nhánh nghiệp vụ và ở nhánh
   _Information Systems_; SAP Fiori tách _catalog_ (khai báo một lần) khỏi _space/page_ (xếp ra
   nhiều nơi theo vai trò).

Với cách 1, mười nghiệp vụ sẽ đẻ ra khoảng 30 module ở Điều hành, và cùng một con số có thể bị
tính hai lần theo hai cách.

## Quyết định

1. **Mỗi báo cáo, chỉ số, cảnh báo, việc cần làm, tham số, điểm cần duyệt có đúng một chủ.** Chủ
   là module sở hữu dữ liệu. Quyền xem là quyền của chủ.
2. **Một màn, một đường dẫn, một con số.** Các lối vào mở cùng một màn; không sao chép màn, không
   viết lại truy vấn.
3. **Điều hành, Giám sát & Lưu vết và Tầng 2 đặt tên theo góc nhìn chung**, không bao giờ theo
   tên một nghiệp vụ. Nội dung riêng của từng nghiệp vụ tự chảy vào và được lọc trong màn.
4. **Trong module nghiệp vụ, báo cáo có một lối vào**: cấp 4 "Báo cáo \<đối tượng\>".
5. **Quy tắc ở Tầng 2, việc đang diễn ra ở Tầng 1** (luồng duyệt ↔ việc chờ duyệt; quy tắc cảnh
   báo ↔ cảnh báo đang mở; nhật ký hệ thống ↔ nhật ký thao tác). Tham số của một module hiện ở
   Tầng 2 › Khai báo module hoặc Quy tắc cảnh báo; không có module "Cấu hình \<nghiệp vụ\>".

## Hệ quả

- Registry sẽ có phần `dongGop` cho mỗi module (báo cáo, chỉ số, cảnh báo, việc, tham số, điểm
  duyệt). Các module xuyên suốt đọc phần này; thêm nghiệp vụ không phải sửa Điều hành, Giám sát
  hay Tầng 2. Làm cùng module Dự án (Mốc 3), kèm test chặn "báo cáo không có chủ" và "module mang
  tên nghiệp vụ ở nhóm xuyên suốt".
- Cấp 4 của Điều hành đổi sang góc nhìn chung. Tầng 2 đổi theo review ngày 30/09/2026 (xem
  `docs/tu-duy-xay-dung.md` mục 6). Đã áp vào registry ngày 30/09/2026.

## Phương án đã loại

- **Mỗi nghiệp vụ một module ở Điều hành:** phình theo số nghiệp vụ, cùng số liệu tính ở nhiều nơi.
- **Chỉ một nơi, trong module nghiệp vụ:** lãnh đạo phải đi qua từng module để tìm báo cáo; mất
  chỗ xem tổng hợp.
- **Chỉ một nơi, ở trung tâm báo cáo:** người làm nghiệp vụ phải rời việc đang làm để tìm báo cáo
  của chính đối tượng mình đang xử lý.
