# Báo cáo triển khai và quy trình nghiệp vụ bệnh viện

GDOS đã triển khai **bản diễn tập cho cả 7 hạng mục** trong `YC_BenhVien.xlsx`, `Sheet1`, dòng TT 1–7. Báo cáo này giúp đội bệnh viện và kỹ thuật đối chiếu thao tác trên màn hình, trách nhiệm của từng vai, điều kiện chuyển trạng thái và đầu ra của từng luồng.

Phiên bản được mô tả nằm trên nhánh `feat/dashboard-benh-vien-hang-muc-2`. Bản diễn tập sử dụng ảnh do phần mềm tạo, mã hồ sơ mẫu và kết nối giả lập. Các kết quả X-quang phản ánh khả năng xử lý ảnh tổng hợp của mô hình thử. Báo cáo xuất ra là bản nháp để đối soát.

## Vị trí nghiệp vụ trong workbook và GDOS

Cột **B** trên `Sheet1` chia yêu cầu thành hai nhóm. Cột **A** ghi số **TT**, cột **C** ghi yêu cầu chi tiết của từng dòng. **Bảng điều hành bệnh viện thuộc nhóm hạng mục thứ hai, TT 4 (`Sheet1!C5`). TT 2 (`Sheet1!C3`) thuộc nhóm X-quang và là phần gán nhãn phim lịch sử, hồ sơ nghiên cứu.**

### Nhóm 1 — Nghiên cứu, phát triển và thử nghiệm AI hỗ trợ đọc X-quang phổi

| TT và ô yêu cầu        | Nghiệp vụ đã triển khai                                                                                                                              | Vị trí trong GDOS                                                                                                                                                                                                    | Người thực hiện chính                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **TT 1** · `Sheet1!C2` | Nhận lô phim tổng hợp từ bệnh viện và xe lưu động, chạy thử mô hình và đối chiếu với nhãn đã duyệt.                                                  | Nghiệp vụ → Tác nghiệp → Phim X-quang → [Kho phim và gán nhãn](http://localhost:5174/bv-phim).                                                                                                                       | Chuyên viên đọc phim và người duyệt nhãn.                   |
| **TT 2** · `Sheet1!C3` | Gán nhãn và duyệt trên bộ 5.000 phim lịch sử tổng hợp. Ghi các mốc nghiên cứu, đạo đức, phân loại thiết bị và đào tạo. Xem và xuất báo cáo, bộ nhãn. | Nghiệp vụ → Tác nghiệp → Phim X-quang → [Kho phim và gán nhãn](http://localhost:5174/bv-phim), [Hồ sơ nghiên cứu](http://localhost:5174/bv-nghien-cuu), [Báo cáo nghiên cứu](http://localhost:5174/bv-bao-cao-phim). | Chuyên viên nghiên cứu, người duyệt và người có quyền xuất. |

### Nhóm 2 — Quản trị bệnh viện thông minh và AI hỗ trợ nghiệp vụ

| TT và ô yêu cầu        | Nghiệp vụ đã triển khai                                                                                | Vị trí trong GDOS                                                                                                                                                                                                                                     | Người thực hiện chính                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **TT 3** · `Sheet1!C4` | Nạp mẫu HIS, LIS, X-quang, BHXH, VITIMES. Nạp và đối soát chỉ tiêu từ Excel hoặc API.                  | Quản trị hệ thống → Kết nối → Nguồn dữ liệu vào → [Nguồn bệnh viện](http://localhost:5174/bv-ket-noi), [Nạp từ Excel](http://localhost:5174/nd-excel), [Nguồn API](http://localhost:5174/nd-api), [Kết quả lấy về](http://localhost:5174/nd-ket-qua). | Quản trị viên có quyền cập nhật nguồn.                                       |
| **TT 4** · `Sheet1!C5` | Xem KPI, xu hướng sáu tháng và bảng nguồn số liệu. Lập bản nháp giao ban cho Sở Y tế, BHXH và VITIMES. | Nghiệp vụ → Điều hành → Tổng quan → Bảng điều hành → thẻ [Bệnh viện](http://localhost:5174/dh-bang-dieu-hanh#benh-vien). Các bản nháp cũng có ở Điều hành → Báo cáo → [Báo cáo định kỳ](http://localhost:5174/bc-dinh-ky).                            | Người có quyền xem Tổng quan và người có quyền xuất của phân hệ chủ báo cáo. |
| **TT 5** · `Sheet1!C6` | Rà soát lỗi BHYT theo quy tắc mẫu, bổ sung, duyệt hoặc trả lại, rồi gửi cổng BHXH giả lập.             | Nghiệp vụ → Tác nghiệp → Hồ sơ BHYT → [Rà soát trước khi gửi](http://localhost:5174/bv-bhyt).                                                                                                                                                         | Người có quyền cập nhật để rà soát và gửi, người có quyền duyệt.             |
| **TT 6** · `Sheet1!C7` | Tra mã ICD có sẵn và mốc theo dõi ca lao mẫu. Hỏi số liệu theo kỳ và soạn dự thảo giao ban.            | Nghiệp vụ → Tác nghiệp → Điều trị lao – phổi → [Tra cứu ca mẫu](http://localhost:5174/bv-tro-ly). Nghiệp vụ → Điều hành → Tổng quan → Bảng điều hành → thẻ [Tra cứu số liệu](http://localhost:5174/dh-bang-dieu-hanh#tra-cuu-so-lieu).                | Người có quyền xem Điều trị lao – phổi hoặc Tổng quan, tùy chủ đề.           |
| **TT 7** · `Sheet1!C8` | Ghi kết quả theo từng mốc của ca lao mẫu, duyệt hoàn tất theo dõi và đồng bộ VITIMES giả lập.          | Nghiệp vụ → Tác nghiệp → Điều trị lao – phổi → [Theo dõi ca điều trị](http://localhost:5174/bv-lao).                                                                                                                                                  | Người có quyền cập nhật để theo dõi và đồng bộ, người có quyền duyệt.        |

Trong GDOS, chuyên viên có quyền cập nhật trong phạm vi được phân công, còn lãnh đạo có quyền duyệt trong phạm vi được phân công. Cờ quản trị cấp quyền cho các chức năng quản trị như **Nguồn dữ liệu vào**. Tài khoản dev có cả hai vai nghiệp vụ và cờ quản trị nên có thể diễn tập liên tục các bước. Khi kiểm tra phân quyền, dùng các tài khoản có vai riêng. Xem [ADR-0006 về vai và phân công](adr/0006-vai-tro-khoi-chinh-phu.md).

## Luồng dữ liệu đầu vào và đầu ra

GDOS đọc **số liệu tổng hợp theo tháng** từ kho chỉ tiêu được nạp qua Excel hoặc API và từ bộ số liệu giả lập. Chế độ **Tự động** ưu tiên số đã nạp cho từng chỉ tiêu, tháng và đơn vị. Chỉ tiêu còn thiếu dùng số giả lập và được ghi rõ nguồn. Hai chế độ **Đã nạp** và **Giả lập** cho phép xem riêng từng nguồn. Ảnh X-quang, hồ sơ BHYT và ca lao trong bản diễn tập là bộ mẫu dựng sẵn. Người dùng xử lý các hồ sơ đó trên màn hình nghiệp vụ tương ứng.

### Nạp số liệu chỉ tiêu từ Excel

1. Mở **Quản trị hệ thống → Kết nối → Nguồn dữ liệu vào → Nạp từ Excel** và bấm **Tải tệp mẫu**. Dùng tệp `.xlsx` có trang tính **Số liệu**. Hệ thống đọc ba cột đầu gồm **Mã chỉ tiêu**, **Kỳ (MM/YYYY)** và **Giá trị**. Các cột còn lại dùng để tra cứu.
2. Điền mỗi số liệu vào một dòng. Với bệnh viện, dùng mã `BV-01` đến `BV-11` và giá trị là số nguyên không âm. Có thể đưa nhiều tháng vào một tệp. Hàng để trống giá trị được bỏ qua, còn `0` được nạp như một số hợp lệ. Trong một tệp, mỗi cặp mã chỉ tiêu và tháng chỉ xuất hiện một lần.
3. Chọn tệp và xem kết quả kiểm tra. GDOS báo số dòng hợp lệ và lý do của các dòng sai. Sửa tệp rồi kiểm lại nếu có lỗi. Excel được nạp theo nguyên tắc cả tệp hợp lệ mới ghi dữ liệu.
4. Bấm **Nạp số liệu**. Xem **Kết quả lấy về** để đối soát lần nạp và số liệu đã ghi. Sau đó mở dashboard Bệnh viện, chọn **Đã nạp** và đúng tháng. Kiểm tra các giá trị, đơn vị tính và tên tệp ở bảng chi tiết trước khi tải báo cáo.

Ví dụ minh họa cho tháng 11/2026.

| Mã chỉ tiêu | Kỳ      | Giá trị | Ý nghĩa              |
| ----------- | ------- | ------: | -------------------- |
| `BV-01`     | 11/2026 |    1200 | Lượt khám ngoại trú  |
| `BV-04`     | 11/2026 |     750 | Ngày giường sử dụng  |
| `BV-05`     | 11/2026 |    1000 | Ngày giường khả dụng |
| `BV-08`     | 11/2026 |       0 | Số hồ sơ BHYT gửi    |

Dashboard chế độ **Đã nạp** sẽ hiện **1.200 lượt khám**, **75% công suất giường** và **0 hồ sơ BHYT gửi**. Công suất được tính từ `BV-04` và `BV-05` cùng kỳ. Các chỉ tiêu chưa có dữ liệu sẽ hiện `—`. Bản nháp Sở Y tế chứa nhóm khám và giường, còn bản nháp BHXH chứa nhóm gửi và trả hồ sơ.

### Nạp số liệu chỉ tiêu từ API

1. Mở [Nguồn API](http://localhost:5174/nd-api), tạo nguồn và khai địa chỉ, kiểu xác thực, đường dẫn dữ liệu trong phản hồi và cách ánh xạ. Máy chủ GDOS gọi `GET` tới nguồn và đọc JSON. Có thể ánh xạ một mảng có các trường mã, kỳ, giá trị, hoặc một đối tượng có từng trường số liệu tương ứng với từng mã chỉ tiêu.
2. Bấm **Lấy thử** để xem mẫu phản hồi và kết quả kiểm tra trước khi ghi. Khi cấu hình đúng, lưu và bật nguồn.
3. Bấm **Lấy ngay** để nạp. Dòng hợp lệ được ghi vào kho, dòng sai được bỏ qua và ghi lỗi trong lần nạp. Nếu cấu hình để trống trường kỳ, hệ thống dùng tháng hiện tại. Nên ánh xạ trường kỳ khi nguồn có số liệu các tháng trước. Kiểm tra kết quả ở [Kết quả lấy về](http://localhost:5174/nd-ket-qua), sau đó mở dashboard ở chế độ **Đã nạp**.

Ví dụ phản hồi JSON dạng mảng cho ánh xạ theo dòng, với đường dẫn `data`.

```json
{
  "data": [
    { "maChiTieu": "BV-01", "ky": "2026-11", "giaTri": 1200 },
    { "maChiTieu": "BV-04", "ky": "2026-11", "giaTri": 750 },
    { "maChiTieu": "BV-05", "ky": "2026-11", "giaTri": 1000 }
  ]
}
```

Excel và API ghi vào cùng kho `chi_tieu_so_lieu`. Đơn vị được xác định từ tài khoản nạp. Mỗi bộ **đơn vị, mã chỉ tiêu, tháng** có một giá trị hiện hành. Nếu nạp lại cùng bộ khóa, lần nạp sau thay giá trị và thông tin nguồn. Kết quả lần nạp ghi kênh, thời điểm, số dòng và lỗi. Dashboard hiển thị số của đơn vị người xem.

### Chạy nguồn mẫu và xuất kết quả

- Để diễn tập nhanh, mở [Nguồn bệnh viện](http://localhost:5174/bv-ket-noi), chọn tháng và bấm **Nạp mẫu** ở một trong năm nguồn. Dashboard **Giả lập** có thể xem ngay trước khi nạp mẫu. Nút nạp chỉ ghi vết của nguồn và kỳ, sau đó dashboard hiện nhãn như **Giả lập · HIS**. Số mẫu vẫn thuộc chế độ **Giả lập**.
- Từ [dashboard Bệnh viện](http://localhost:5174/dh-bang-dieu-hanh#benh-vien), chọn nguồn và kỳ, mở bản nháp báo cáo Sở Y tế, BHXH hoặc VITIMES rồi bấm **Xuất Excel**. Tệp có chỉ tiêu, đơn vị tính, giá trị, nguồn và thời điểm cập nhật nếu có. Số đã nạp đi ra từ kho chỉ tiêu, còn số giả lập đi ra từ bộ tổng hợp mẫu. Các thao tác gửi BHYT hoặc đồng bộ ca lao giả lập lưu trạng thái nghiệp vụ riêng. Chúng chưa làm tăng các chỉ tiêu tổng hợp trên dashboard.

### Đầu vào và đầu ra theo từng hạng mục

| TT  | Đầu vào                                                                           | GDOS lưu hoặc xử lý                                                                           | Đầu ra                                                                                    |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Ảnh tổng hợp, mã phim, mã chỉ định HIS mẫu, nguồn nhận và nhãn người đọc.         | Lưu vết nhận lô, trạng thái nhãn và kết quả chạy mô hình theo đơn vị.                         | Ảnh xem trên màn hình, nhãn đã duyệt, gợi ý, điểm tín hiệu và đối chiếu.                  |
| 2   | 5.000 ảnh lịch sử tổng hợp, nhãn, các mốc nghiên cứu và lô được chọn để đánh giá. | Tổng hợp tiến độ duyệt và đếm kết quả đối chiếu ở các phim đủ điều kiện.                      | Bảng tiến độ, bộ nhãn Excel, báo cáo khoa học và bản nháp tài liệu nghiên cứu.            |
| 3   | Nguồn và tháng đã chọn, tệp Excel hoặc phản hồi JSON.                             | Với nguồn mẫu, lưu vết theo nguồn và kỳ. Với Excel/API, ghi số liệu và lần nạp vào kho chung. | Trạng thái nhận nguồn, số dòng hợp lệ, lỗi và các chỉ tiêu đã có trong kho.               |
| 4   | Tháng, chế độ dữ liệu và giá trị 11 chỉ tiêu.                                     | Đọc đúng kỳ, tính công suất từ hai chỉ tiêu giường và so sánh với tháng trước.                | Thẻ KPI, biểu đồ sáu tháng, bảng kèm nguồn và ba bản nháp Excel.                          |
| 5   | Hồ sơ BHYT mẫu gồm mã hồ sơ, ngày dịch vụ, mã thẻ và mã dịch vụ.                  | Kiểm tra theo quy tắc mẫu, lưu trạng thái rà soát, bổ sung, duyệt và gửi.                     | Danh sách lỗi hoặc thông báo cổng BHXH giả lập đã nhận hồ sơ sau duyệt.                   |
| 6   | Chủ đề và ca lao mẫu, hoặc tháng và chỉ tiêu.                                     | Đọc nguồn theo quyền người dùng rồi dựng câu trả lời theo chủ đề.                             | Mã ICD đã lưu, mốc cần xác nhận, số liệu hoặc bản nháp giao ban có thể chỉnh và sao chép. |
| 7   | Ca lao mẫu, các ngày theo dõi và kết quả do chuyên viên ghi nhận.                 | Lưu kết quả từng mốc, trạng thái hoàn tất và vết đồng bộ mới nhất.                            | Tiến độ theo dõi, mốc cần liên hệ lại và xác nhận đồng bộ VITIMES giả lập.                |

## TT 1 Nhận phim và đối chiếu mô hình X-quang

Luồng này diễn tập việc nhận phim từ hai nguồn, ghi nhận cách người đọc phân loại ảnh và so sánh kết quả với mô hình thử. Mỗi phim có mã `XQ-…`, mã chỉ định `HIS-XQ-…`, nguồn nhận và nhóm **Học**, **Đánh giá** hoặc **Chạy song song**.

1. Trong **Hồ sơ nghiên cứu**, người có quyền duyệt ghi nhận mốc **Biên bản Hội đồng đạo đức**. Mốc này là điều kiện để nhận lô chạy song song. Phim lịch sử đã có sẵn để diễn tập gán nhãn.
2. Trong **Kho phim và gán nhãn**, chuyên viên chọn nhận lô từ **Máy X-quang bệnh viện** hoặc **Xe X-quang lưu động**. Mỗi nguồn mở một lô cố định gồm 6 phim mẫu. Nhận lại cùng nguồn giữ nguyên các mã phim, nên danh sách có tối đa 12 phim chạy song song ngoài tập lịch sử.
3. Chuyên viên tìm theo mã hoặc lọc theo nguồn và trạng thái, mở ảnh tổng hợp, kiểm tra mã chỉ định HIS mẫu rồi chọn một trong ba nhãn **Có dấu mô phỏng**, **Không có dấu mô phỏng**, hoặc **Loại khỏi tập vì chất lượng**. Bấm **Lưu nhãn chờ duyệt** để chuyển phim sang **Chờ duyệt**.
4. Người duyệt kiểm tra nhãn đã lưu. **Duyệt nhãn** chốt nhãn và chuyển sang **Đã duyệt**. **Trả lại** đưa phim về **Chờ gán nhãn**. Nếu nhãn đang duyệt đã bị thay đổi, hệ thống yêu cầu tải lại trước khi duyệt.
5. Sau khi nhãn được duyệt và ảnh đủ chất lượng trong bài tập, chuyên viên bấm **Chạy gợi ý thử**. Màn hình hiển thị nhãn gợi ý, điểm tín hiệu, phiên bản mô hình và kết quả **Trùng nhãn đã duyệt** hoặc **Khác nhãn đã duyệt**. Nhãn đã duyệt là mốc đối chiếu và được giữ riêng với gợi ý.

Mô hình `phantom-centroid-v1` học một ngưỡng từ độ chênh sáng trên ảnh tổng hợp thuộc nhóm **Học** trong 400 mã đầu. Điểm tín hiệu 0–100 biểu thị khoảng cách đến ngưỡng trong mô hình thử. Nhãn do người dùng duyệt dùng để đối chiếu kết quả diễn tập. Xem [mã mô hình](../apps/api/src/benh-vien/x-quang.ts) và [quy tắc chuyển trạng thái phim](../apps/api/src/benh-vien/phim.service.ts).

## TT 2 Gán nhãn phim lịch sử và lập hồ sơ nghiên cứu

Kho lịch sử gồm **5.000 ảnh tổng hợp**. Bộ khởi tạo có 4.960 phim với nhãn mẫu đã duyệt, 16 phim chờ duyệt và 24 phim chờ gán nhãn. Những con số này mô tả bộ mẫu ban đầu. Sau khi thao tác, màn tiến độ hiển thị trạng thái hiện tại của đơn vị. Ảnh tổng hợp và mã mẫu được tạo sẵn cho diễn tập. Xử lý ẩn danh dữ liệu bệnh viện thật là phần chuẩn bị riêng khi chuyển sang thử nghiệm thực tế.

1. **Chuẩn bị nghiên cứu.** Theo dõi bốn mốc gồm đề cương và kế hoạch ẩn danh, biên bản Hội đồng đạo đức, hồ sơ phân loại thiết bị y tế, đào tạo và phản hồi người đọc. Hệ thống lưu trạng thái đã ghi nhận và thời điểm cập nhật. Mốc Hội đồng cần quyền duyệt. Các mốc còn lại cần quyền cập nhật.
2. **Hoàn thiện nhãn.** Từ các hàng chờ, chuyên viên ghi nhãn và người duyệt chốt hoặc trả lại theo luồng TT 1. Thanh tiến độ dùng số phim lịch sử đã duyệt trên tổng 5.000. Phim chạy song song có chỉ số theo dõi riêng.
3. **Chạy đánh giá.** Nút **Chạy tối đa 25 phim đánh giá** lấy các phim thuộc nhóm **Đánh giá** đã duyệt, đủ chất lượng trong bài tập và chưa có gợi ý. Có thể chạy tiếp để lấy lô kế tiếp. Bảng đối chiếu chỉ tính phim thuộc nhóm **Đánh giá** hoặc **Chạy song song** có cả nhãn đã duyệt và kết quả mô hình.
4. **Đọc kết quả.** Hai ô **Đúng có dấu** và **Đúng không dấu** đếm các kết quả trùng nhãn tương ứng. **Báo dư** là mô hình báo có dấu khi nhãn đã duyệt ghi không có dấu. **Bỏ sót** là tình huống ngược lại. Các số đếm dùng để soát lỗi trên ảnh tổng hợp.
5. **Xuất tài liệu.** Mở **Báo cáo nghiên cứu** trong phân hệ Phim X-quang để xem và xuất báo cáo khoa học, dự thảo biên bản Hội đồng, phiếu chuẩn bị phân loại thiết bị, phiếu đào tạo và phản hồi, hoặc bộ nhãn lịch sử đã duyệt. Mục này cần quyền xuất. Bộ nhãn gồm mã phim, nguồn, nhóm và nhãn. Phim bị loại vì chất lượng có thể xuất hiện với nhãn đã duyệt tương ứng để người nhận nhận biết. Các trường ký, kết luận Hội đồng và kết luận phân loại dành cho đơn vị có thẩm quyền hoàn thiện.

## TT 3 Tiếp nhận dữ liệu HIS, LIS, X-quang, BHXH và VITIMES

Quản trị viên mở **Nguồn bệnh viện**, chọn kỳ tháng và bấm **Nạp mẫu** ở từng nguồn. Khi hoàn tất, thẻ nguồn hiển thị danh sách chỉ tiêu và thời điểm nạp mẫu. **Nạp lại** cập nhật vết của cùng nguồn, kỳ và đơn vị.

| Nguồn       | Mã chỉ tiêu      | Số liệu trả về                                                                 |
| ----------- | ---------------- | ------------------------------------------------------------------------------ |
| HIS         | `BV-01`–`BV-05`  | Lượt khám ngoại trú, ca nhập viện, ca ra viện, ngày giường sử dụng và khả dụng |
| LIS         | `BV-06`          | Lượt xét nghiệm                                                                |
| Máy X-quang | `BV-07`          | Lượt chụp X-quang                                                              |
| Cổng BHXH   | `BV-08`, `BV-09` | Hồ sơ BHYT gửi và hồ sơ bị trả                                                 |
| VITIMES     | `BV-10`, `BV-11` | Ca lao ghi nhận và ca đang điều trị cuối kỳ                                    |

Ở chế độ **Giả lập**, các số tổng hợp có sẵn theo kỳ. Sau khi nạp mẫu, dashboard gắn tên nguồn cho những chỉ tiêu tương ứng của đơn vị, chẳng hạn **Giả lập · HIS**. Cơ sở dữ liệu lưu vết nạp mẫu. Số giả lập được tạo lại từ cùng bộ dữ liệu dùng cho dashboard, báo cáo và trợ lý.

Để kiểm tra luồng nạp số liệu, quản trị viên dùng **Nạp từ Excel** hoặc **Nguồn API** của GDOS. Excel có bước kiểm trước khi ghi. API dùng cấu hình ánh xạ sang mã chỉ tiêu. Kho `chi_tieu_so_lieu` giữ một giá trị cho mỗi bộ **đơn vị, mã chỉ tiêu, tháng**. Nạp lại cùng bộ khóa cập nhật giá trị đang dùng. Xem [ADR-0010 về kho chỉ tiêu](adr/0010-nguon-du-lieu-vao.md).

## TT 4 Điều hành, giao ban và xuất báo cáo

1. Mở **Điều hành → Tổng quan → Bảng điều hành → Bệnh viện**. Chọn tháng và nguồn **Tự động**, **Đã nạp** hoặc **Giả lập**. Ở chế độ Đã nạp, hệ thống đọc số của đơn vị người xem theo đúng kỳ. Chỉ tiêu chưa có số hiện dấu `—`. Giá trị đã nạp bằng `0` vẫn hiển thị là `0`.
2. Đọc bốn thẻ chính gồm lượt khám ngoại trú, ca nhập viện, công suất sử dụng giường và hồ sơ BHYT gửi. So sánh hai kỳ khi cả hai có số cùng loại nguồn. Công suất giường bằng **ngày giường sử dụng ÷ ngày giường khả dụng × 100**, làm tròn một chữ số thập phân. Phép tính cần hai số cùng tháng và cùng loại nguồn, với ngày giường khả dụng lớn hơn 0. Khi chỉ có một trong hai số giường đã nạp, chế độ Tự động dùng công suất tính từ hai số giả lập và ghi nhãn nguồn.
3. Chọn chỉ tiêu để xem sáu tháng lịch liên tiếp đến kỳ đang xem. Mở **Xem bảng chỉ tiêu và nguồn số liệu** để kiểm tra giá trị, đơn vị tính, nguồn và thời điểm cập nhật trước khi xuất báo cáo.
4. Trong **Báo cáo giao ban**, chọn biểu để mở màn báo cáo chung theo tháng và nguồn đang xem. Các báo cáo cũng xuất hiện ở **Điều hành → Báo cáo** theo quyền của phân hệ chủ. Báo cáo Sở Y tế thuộc Báo cáo điều hành, báo cáo BHXH thuộc Hồ sơ BHYT, báo cáo VITIMES thuộc Điều trị lao – phổi. Bấm **Xuất Excel** để lấy dữ liệu đang xem. Tệp toàn số giả lập mang nhãn **DỮ LIỆU GIẢ LẬP** và hậu tố `-gia-lap`. Tệp có cả số đã nạp và giả lập mang nhãn **CÓ DỮ LIỆU GIẢ LẬP** và hậu tố `-co-gia-lap`. Xem [ADR-0007 về đầu mối báo cáo](adr/0007-mot-chu-nhieu-loi-vao.md).

| Nơi nhận | Nội dung bản nháp                                                                 | Vị trí tại phân hệ chủ                                                                                   |
| -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sở Y tế  | Khám ngoại trú, nhập viện, ra viện, giường bệnh, công suất, xét nghiệm và X-quang | Điều hành → Báo cáo → [Báo cáo định kỳ](http://localhost:5174/bc-dinh-ky) → **Bản nháp báo cáo Sở Y tế** |
| BHXH     | Số hồ sơ BHYT gửi và bị trả                                                       | Tác nghiệp → Hồ sơ BHYT → [Báo cáo BHYT](http://localhost:5174/bv-bao-cao-bhyt)                          |
| VITIMES  | Số ca lao ghi nhận và đang điều trị cuối kỳ                                       | Tác nghiệp → Điều trị lao – phổi → [Báo cáo theo dõi lao](http://localhost:5174/bv-bao-cao-lao)          |

Nút tải tạo bản nháp theo yêu cầu. Luồng phát hành chính thức cần biểu mẫu do từng nơi nhận xác nhận và quy trình gửi của bệnh viện.

## TT 5 Rà soát hồ sơ BHYT trước khi gửi

Bản diễn tập có 8 hồ sơ `BHYT-THU-…`. Các tình huống mẫu gồm thiếu mã thẻ, thiếu mã dịch vụ, thẻ hết hiệu lực tại ngày dịch vụ và trùng lượt dịch vụ. Ví dụ, `BHYT-THU-02` có lỗi thiếu mã thẻ ở trạng thái khởi tạo.

Bấm mã hồ sơ hoặc dòng trong bảng để mở chi tiết và đánh dấu hồ sơ đang xem. Trên màn hẹp, GDOS cuộn đến khung chi tiết bên dưới bảng. Bấm **Cần bổ sung** hoặc **Đã gửi giả lập** để áp trạng thái tương ứng. Bấm **Hồ sơ diễn tập** để bỏ lọc trạng thái, hoặc **Xóa lọc** để xóa cả các bộ lọc khác và ô tìm.

| Bước | Người thực hiện và thao tác                                                          | Trạng thái sau bước                                             |
| ---- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1    | Chuyên viên mở hồ sơ **Chờ rà soát** và bấm **Rà soát hồ sơ**.                       | **Cần bổ sung** nếu có lỗi mẫu, **Chờ duyệt** nếu qua kiểm tra. |
| 2    | Với hồ sơ **Cần bổ sung**, chuyên viên đọc lý do và **Áp dụng bản bổ sung mẫu**.     | Quay về **Chờ rà soát** để kiểm tra lại.                        |
| 3    | Người có quyền duyệt xem hồ sơ **Chờ duyệt**, chọn **Duyệt hồ sơ** hoặc **Trả lại**. | **Đã duyệt** hoặc **Cần bổ sung**.                              |
| 4    | Người có quyền cập nhật chọn **Gửi cổng BHXH giả lập** từ hồ sơ **Đã duyệt**.        | **Đã gửi giả lập** và có thông báo nhận.                        |

Rà soát chạy theo quy tắc và lỗi được cài trong bộ mẫu. Nút bổ sung áp dụng bản sửa mẫu đã định sẵn. Cán bộ vẫn là người quyết định duyệt hoặc trả lại. Hồ sơ chưa duyệt bị chặn ở bước gửi.

## TT 6 Tra cứu ca mẫu và soạn thảo giao ban

Người dùng chọn chủ đề, chọn ca mẫu hoặc kỳ báo cáo và bấm **Gửi câu hỏi**. Hệ thống trả kết quả kèm tên nguồn. Người dùng có thể chỉnh nội dung trong ô trả lời rồi bấm **Sao chép nội dung** để sử dụng trong bản nháp.

| Chủ đề                     | Đầu vào           | Kết quả trả về                                                                       |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| Tra mã ICD                 | Ca lao mẫu        | Mã ICD đã lưu trong ca được chọn.                                                    |
| Nhắc theo dõi điều trị lao | Ca lao mẫu        | Các ngày còn cần xác nhận và đầu mối theo dõi.                                       |
| Dự thảo văn bản giao ban   | Tháng báo cáo     | Bản nháp gửi ban điều hành, có lượt khám, ca nhập viện, ca ra viện và nguồn từng số. |
| Hỏi đáp số liệu điều hành  | Tháng và chỉ tiêu | Giá trị, đơn vị tính và nguồn từ bảng điều hành ở chế độ Tự động.                    |

Hai chủ đề về ca lao nằm ở **Điều trị lao – phổi → Tra cứu ca mẫu** và yêu cầu quyền xem của phân hệ đó. Hai chủ đề về giao ban và số liệu nằm ở **Tổng quan → Bảng điều hành → Tra cứu số liệu** và yêu cầu quyền xem Tổng quan. Hệ thống trả lời theo bốn chủ đề định sẵn. Mốc theo dõi là lời nhắc nghiệp vụ để cán bộ kiểm tra hồ sơ. Phần kê đơn và văn bản theo biểu mẫu Bộ Y tế cần yêu cầu và mẫu được duyệt cho triển khai thực tế.

## TT 7 Theo dõi ca lao và đồng bộ VITIMES

Danh sách có 6 ca `LAO-THU-…` với ngày bắt đầu, mã ICD đã có trong hồ sơ, tổ theo dõi và 3 mốc theo dõi mẫu cho mỗi ca.

1. Chuyên viên mở ca đang theo dõi và ghi nhận từng mốc **Đã xác nhận** hoặc **Cần liên hệ lại**. Mốc chưa ghi nhận và mốc cần liên hệ lại xuất hiện trong kết quả hỏi trợ lý về ca đó.
2. Sau khi đã lưu ít nhất một mốc, người có quyền cập nhật có thể bấm **Đồng bộ VITIMES giả lập**. Hệ thống lưu trạng thái, số mốc đã ghi nhận và thời điểm đồng bộ. Nếu sau đó có thay đổi ở ca, lần gửi cũ không còn được hiển thị là bản mới nhất. Người dùng có thể đồng bộ lại.
3. Khi cả ba mốc đều **Đã xác nhận**, người có quyền duyệt bấm **Hoàn tất theo dõi**. Ca chuyển sang **Hoàn tất theo dõi** và khóa cập nhật các mốc. Vẫn có thể đồng bộ trạng thái hoàn tất sang VITIMES giả lập.

## Điểm kiểm soát và kết quả kiểm thử

- **Quyền và phạm vi.** Các thao tác đọc, sửa, duyệt và xuất được kiểm ở API theo quyền phân hệ. Bảng `benh_vien_thu` lưu trạng thái theo đơn vị, áp dụng RLS và ghi nhật ký. Kiểm thử đã xác nhận đơn vị khác không đọc được vết của đơn vị đang diễn tập và vai ứng dụng không có quyền xóa cứng. Xem [ADR-0004](adr/0004-postgres-rls-nhat-ky.md).
- **Kiểm thử nghiệp vụ.** Đã kiểm các tình huống chặn nhận phim khi chưa ghi nhận mốc đạo đức, chặn đối chiếu trước khi duyệt nhãn, chặn gửi BHYT trước khi duyệt, và chặn hoàn tất theo dõi khi còn mốc chưa xác nhận. Xem [kiểm thử tích hợp bệnh viện](../apps/api/src/benh-vien/benh-vien.e2e.test.ts).
- **Kiểm thử trên localhost.** Đã áp dụng migration `0033_benh-vien-thu`, thao tác các luồng chính trên trình duyệt và kiểm tra tải báo cáo Excel. Sau đợt rà soát ADR, `VITEST_MAX_WORKERS=1 pnpm kiem-tra` đạt 390 bài test và build. Xem [ghi nhận tiến độ](tien-do.md).

## Điều kiện chuyển sang triển khai thực tế

Đội bệnh viện cần xác nhận đầu mối, phạm vi dữ liệu và đặc tả kết nối của thiết bị X-quang, HIS, LIS, BHXH và VITIMES. Phần nghiên cứu X-quang cần quy trình ẩn danh và gán nhãn được phê duyệt, dữ liệu được phép sử dụng, mô hình đã thẩm định và hồ sơ phân loại theo quy trình chính thức. Phần báo cáo và trợ lý cần biểu mẫu, lịch gửi và phạm vi nội dung được đơn vị sử dụng xác nhận.
