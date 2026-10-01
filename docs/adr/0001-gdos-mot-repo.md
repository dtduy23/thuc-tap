# ADR-0001 — GDOS là bản chính thức, một repo, khối chính phủ trước

- Trạng thái: **Đã chốt** · Ngày: 2026-09-29 · Người chốt: Nguyễn Mạnh Toàn

## Bối cảnh

Đến tháng 9/2026 FOXAI có ba nền song song cho cùng một nhóm nhu cầu:

- `dangnm/foxai-gdos` — portal React, 41 module, gọi FOXAI Native; không có lint/test; CI/CD chỉ
  ở nhánh `develop`.
- `fox/pms` — quản lý dự án KHCN Lào Cai, Express + Postgres 16, **đang chạy với dữ liệu thật**;
  frontend một file HTML ~488 KB.
- `fox/foxai-platform` — nền tảng lõi metadata-driven, đang ở P0 (mới có tài liệu), lộ trình
  14–16 tháng.

Nuôi song song nhiều nền thì mỗi sửa lỗi phải làm nhiều lần, và nhân viên không biết code mới
đặt ở đâu.

## Quyết định

1. Phần mềm chính thức tên **GDOS**, repo `fox/gdos-foxai-data`.
2. Làm trước cho **khối chính phủ**.
3. **Gộp vào một repo.** Mã từ hai repo cũ được _mang sang có chọn lọc_, không copy nguyên khối:

   | Nguồn          | Mang sang                                                                  | Không mang                                                                                            |
   | -------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
   | foxai-gdos     | khung web, registry, lớp gọi API, lớp gọi Native, mẫu CI/CD `develop`      | `mocks/` (có dữ liệu cá nhân thật), bộ lọc HTML tự viết, `xlsx@0.18.5`, khóa nhúng trong `index.html` |
   | pms            | timeline engine, KPI, SLA NĐ 45, nhập Excel, mô hình vai × cờ quản trị     | frontend một file, mật khẩu mặc định trong frontend, `JWT_SECRET` dự phòng, **database đang chạy**    |
   | foxai-platform | tài liệu 06 (phân quyền/audit), 13 (Postgres), ADR-0003 (RLS) làm thiết kế | metadata engine, YAML, CLI                                                                            |

4. Hai repo cũ tiếp tục chạy cho khách hiện tại cho tới khi GDOS thay thế được.

## Hệ quả

- Mọi việc cho bản chính thức làm ở repo này.
- PMS chuyển sang GDOS bằng cách _xuất dữ liệu chỉ đọc → nhập_, khi module Dự án đủ tính năng.
  Không bao giờ trỏ GDOS vào database đang chạy của PMS.
- FOXAI Platform vẫn là hướng dài hạn; GDOS không xây metadata engine. Registry nằm trong mã,
  cộng một bảng cấu hình để bật/tắt, đổi nhãn theo đơn vị.

## Phương án đã loại

- **Phát triển tiếp trên foxai-gdos:** repo có dữ liệu cá nhân thật trong lịch sử git, không có
  lint/test, và nhiều người đang đẩy thẳng vào `main`.
- **Xây ngay trên FOXAI Platform:** metadata engine phải xong P0–P2 (~18 tuần theo lộ trình của
  chính nó) trước khi có module nghiệp vụ đầu tiên. Khối chính phủ cần sớm hơn.
