# ADR-0006 — Vai trò khối chính phủ

- Trạng thái: **Đã chốt** · Ngày: 2026-09-30 · Người chốt: Nguyễn Mạnh Toàn
- Mã: `packages/shared/src/vai-tro.ts`

## Bối cảnh

Mốc 1 cần một danh sách vai để dựng ma trận quyền, dữ liệu mẫu và test phân quyền. Người dùng
chốt điểm xuất phát: một admin thấy hết; Chủ tịch xã thấy hết nhưng không nhập liệu; chuyên viên
thấy phân hệ được phân công — và mở rộng luôn cho các vai sẽ cần.

## Quyết định

**Quyền = vai quyết định LÀM ĐƯỢC HÀNH ĐỘNG GÌ × phân công quyết định LÀM Ở PHÂN HỆ NÀO.**

Mã quyền dạng `MÃ_PHÂN_HỆ.HÀNH_ĐỘNG`. Bảy hành động:
`READ` đọc · `CREATE` tạo · `UPDATE` sửa · `DELETE` xóa mềm · `EXPORT` xuất · `APPROVE` duyệt ·
`ASSIGN` giao việc.

### Ba vai + một cờ

|                                             | Hành động                                              | Phạm vi phân hệ            | Giám sát & Lưu vết |
| ------------------------------------------- | ------------------------------------------------------ | -------------------------- | ------------------ |
| **Cờ Quản trị hệ thống** — _không phải vai_ | mọi hành động ở **Tầng 2**                             | —                          | —                  |
| **Lãnh đạo**                                | READ · EXPORT · APPROVE · ASSIGN — **không nhập liệu** | tất cả, hoặc một danh sách | **thấy**           |
| **Chuyên viên**                             | READ · CREATE · UPDATE · DELETE · EXPORT               | danh sách được phân công   | **không thấy**     |
| **Thanh tra**                               | READ · EXPORT — chỉ đọc                                | tất cả                     | **thấy**           |

Luật chung:

- **Danh mục**: mọi vai nghiệp vụ đều được **đọc** (cần để chọn giá trị khi nhập); sửa danh mục
  thì phải được phân công phân hệ danh mục đó.
- **Chuyên viên không bao giờ thấy Giám sát & Lưu vết**, kể cả khi phạm vi là "tất cả" — người
  bị kiểm tra không xem nhật ký kiểm tra.
- **Phân công gán ở cấp 3** (module); cấp 4 đi theo cha, trừ chức năng khai hành động riêng.
- Một tài khoản có **nhiều phân công**; quyền hiệu lực là **hợp** các phân công.
- Phạm vi _dữ liệu_ luôn là đơn vị của tài khoản — RLS chặn ở database (ADR-0004), không phụ
  thuộc vai.

### Người thật → cấu hình

| Người                  | Cấu hình                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| Chủ tịch xã            | Lãnh đạo · tất cả                                                        |
| Phó chủ tịch xã        | Lãnh đạo · các phân hệ thuộc lĩnh vực phụ trách                          |
| Chuyên viên địa chính  | Chuyên viên · Khiếu nại đất đai, Dự án…                                  |
| Văn thư                | Chuyên viên · Xử lý văn bản                                              |
| Tiếp dân / Một cửa     | Chuyên viên · Khiếu nại đất đai + tiếp nhận hồ sơ                        |
| Thanh tra, kiểm tra    | Thanh tra · tất cả                                                       |
| Cán bộ CNTT            | chỉ **cờ Quản trị** — không tự động đọc hồ sơ của dân (NĐ 13/2023)       |
| **Admin lúc xây dựng** | cờ Quản trị + Lãnh đạo · tất cả + Chuyên viên · tất cả → thấy và làm hết |

Văn thư, Tiếp dân **không phải vai riêng** — là mẫu phân công của vai Chuyên viên. Thêm vai
mới chỉ khi cần _bộ hành động_ khác, không phải khi cần _phạm vi_ khác.

## Hệ quả

- `tinhQuyen()` trong `@gdos/shared` tính quyền hiệu lực; sidebar lọc bằng `locTheoQuyen()` trên
  đúng tập đó. API kiểm cùng tập — menu và API không thể lệch nhau.
- Xóa mềm của Chuyên viên **chỉ với hồ sơ do chính mình tạo** — luật cấp bản ghi, kiểm ở API khi
  có bảng nghiệp vụ đầu tiên (Mốc 3). Quyền `DELETE` ở đây là điều kiện cần, chưa đủ.
- Chuyên viên thấy **toàn bộ hồ sơ của xã** trong phân hệ được phân. Lọc tới hồ sơ được giao
  là việc của Mốc 3.
- Mã phân hệ Tầng 2 bắt đầu bằng `QT_`; Tầng 1 cấm `QT_` — `kiemTraCay()` chặn cả hai chiều.

## Phương án đã loại

- **Vai "Admin" nghiệp vụ:** trộn quyền kỹ thuật với quyền đọc dữ liệu của dân.
- **Mỗi chức danh một vai** (Văn thư, Tiếp dân, Địa chính…): số vai phình theo cơ cấu từng xã,
  mỗi vai chỉ khác nhau ở phạm vi — đúng việc của phân công.
- **Gán quyền lẻ từng người** (không qua vai): không kiểm toán được "ai có quyền gì, vì sao".
