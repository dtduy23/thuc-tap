# ADR-0009 — Nối FOXAI Native: qua máy chủ GDOS, hồ sơ ở GDOS, Native chỉ xử lý

- Trạng thái: **Đề xuất** — phần kiến trúc đã làm (Mốc 5 bước A); **cách xác thực chờ đội
  Native** (câu hỏi mở của ADR-0003) · Ngày: 2026-09-30

## Bối cảnh

GDOS phải đứng một mình được (ADR-0003), nhưng các tính năng văn bản (tóm tắt, soạn thảo, phân
công, văn bản đến) và hỏi đáp AI do FOXAI Native làm. Đặc tả Document Service đã có ở
`foxai-gdos/docs/document-service/` (01 Tóm tắt · 02 Đơn vị xử lý · 03 Phân công · 04 Mẫu ·
05 Soạn thảo · 06 Tích hợp/webhook): mọi lời gọi cần `Authorization: Bearer <jwt>` của Native.
GDOS có tài khoản riêng, nên câu hỏi "GDOS gọi Native thay mặt người dùng bằng cách nào" chưa có
câu trả lời — ADR-0003 cấm tự chọn.

## Quyết định

1. **Chỉ máy chủ GDOS gọi Native.** Trình duyệt không bao giờ gọi thẳng, không giữ token Native.
   Mọi nghiệp vụ gọi qua MỘT giao diện `KetNoiNative` (`apps/api/src/native/ket-noi-native.ts`),
   không module nào tự gọi HTTP sang Native.
2. **Hồ sơ nằm ở Postgres của GDOS, Native chỉ xử lý.** Bảng `van_ban` (RLS theo đơn vị, nhật
   ký, xóa mềm như mọi bảng nghiệp vụ) giữ tên, loại, trạng thái, nội dung gốc, bản tóm tắt; tệp
   gốc ở kho tệp của GDOS. Native tạm ngừng thì văn bản cũ vẫn xem được; lỗi gọi Native được ghi
   vào văn bản để gửi lại, không làm mất văn bản.
3. **Gọi Native ngoài giao dịch database** — Native chậm không giữ khóa bảng. Văn bản đang chạy
   được đọc lại trạng thái khi có người xem (tối đa 20 văn bản mỗi lần), thay mặt người tạo.
4. **Ba chế độ, chọn bằng cấu hình** (không có giá trị mặc định cho địa chỉ Native):
   - `NATIVE_GIA=1` — bản giả cho máy dev và test (production cấm): tóm tắt lấy ba câu đầu.
   - `NATIVE_URL` + cách lấy token (`CapToken`) — bản HTTP thật theo đặc tả Document Service.
   - Vắng cả hai — "chưa kết nối": tính năng gọi Native trả 503 với câu dễ hiểu.
5. **Chỉ tài khoản đã liên kết (`native_user_id`) mới gửi được sang Native** (ADR-0003 mục 2).
   Người chưa liên kết vẫn xem được văn bản của đơn vị mình.
6. **Cấu hình kết nối ở biến môi trường máy chủ, không nhập qua màn hình.** Quản trị › Kết nối
   › Dịch vụ nền tảng chỉ XEM chế độ, địa chỉ và KIỂM TRA kết nối.

## Còn mở — phải hỏi đội Native trước khi bật bản thật

| Câu hỏi                                                                                                              | Vì sao cần                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GDOS lấy token gọi Native bằng cách nào: tài khoản dịch vụ + truyền `native_user_id`, hay đổi token theo từng người? | Quyết định `CapToken` — phần duy nhất bản thật còn thiếu                                                             |
| Native kiểm quyền và gán chủ sở hữu văn bản theo tài khoản nào?                                                      | Nếu theo tài khoản dịch vụ thì mọi đơn vị chung một chủ — GDOS vẫn lọc bằng RLS của mình, nhưng phía Native cần biết |
| Địa chỉ môi trường thử + một tài khoản thử                                                                           | Chạy bản thật trên máy dev (ghi vào `.env`, không vào mã)                                                            |
| Văn bản đến (webhook `POST /inbound`, 06_TichHop-Webhook): Native đẩy về GDOS hay GDOS hỏi định kỳ?                  | Làm "Văn bản đến"                                                                                                    |

## Hệ quả

- Làm xong bước A: Tóm tắt văn bản (danh sách theo chuẩn lưới, tải lên, xem gốc — tóm tắt song
  song, sửa tóm tắt, gửi/tóm tắt lại, tải tệp gốc) và Dịch vụ nền tảng (danh sách, kiểm tra) —
  chạy với bản giả. Bật bản thật chỉ cần thêm một lớp `CapToken`, không sửa nghiệp vụ.
- Còn phác: Văn bản đến, Soạn thảo, Phân công từ văn bản, Mẫu văn bản — cùng khung này, theo
  đặc tả 03–06.

## Phương án đã loại

- **Trình duyệt gọi thẳng Native (như GDOS cũ):** token Native phải nằm ở trình duyệt; GDOS mất
  chỗ kiểm quyền, ghi nhật ký; đổi địa chỉ Native phải build lại web.
- **Chỉ lưu mã văn bản Native, không lưu nội dung ở GDOS:** Native ngừng là mất hết văn bản trên
  màn hình; không lọc được theo đơn vị bằng RLS.
- **Để sẵn địa chỉ nativev3 làm mặc định:** đúng lỗi GDOS cũ — chạy "được" tới ngày chạy nhầm môi
  trường.
