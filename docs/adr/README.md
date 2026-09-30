# Quyết định kiến trúc (ADR)

Mỗi quyết định khó đảo ngược được ghi thành một file. Ghi **vì sao** và **đã loại phương án
nào** — để sáu tháng sau không ai phải đoán, và AI không lặng lẽ làm ngược.

| Số                                     | Quyết định                                                             | Trạng thái |
| -------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| [0001](0001-gdos-mot-repo.md)          | GDOS là bản chính thức, một repo, khối chính phủ trước                 | Đã chốt    |
| [0002](0002-cay-phan-he-bon-cap.md)    | Cây phân hệ bốn cấp và luật đặt chỗ                                    | Đã chốt    |
| [0003](0003-tai-khoan-doc-lap.md)      | Tài khoản độc lập, `native_user_id` là tham chiếu                      | Đã chốt    |
| [0004](0004-postgres-rls-nhat-ky.md)   | Postgres, RLS theo đơn vị, nhật ký thao tác, xóa mềm                   | Đã chốt    |
| [0005](0005-stack-va-phien-ban.md)     | Stack và phiên bản                                                     | Đã chốt    |
| [0006](0006-vai-tro-khoi-chinh-phu.md) | Vai trò khối chính phủ: Lãnh đạo, Chuyên viên, Thanh tra + cờ quản trị | Đã chốt    |
| [0007](0007-mot-chu-nhieu-loi-vao.md)  | Một chủ, nhiều lối vào — báo cáo, chỉ số, cảnh báo khai một lần        | Đã chốt    |
| [0008](0008-mo-hinh-du-an.md)          | Mô hình dữ liệu Dự án: chủ đầu tư là đơn vị, nhà thầu là thành viên    | Đã chốt    |
| [0009](0009-noi-foxai-native.md)       | Nối FOXAI Native qua máy chủ GDOS; hồ sơ ở GDOS, Native chỉ xử lý      | Đề xuất    |

## Viết ADR mới

Sao file gần nhất, đánh số tiếp. Bốn mục bắt buộc: **Bối cảnh · Quyết định · Hệ quả ·
Phương án đã loại**. Đổi ý thì viết ADR mới ghi "Thay cho ADR-xxxx", không sửa ADR cũ.
