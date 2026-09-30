# ADR-0008 — Mô hình dữ liệu Dự án (chuyển từ PMS)

- Trạng thái: **Đã chốt** · Ngày: 2026-09-30 · Người chốt: Nguyễn Mạnh Toàn
- Mã: `apps/api/src/db/schema/index.ts` · `drizzle/0008`, `0009` · `packages/shared/src/du-an.ts`

## Bối cảnh

PMS (quản lý dự án đầu tư theo NĐ 45/2026/NĐ-CP) đưa vào GDOS với **đủ chức năng**, nhưng **không
chuyển dữ liệu dự án** — đơn vị tự nạp bằng "Nhập từ Excel". PMS có những chỗ phải tổ chức lại cho
hợp với khung GDOS (ADR-0002, ADR-0006, ADR-0007):

- Chủ đầu tư là một danh sách tên; phạm vi quyền gắn vào tên đó.
- Nhà thầu gõ tay, lại có vai tài khoản riêng.
- Khối, phân loại A/B, hình thức là các danh mục người dùng tự khai, dù đều suy ra được.
- Phân quyền theo từng dự án lưu trong mảng mã dự án của tài khoản.

## Quyết định

1. **Chủ đầu tư là một đơn vị**: `du_an.don_vi_id` là đơn vị chủ đầu tư. RLS theo đơn vị tự giới
   hạn đúng dự án của chủ đầu tư; tỉnh thấy mọi đơn vị trực thuộc. Loại đơn vị mở rộng thành
   tỉnh · sở/ban/ngành · cơ quan Đảng · xã · doanh nghiệp.
2. **Nhà thầu, tư vấn là đơn vị loại "doanh nghiệp" + thành viên dự án** (`du_an_thanh_vien`).
   Thành viên thấy dự án mình tham gia, nhưng **chỉ gửi cập nhật** qua hàm `buoc_gui_cap_nhat`.
   Không có lối nào để thành viên ngoài đơn vị tự đánh dấu một bước là xong — database chặn.
3. **Không thêm vai.** Nhà thầu dùng vai Chuyên viên. Cái phân biệt nhà thầu là _vai trò trong dự
   án_, không phải vai của hệ thống (ADR-0006).
4. **Bỏ khai báo những gì suy ra được**: dự án chuyển tiếp/mới (từ năm bắt đầu), khối (từ loại
   đơn vị chủ đầu tư), hình thức (đi theo quy trình mẫu).
5. **Danh sách theo luật nằm trong mã** (`packages/shared/src/du-an.ts`): 3 giai đoạn, loại chi
   ĐTPT/CTX, nhóm A/B/C, trạng thái, bên thực hiện.
6. **Danh mục dùng một bảng chung** `danh_muc_gia_tri` (lĩnh vực, nguồn vốn, loại văn bản) và
   bảng `quy_trinh_mau`. Không thuộc đơn vị nào: ai cũng đọc, chỉ tài khoản ở đơn vị gốc ghi; nhật
   ký của chúng ghi vào đơn vị gốc. 6 quy trình mẫu NĐ 45 nạp sẵn và **khóa**; muốn khác thì nhân
   bản rồi sửa bản sao.
7. **Tính hạn, trạng thái, tiến độ ở `@gdos/shared`**, giữ nguyên công thức PMS: hạn nối chuỗi,
   bước nháp không vào chuỗi, "sắp đến hạn" trong 10 ngày. Hạn tính xong được **lưu** vào
   `du_an_buoc.han` để truy vấn quá hạn nhanh.
8. **Tạo dự án là chép quy trình mẫu sang** — sửa mẫu về sau không ảnh hưởng dự án đã tạo.

## Hệ quả

- Tài khoản ở đơn vị doanh nghiệp không thấy gì ngoài dự án mình là thành viên — kể cả khi đơn vị
  doanh nghiệp nằm dưới tỉnh.
- "Giám sát theo lĩnh vực" của PMS (sở chuyên ngành xem mọi dự án một lĩnh vực) **chưa làm** trong
  lớp dữ liệu này. Khi làm: thêm phạm vi lĩnh vực vào phân công, và nhánh thứ ba cho RLS của dự án.
- Tệp đính kèm (văn bản, chứng từ) làm ở phiên sau, lưu MinIO (CLAUDE.md).

## Phương án đã loại

- **Giữ danh sách tên chủ đầu tư như PMS:** phải tự viết lọc phạm vi trong code, không dùng được
  RLS — đúng lỗi "quên một chỗ là rò" mà ADR-0004 chặn.
- **Vai "Nhà thầu" riêng:** vai quyết định hành động trên mọi phân hệ; nhà thầu chỉ khác ở _một_
  dự án. Đó là việc của thành viên dự án.
- **Cho nhà thầu sửa bước, chủ đầu tư duyệt sau:** dữ liệu chưa duyệt lẫn vào tiến độ, báo cáo.
