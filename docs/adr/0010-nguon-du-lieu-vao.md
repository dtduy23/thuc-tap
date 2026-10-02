# ADR-0010 — Nguồn dữ liệu vào: số liệu chỉ tiêu nạp qua API và Excel, một kho

Trạng thái: Đã chốt (anh Toàn, 01/10/2026)

## Bối cảnh

Điều hành cần số liệu của cả bộ chỉ tiêu (TTHC, PAKN, dân cư, kinh tế…), nhưng phần lớn chỉ tiêu
KHÔNG có phân hệ nghiệp vụ trong GDOS — số nằm ở hệ thống khác của khách (Một cửa, dân cư…), có
nơi có API, có nơi chỉ xuất được Excel. Trước ADR này các chỉ tiêu đó hiện số MINH HỌA.

Yêu cầu: chứng minh được dữ liệu ở Điều hành **mà không dựng module nhập liệu**. Dựng màn nhập
số ở Tầng 1 sẽ phá luật đặt chỗ (ADR-0002): Tầng 1 là nghiệp vụ có hồ sơ, có quy trình — không
phải chỗ gõ số tổng hợp.

## Quyết định

1. **Excel là một KÊNH NẠP, ngang hàng với API — không phải màn nhập liệu.** Cả hai nằm ở Tầng 2 ›
   Kết nối › **Nguồn dữ liệu vào** (`QT_NGUON_VAO`): Nguồn API · Nạp từ Excel · Kết quả lấy về.
   Câu hỏi của module này là "số từ ngoài vào hệ thống qua đâu", cùng loại với Dịch vụ nền tảng
   và OCR. Tầng 1 không có biểu mẫu nhập số chỉ tiêu.
2. **Một kho duy nhất** `chi_tieu_so_lieu`: (đơn vị, mã chỉ tiêu, kỳ tháng `YYYY-MM`) → giá trị, kèm
   kênh và tên nguồn. Nạp lại cùng chỉ tiêu + kỳ thì ghi đè (lần nạp sau thắng). Mỗi lần nạp để lại
   một dòng `chi_tieu_lan_nap` (ai, lúc nào, bao nhiêu dòng, lỗi gì). RLS theo đơn vị, có nhật ký.
3. **Điều hành chỉ ĐỌC kho**, không biết số đến bằng kênh nào. Thứ tự ưu tiên của một chỉ tiêu:
   số THẬT từ phân hệ đã xây › số NẠP › số minh họa. Mỗi số mang nhãn nguồn (`that` / `nap` kèm
   kênh + kỳ + lúc nạp / `minh-hoa`). KPI không nạp — tự tính từ chỉ tiêu gốc; KPI tính từ hai chỉ
   tiêu mà chỉ một bên có số nạp thì vẫn là minh họa.
4. **Số nạp thuộc đơn vị của người nạp; người xem thấy số của ĐÚNG đơn vị mình.** Không cộng số
   của đơn vị con lên cấp trên (tỷ lệ % không cộng được) — tổng hợp liên đơn vị là việc sau.
5. **Nguồn API cấu hình QUA MÀN HÌNH — nới mục 7 của ADR-0009 cho riêng nguồn của khách.** Mỗi
   khách một bộ nguồn khác nhau, không thể đặt hết vào biến môi trường. Điều kiện kèm theo:
   - khóa / token lưu MÃ HÓA (AES-GCM, khóa suy từ `AUTH_SECRET`) ở bảng riêng
     `nguon_du_lieu_bi_mat`, không gắn nhật ký, **không bao giờ trả về trình duyệt** (chỉ báo "đã
     lưu"); xóa nguồn thì xóa hẳn khóa;
   - máy chủ chặn gọi vào chính nó: loopback, link-local, địa chỉ metadata hạ tầng; kiểm cả IP mà
     tên miền phân giải ra; không theo chuyển hướng; hạn giờ 20 giây; phản hồi tối đa 2 MB;
     production chỉ `https`. Mạng nội bộ (10.x, 192.168.x) KHÔNG chặn — hệ thống của khách
     thường ở đó;
   - chỉ `GET`, chỉ đọc JSON. Kết nối FOXAI Native vẫn theo ADR-0009 (biến môi trường).
6. **Ánh xạ khai bằng dữ liệu, không viết mã theo từng khách.** Hai dạng: JSON là MỘT MẢNG (mỗi
   phần tử có trường mã / kỳ / giá trị) hoặc MỘT ĐỐI TƯỢNG (mỗi trường là một chỉ tiêu — khai cặp
   trường → mã chỉ tiêu). Đường dẫn dạng chấm. Không có kỳ thì lấy kỳ tháng hiện tại.
7. **Kiểm trước, ghi sau.** Excel: tải mẫu → kiểm (không ghi) → nạp, TẤT CẢ HOẶC KHÔNG. API: "Lấy
   thử" không ghi gì; "Lấy ngay" ghi dòng đúng, bỏ dòng sai và ghi lỗi vào vết. Cùng một bộ luật
   kiểm cho hai kênh (`kiemDongNap` ở @gdos/shared).

## Hệ quả

- Khách chưa có phân hệ nào trong GDOS vẫn có bảng điều hành với số thật của mình, có vết nguồn.
- Khi một phân hệ nguồn được xây, chỉ tiêu tương ứng tự chuyển sang số thật của phân hệ (ưu tiên
  cao hơn số nạp) — không phải gỡ gì.
- Chỉ quản trị nạp được. Muốn cán bộ đầu mối từng lĩnh vực tự nạp thì thêm quyền riêng — chưa làm.
- Chưa có lịch tự chạy: nguồn API lấy khi bấm "Lấy ngay".
- Đổi `AUTH_SECRET` thì các khóa nguồn đã lưu không giải được — phải nhập lại.

## Phương án đã loại

- **Module "Tổng hợp số liệu" ở Tác nghiệp để nhập tay**: phá luật đặt chỗ, biến Tầng 1 thành bảng
  tính; số gõ tay không có vết nguồn.
- **Khóa nguồn ở biến môi trường (giữ nguyên ADR-0009 mục 7)**: mỗi lần thêm nguồn phải sửa máy
  chủ và khởi động lại; không hợp với sản phẩm dùng cho nhiều khách.
- **Mỗi kênh một bảng số riêng**: Điều hành phải biết từng kênh; đổi kênh là mất chuỗi kỳ.
