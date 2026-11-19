# Báo cáo triển khai và quy trình nghiệp vụ bệnh viện

GDOS đã triển khai **bản diễn tập cho cả 7 hạng mục** trong `YC_BenhVien.xlsx`, `Sheet1`, dòng TT 1–7. Báo cáo này giúp đội bệnh viện và kỹ thuật đối chiếu thao tác trên màn hình, trách nhiệm của từng vai, điều kiện chuyển trạng thái và đầu ra của từng luồng.

Phiên bản được mô tả nằm trên nhánh `feat/dashboard-benh-vien-hang-muc-2`, commit `4141abc`. Bản diễn tập sử dụng ảnh do phần mềm tạo, mã hồ sơ mẫu và kết nối giả lập. Các kết quả X-quang phản ánh khả năng xử lý ảnh tổng hợp của mô hình thử. Báo cáo xuất ra là bản nháp để đối soát.

## Màn hình và người thực hiện

| TT  | Nghiệp vụ                         | Màn hình trên localhost                                             | Người thực hiện chính                                  |
| --- | --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Nhận và đọc thử phim X-quang      | [Kho phim và gán nhãn](http://localhost:5174/bv-phim)               | Chuyên viên đọc phim, người duyệt nhãn                 |
| 2   | Gán nhãn và lập hồ sơ nghiên cứu  | [Hồ sơ nghiên cứu](http://localhost:5174/bv-nghien-cuu)             | Chuyên viên nghiên cứu, người duyệt, người xuất hồ sơ  |
| 3   | Tiếp nhận nguồn dữ liệu bệnh viện | [Nguồn bệnh viện](http://localhost:5174/bv-ket-noi)                 | Quản trị viên có quyền cập nhật nguồn                  |
| 4   | Điều hành, giao ban và báo cáo    | [Bảng điều hành](http://localhost:5174/dh-bang-dieu-hanh#benh-vien) | Người có quyền xem Tổng quan                           |
| 5   | Rà soát BHYT trước khi gửi        | [Rà soát trước khi gửi](http://localhost:5174/bv-bhyt)              | Chuyên viên rà soát, người duyệt, người có quyền xuất  |
| 6   | Tra cứu và soạn thảo              | [Trợ lý bệnh viện](http://localhost:5174/bv-tro-ly)                 | Người có quyền dùng trợ lý và đọc nguồn liên quan      |
| 7   | Theo dõi ca lao và đồng bộ        | [Theo dõi ca điều trị](http://localhost:5174/bv-lao)                | Chuyên viên theo dõi, người duyệt, người có quyền xuất |

Trong GDOS, chuyên viên có quyền cập nhật trong phạm vi được phân công, còn lãnh đạo có quyền duyệt trong phạm vi được phân công. Cờ quản trị cấp quyền cho các chức năng quản trị như **Nguồn dữ liệu vào**. Tài khoản dev có cả hai vai nghiệp vụ và cờ quản trị nên có thể diễn tập liên tục các bước. Khi kiểm tra phân quyền, dùng các tài khoản có vai riêng. Xem [ADR-0006 về vai và phân công](adr/0006-vai-tro-khoi-chinh-phu.md).

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
5. **Xuất tài liệu.** Người có quyền xuất tải được báo cáo khoa học, dự thảo biên bản Hội đồng, phiếu chuẩn bị phân loại thiết bị, phiếu đào tạo và phản hồi, hoặc bộ nhãn lịch sử đã duyệt. Bộ nhãn gồm mã phim, nguồn, nhóm và nhãn. Phim bị loại vì chất lượng có thể xuất hiện với nhãn đã duyệt tương ứng để người nhận nhận biết. Các trường ký, kết luận Hội đồng và kết luận phân loại dành cho đơn vị có thẩm quyền hoàn thiện.

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

1. Mở **Điều hành → Tổng quan → Bảng điều hành → Bệnh viện**. Chọn tháng và nguồn **Giả lập** hoặc **Đã nạp**. Ở chế độ Đã nạp, hệ thống đọc số của đơn vị người xem theo đúng kỳ. Chỉ tiêu chưa có số hiện dấu `—`. Giá trị đã nạp bằng `0` vẫn hiển thị là `0`.
2. Đọc bốn thẻ chính gồm lượt khám ngoại trú, ca nhập viện, công suất sử dụng giường và hồ sơ BHYT gửi. Hệ thống so sánh với tháng trước khi cả hai tháng có số. Công suất giường bằng **ngày giường sử dụng ÷ ngày giường khả dụng × 100**, làm tròn một chữ số thập phân. Phép tính cần đủ hai số cùng tháng và ngày giường khả dụng phải lớn hơn 0.
3. Chọn chỉ tiêu để xem sáu tháng lịch liên tiếp đến kỳ đang xem. Mở **Xem bảng chỉ tiêu và nguồn số liệu** để kiểm tra giá trị, đơn vị tính và nguồn trước khi xuất báo cáo.
4. Trong **Báo cáo giao ban**, chọn biểu cần tải. Mỗi biểu hiển thị số chỉ tiêu đã có số. Khi có dữ liệu cho biểu, hệ thống tạo tệp Excel theo tháng và nguồn đang chọn. Tệp giả lập mang nhãn **DỮ LIỆU GIẢ LẬP** và tên tệp có hậu tố `-gia-lap`.

| Nơi nhận | Nội dung bản nháp                                                                 |
| -------- | --------------------------------------------------------------------------------- |
| Sở Y tế  | Khám ngoại trú, nhập viện, ra viện, giường bệnh, công suất, xét nghiệm và X-quang |
| BHXH     | Số hồ sơ BHYT gửi và bị trả                                                       |
| VITIMES  | Số ca lao ghi nhận và đang điều trị cuối kỳ                                       |

Nút tải tạo bản nháp theo yêu cầu. Luồng phát hành chính thức cần biểu mẫu do từng nơi nhận xác nhận và quy trình gửi của bệnh viện.

## TT 5 Rà soát hồ sơ BHYT trước khi gửi

Bản diễn tập có 8 hồ sơ `BHYT-THU-…`. Các tình huống mẫu gồm thiếu mã thẻ, thiếu mã dịch vụ, thẻ hết hiệu lực tại ngày dịch vụ và trùng lượt dịch vụ. Ví dụ, `BHYT-THU-02` có lỗi thiếu mã thẻ ở trạng thái khởi tạo.

| Bước | Người thực hiện và thao tác                                                          | Trạng thái sau bước                                             |
| ---- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1    | Chuyên viên mở hồ sơ **Chờ rà soát** và bấm **Rà soát hồ sơ**.                       | **Cần bổ sung** nếu có lỗi mẫu, **Chờ duyệt** nếu qua kiểm tra. |
| 2    | Với hồ sơ **Cần bổ sung**, chuyên viên đọc lý do và **Áp dụng bản bổ sung mẫu**.     | Quay về **Chờ rà soát** để kiểm tra lại.                        |
| 3    | Người có quyền duyệt xem hồ sơ **Chờ duyệt**, chọn **Duyệt hồ sơ** hoặc **Trả lại**. | **Đã duyệt** hoặc **Cần bổ sung**.                              |
| 4    | Người có quyền xuất chọn **Gửi cổng BHXH giả lập** từ hồ sơ **Đã duyệt**.            | **Đã gửi giả lập** và có thông báo nhận.                        |

Rà soát chạy theo quy tắc và lỗi được cài trong bộ mẫu. Nút bổ sung áp dụng bản sửa mẫu đã định sẵn. Cán bộ vẫn là người quyết định duyệt hoặc trả lại. Hồ sơ chưa duyệt bị chặn ở bước gửi.

## TT 6 Tra cứu với trợ lý bệnh viện

Người dùng chọn chủ đề, chọn ca mẫu hoặc kỳ báo cáo và bấm **Gửi câu hỏi**. Hệ thống trả kết quả kèm tên nguồn. Người dùng có thể chỉnh nội dung trong ô trả lời rồi bấm **Sao chép nội dung** để sử dụng trong bản nháp.

| Chủ đề                     | Đầu vào           | Kết quả trả về                                                        |
| -------------------------- | ----------------- | --------------------------------------------------------------------- |
| Tra mã ICD                 | Ca lao mẫu        | Mã ICD đã lưu trong ca được chọn.                                     |
| Nhắc theo dõi điều trị lao | Ca lao mẫu        | Các ngày còn cần xác nhận và đầu mối theo dõi.                        |
| Dự thảo văn bản giao ban   | Tháng báo cáo     | Bản nháp gửi ban điều hành, có lượt khám, ca nhập viện và ca ra viện. |
| Hỏi đáp số liệu điều hành  | Tháng và chỉ tiêu | Giá trị và đơn vị tính từ cùng bộ dữ liệu giả lập của dashboard.      |

Hai chủ đề về ca lao yêu cầu quyền xem **Điều trị lao – phổi**. Hai chủ đề về giao ban và số liệu yêu cầu quyền xem **Tổng quan**. Trợ lý bản diễn tập trả lời theo bốn chủ đề định sẵn. Mốc theo dõi là lời nhắc nghiệp vụ để cán bộ kiểm tra hồ sơ. Phần kê đơn và văn bản theo biểu mẫu Bộ Y tế cần yêu cầu và mẫu được duyệt cho triển khai thực tế.

## TT 7 Theo dõi ca lao và đồng bộ VITIMES

Danh sách có 6 ca `LAO-THU-…` với ngày bắt đầu, mã ICD đã có trong hồ sơ, tổ theo dõi và 3 mốc theo dõi mẫu cho mỗi ca.

1. Chuyên viên mở ca đang theo dõi và ghi nhận từng mốc **Đã xác nhận** hoặc **Cần liên hệ lại**. Mốc chưa ghi nhận và mốc cần liên hệ lại xuất hiện trong kết quả hỏi trợ lý về ca đó.
2. Sau khi đã lưu ít nhất một mốc, người có quyền xuất có thể bấm **Đồng bộ VITIMES giả lập**. Hệ thống lưu trạng thái, số mốc đã ghi nhận và thời điểm đồng bộ. Nếu sau đó có thay đổi ở ca, lần gửi cũ không còn được hiển thị là bản mới nhất. Người dùng có thể đồng bộ lại.
3. Khi cả ba mốc đều **Đã xác nhận**, người có quyền duyệt bấm **Hoàn tất theo dõi**. Ca chuyển sang **Hoàn tất theo dõi** và khóa cập nhật các mốc. Vẫn có thể đồng bộ trạng thái hoàn tất sang VITIMES giả lập.

## Điểm kiểm soát và kết quả kiểm thử

- **Quyền và phạm vi.** Các thao tác đọc, sửa, duyệt và xuất được kiểm ở API theo quyền phân hệ. Bảng `benh_vien_thu` lưu trạng thái theo đơn vị, áp dụng RLS và ghi nhật ký. Kiểm thử đã xác nhận đơn vị khác không đọc được vết của đơn vị đang diễn tập và vai ứng dụng không có quyền xóa cứng. Xem [ADR-0004](adr/0004-postgres-rls-nhat-ky.md).
- **Kiểm thử nghiệp vụ.** Đã kiểm các tình huống chặn nhận phim khi chưa ghi nhận mốc đạo đức, chặn đối chiếu trước khi duyệt nhãn, chặn gửi BHYT trước khi duyệt, và chặn hoàn tất theo dõi khi còn mốc chưa xác nhận. Xem [kiểm thử tích hợp bệnh viện](../apps/api/src/benh-vien/benh-vien.e2e.test.ts).
- **Kiểm thử trên localhost.** Đã áp dụng migration `0033_benh-vien-thu`, thao tác các luồng chính trên trình duyệt và kiểm tra tải báo cáo Excel. Lần chạy `VITEST_MAX_WORKERS=1 pnpm kiem-tra` của bản triển khai đạt 389 bài test. Xem [ghi nhận tiến độ](tien-do.md).

## Điều kiện chuyển sang triển khai thực tế

Đội bệnh viện cần xác nhận đầu mối, phạm vi dữ liệu và đặc tả kết nối của thiết bị X-quang, HIS, LIS, BHXH và VITIMES. Phần nghiên cứu X-quang cần quy trình ẩn danh và gán nhãn được phê duyệt, dữ liệu được phép sử dụng, mô hình đã thẩm định và hồ sơ phân loại theo quy trình chính thức. Phần báo cáo và trợ lý cần biểu mẫu, lịch gửi và phạm vi nội dung được đơn vị sử dụng xác nhận.
