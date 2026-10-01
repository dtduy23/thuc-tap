# ADR-0009 — Nối FOXAI Native: qua máy chủ GDOS, hồ sơ ở GDOS, Native chỉ xử lý

- Trạng thái: **Đã chốt** · Ngày: 2026-09-30 · Người chốt: Nguyễn Mạnh Toàn ("làm theo cách GDOS cũ trên GitLab")

## Bối cảnh

GDOS phải đứng một mình được (ADR-0003), nhưng các tính năng văn bản (tóm tắt, soạn thảo, phân
công, văn bản đến) và hỏi đáp AI do FOXAI Native làm. Đặc tả Document Service đã có ở
`foxai-gdos/docs/document-service/` (01 Tóm tắt · 02 Đơn vị xử lý · 03 Phân công · 04 Mẫu ·
05 Soạn thảo · 06 Tích hợp/webhook): mọi lời gọi cần `Authorization: Bearer <jwt>` của Native.
GDOS có tài khoản riêng, nên câu hỏi "GDOS gọi Native thay mặt người dùng bằng cách nào" chưa có
câu trả lời — ADR-0003 cấm tự chọn.

## Quyết định

1. **Chỉ máy chủ GDOS gọi Native.** Trình duyệt không bao giờ gọi thẳng, không giữ token Native.
   Hồ sơ văn bản gọi qua MỘT giao diện `KetNoiNative` (`apps/api/src/native/ket-noi-native.ts`);
   công cụ của Native đi qua cổng chuyển tiếp (mục 8). Không module nào khác tự gọi HTTP sang Native.
2. **Hồ sơ nằm ở Postgres của GDOS, Native chỉ xử lý.** Bảng `van_ban` (RLS theo đơn vị, nhật
   ký, xóa mềm như mọi bảng nghiệp vụ) giữ tên, loại, trạng thái, nội dung gốc, bản tóm tắt; tệp
   gốc ở kho tệp của GDOS. Native tạm ngừng thì văn bản cũ vẫn xem được; lỗi gọi Native được ghi
   vào văn bản để gửi lại, không làm mất văn bản.
3. **Gọi Native ngoài giao dịch database** — Native chậm không giữ khóa bảng. Văn bản đang chạy
   được đọc lại trạng thái khi có người xem (tối đa 20 văn bản mỗi lần), thay mặt người tạo.
4. **Gọi Native bằng danh tính CỦA CHÍNH người dùng — như GDOS cũ.** Mỗi người
   liên kết tài khoản FOXAI Native của mình một lần (Cài đặt cá nhân): gõ tên đăng nhập + mật
   khẩu Native, máy chủ GDOS gọi `POST {NATIVE_URL}/api/auth/login` (cổng v3 nhận `/api/auth/*`,
   không phải `/api/v2`). **Không lưu mật khẩu**; refresh token lưu **mã hóa AES-256-GCM** (khóa
   suy từ AUTH_SECRET) trong bảng `lien_ket_native` — RLS chỉ chủ tài khoản thấy dòng của mình.
   Access token chỉ ở bộ nhớ; hết hạn thì làm mới — mỗi người một lần tại một thời điểm (refresh
   token xoay vòng). Native thu hồi phiên → gỡ liên kết, người dùng liên kết lại. Phía Native kiểm
   quyền đúng theo người — trả lời câu hỏi mở của ADR-0003.
5. **Ba chế độ, chọn bằng cấu hình** (không có giá trị mặc định cho địa chỉ Native):
   - `NATIVE_GIA=1` — bản giả cho máy dev và test (production cấm): tóm tắt lấy ba câu đầu.
   - `NATIVE_URL` + cách lấy token (`CapToken`) — bản HTTP thật theo đặc tả Document Service.
   - Vắng cả hai — "chưa kết nối": tính năng gọi Native trả 503 với câu dễ hiểu.
6. **Chỉ tài khoản đã liên kết mới gửi được sang Native** (ADR-0003 mục 2).
   Người chưa liên kết vẫn xem được văn bản của đơn vị mình.
7. **Cấu hình kết nối ở biến môi trường máy chủ, không nhập qua màn hình.** Quản trị › Kết nối
   › Dịch vụ nền tảng chỉ XEM chế độ, địa chỉ và KIỂM TRA kết nối. (Riêng nguồn API của khách
   ở "Nguồn dữ liệu vào" được cấu hình qua màn hình — xem ADR-0010.)
8. **Công cụ của Native — mẫu văn bản, soạn thảo, phân công, đơn vị nhận việc, NHIỆM VỤ (`/tasks`)
   và danh bạ (`/api/directory`, chọn người / đơn vị khi giao việc) — đi qua
   CỔNG CHUYỂN TIẾP `/api/native/document/*`** (`native/chuyen-tiep.ts`). Đây là dữ liệu và
   công cụ CỦA Native, dùng chung với các ứng dụng khác trên Native; GDOS không chép sang bảng riêng
   (khác văn bản — mục 2). Cổng chỉ cho đi đường dẫn trong DANH SÁCH CHO PHÉP (mã bản ghi phải đúng
   dạng UUID, tham số truy vấn lọc theo danh sách), mỗi đường gắn một quyền GDOS (`VAN_BAN.*`: xem →
   READ, tạo/soạn → CREATE, sửa mẫu/đơn vị → UPDATE, xóa mẫu → DELETE, phân công → ASSIGN), gọi
   bằng token của chính người dùng. Native trả 401 → làm mới token một lần rồi gửi lại; vẫn 401 →
   trả 403 "liên kết hết hạn" (không trả 401 — web hiểu là hết phiên GDOS). Lỗi Native dịch sang câu
   tiếng Việt; lỗi 5xx không để lộ chi tiết. Chỉ chạy với Native thật (bản giả chỉ có tóm tắt).
   Lưu ý khi soạn thảo: thể thức nhập ở màn Soạn thảo được Native **ghi đè và lưu** vào
   `default_meta` của mẫu — đó là hành vi của Native, như GDOS cũ.
9. **Kết quả nhận dạng chứng từ (OCR Service, `/api/ocr`) được LẤY VỀ kho của GDOS, giữ dạng ĐỘNG.**
   Khác mục 8: kết quả OCR là đầu vào cho nghiệp vụ của GDOS nên chép về (`ocr_chung_tu`, RLS theo
   đơn vị), không đọc trực tiếp mỗi lần xem. GDOS không khai cứng trường nào: mỗi loại chứng từ có
   bản chụp ĐỊNH NGHĨA trường + bảng từ Native (`ocr_loai.dinh_nghia`), mỗi chứng từ giữ nguyên
   `du_lieu` (trường → giá trị) và `bang` (bảng → các dòng). Native dùng chung nhiều khách nên chỉ
   lấy loại quản trị đã BẬT. GDOS chỉ ĐỌC Native (`/schemas`, `/documents`, `/documents/{id}/result`)
   — không tải lên, không xác nhận, không sửa bên đó; chỉ lấy chứng từ đã nhận dạng xong hoặc đã
   xác nhận; lấy lại thì cập nhật đúng dòng cũ (khóa: đơn vị + mã Native). Việc lấy về do quản trị
   bấm (Tầng 2 › Kết nối › Nhận dạng chứng từ), bằng token của chính người bấm. **Tầng 2 chỉ đưa dữ
   liệu về; trực quan hóa và dùng là việc của phân hệ tác nghiệp** — gọi `GET /api/ocr/chung-tu?loai=`
   hoặc thành phần `<BangChungTuOcr loai="…" />`; phân hệ nào dùng thì thêm quyền READ của mình vào
   `QUYEN_DOC_OCR` (@gdos/shared).

## Bật bản thật

`.env` máy chủ: bỏ `NATIVE_GIA`, đặt `NATIVE_URL=https://nativev3.foxai.com.vn` rồi khởi động lại API.
**Chỉ một địa chỉ Native: nativev3** (anh Toàn chốt 01/10/2026) — tên miền gdos.fox.ai.vn của GDOS cũ
sẽ bỏ; GDOS mới và GDOS cũ là hai hệ thống độc lập, không trỏ sang nhau. Mỗi người vào Cài đặt cá
nhân › Liên kết FOXAI Native. Máy chủ gọi máy chủ nên chạy được cả trên localhost.

Còn để sau: Văn bản đến qua tích hợp đối tác của Native (`POST /inbound` + webhook, khóa API cấp
cho GDOS — 06_TichHop-Webhook) khi GDOS có tên miền công khai.

## Hệ quả

- Làm xong: Tóm tắt văn bản (danh sách theo chuẩn lưới, tải lên, xem gốc — tóm tắt song
  song, sửa tóm tắt, gửi/tóm tắt lại, tải tệp gốc) và Dịch vụ nền tảng (danh sách, kiểm tra) —
  liên kết tài khoản Native theo từng người.
- Làm xong (30/09, bước D): Văn bản đến (hồ sơ `van_ban` nguồn QLVB / Cổng DVC / Email kéo về
  từ Native), Soạn thảo văn bản, Phân công từ văn bản, Mẫu văn bản, Đơn vị nhận việc — qua cổng
  chuyển tiếp (mục 8). HTML Native trả về đi qua DOMPurify (ADR-0005) trước khi vào trang.
- Văn bản đến thật sự đổ về khi đối tác gửi vào `/inbound` của Native — xem "Còn để sau".

## Phương án đã loại

- **Một tài khoản dịch vụ chung cho cả GDOS:** mọi văn bản phía Native thuộc một người; phải giữ
  mật khẩu tài khoản đó ở máy chủ; Native không biết ai thật sự gửi.
- **Tích hợp đối tác (`/inbound` + webhook) cho mọi việc:** kết quả chỉ về qua webhook (cần địa
  chỉ công khai), không có nội dung trích từ tệp — giữ cho "Văn bản đến", không dùng cho người dùng.

- **Trình duyệt gọi thẳng Native (như GDOS cũ):** token Native phải nằm ở trình duyệt; GDOS mất
  chỗ kiểm quyền, ghi nhật ký; đổi địa chỉ Native phải build lại web.
- **Chỉ lưu mã văn bản Native, không lưu nội dung ở GDOS:** Native ngừng là mất hết văn bản trên
  màn hình; không lọc được theo đơn vị bằng RLS.
- **Để sẵn địa chỉ nativev3 làm mặc định:** đúng lỗi GDOS cũ — chạy "được" tới ngày chạy nhầm môi
  trường.
