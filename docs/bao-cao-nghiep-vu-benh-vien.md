# Báo cáo nghiệp vụ chuẩn và quy trình vận hành 7 hạng mục bệnh viện thông minh (GDOS Y Tế)

Báo cáo này chuẩn hóa toàn bộ nghiệp vụ, luồng dữ liệu, quy trình thao tác và phân quyền cho **7 hạng mục** trong tài liệu yêu cầu bệnh viện [YC_BenhVien.xlsx](file:///home/tuna/learn/fork-from-dao-tao/YC_BenhVien.xlsx), dựa trên khảo sát thực tế chuyên sâu từ hệ thống chuyên khoa của **Bệnh viện Phổi Long An** ([docs/khao-sat-chi-tiet-bv-phoi-long-an.md](file:///home/tuna/learn/fork-from-dao-tao/docs/khao-sat-chi-tiet-bv-phoi-long-an.md)) và kiến trúc giải pháp chuẩn hóa [docs/trien-khai-7-hang-muc-chuan-benh-vien.md](file:///home/tuna/learn/fork-from-dao-tao/docs/trien-khai-7-hang-muc-chuan-benh-vien.md).

Tất cả các tính năng đã được triển khai mã nguồn hoàn chỉnh trong nền tảng GDOS, vượt qua toàn bộ quy trình kiểm thử tự động, hoạt động ổn định trên cơ sở dữ liệu nhúng **PGlite** (tiết kiệm tài nguyên) và sẵn sàng chuyển tiếp sang môi trường vận hành bệnh viện.

---

## 1. Tổng hợp hiện trạng triển khai 7 hạng mục

| TT    | Hạng mục nghiệp vụ                                                                         | Căn cứ pháp lý & Chuẩn y tế                                                                      | Hiện trạng mã nguồn GDOS                                                                                                                                                                   | Vị trí màn hình / URL                                                                                                                                                    |
| :---- | :----------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Nghiên cứu & thử nghiệm AI đọc X-quang phổi** (BV + xe lưu động, đọc song song)          | • QĐ 488/QĐ-BYT (Hướng dẫn chẩn đoán lao)<br>• Chuẩn ảnh DICOM 3.0                               | Đã triển khai quy trình đọc song song, nhận lô từ BV & xe lưu động, hiển thị thông tin lâm sàng, định vị vùng tổn thương & điểm tin cậy AI.                                                | Nghiệp vụ → Tác nghiệp → Phim X-quang → [Kho phim và gán nhãn](http://localhost:5174/bv-phim)                                                                            |
| **2** | **Gán nhãn 5.000 phim lịch sử & Hồ sơ nghiên cứu** (Đạo đức, SaMD, Báo cáo)                | • Thông tư 04/2020/TT-BYT (Hội đồng đạo đức)<br>• Nghị định 98/2021/NĐ-CP (Quản lý TBYT)         | Quản trị tập 5.000 phim ẩn danh, công cụ gán nhãn, ma trận đối chiếu (Confusion matrix), theo dõi 4 mốc nghiên cứu và kết xuất hồ sơ SaMD.                                                 | Nghiệp vụ → Tác nghiệp → Phim X-quang → [Hồ sơ nghiên cứu](http://localhost:5174/bv-nghien-cuu) & [Báo cáo](http://localhost:5174/bv-bao-cao-phim)                       |
| **3** | **Kho dữ liệu & Lớp API kết nối 5 nguồn y tế** (HIS, LIS, X-quang, BHXH, VITIMES)          | • Chuẩn HL7 v2/v3, ASTM E1381<br>• Cổng tiếp nhận BHXH & API CTCLQG                              | Lớp API kết nối đa giao thức: REST (HIS), ASTM/HL7 (LIS), DICOM Query/Retrieve (PACS), XML QĐ 130 (BHXH), REST API (VITIMES).                                                              | Quản trị hệ thống → Kết nối → [Nguồn bệnh viện](http://localhost:5174/bv-ket-noi) & [Nguồn dữ liệu vào](http://localhost:5174/nd-excel)                                  |
| **4** | **Bảng điều hành, giao ban, KPI & Báo cáo** (Sở Y tế – BHXH – VITIMES)                     | • QĐ 407/QĐ-BYT (Bộ tiêu chí đánh giá BV)<br>• Chuẩn chỉ tiêu thống kê y tế                      | Bảng điều hành giám sát 11 chỉ tiêu y tế theo thời gian thực (BV-01 đến BV-11), công suất giường bệnh, xu hướng 6 tháng, tự động xuất 3 mẫu báo cáo Excel.                                 | Nghiệp vụ → Điều hành → Tổng quan → [Bảng điều hành](http://localhost:5174/dh-bang-dieu-hanh#benh-vien) & [Báo cáo](http://localhost:5174/bc-dinh-ky)                    |
| **5** | **AI hỗ trợ rà soát hồ sơ BHYT trước khi gửi**                                             | • Quyết định 130/QĐ-BYT (Chuẩn dữ liệu KCB BHYT)<br>• Cổng giám định BHYT                        | Rà soát tiền kiểm bảng kê XML QĐ 130; phát hiện sai mã thẻ, mã dịch vụ, trùng lặp dịch vụ; phân loại rủi ro xuất toán (Cao/Trung bình/Thấp); AI gợi ý hướng xử lý.                         | Nghiệp vụ → Tác nghiệp → Hồ sơ BHYT → [Rà soát trước khi gửi](http://localhost:5174/bv-bhyt)                                                                             |
| **6** | **Trợ lý AI hỗ trợ lâm sàng – hành chính** (ICD, nhắc đơn thuốc lao, văn bản BYT, hỏi đáp) | • Thông tư 46/2018/TT-BYT (Hồ sơ bệnh án điện tử)<br>• Hướng dẫn chẩn đoán & điều trị lao CTCLQG | Trợ lý chuyên khoa: Tra cứu ICD-10; Kiểm tra đơn thuốc chống lao & tương tác thuốc (AST/ALT); Soạn thảo Tóm tắt bệnh án ra viện mẫu TT 46; Hỏi đáp số liệu điều hành.                      | Nghiệp vụ → Tác nghiệp → Lao – phổi → [Trợ lý chuyên khoa](http://localhost:5174/bv-tro-ly) & [Tra cứu số liệu](http://localhost:5174/dh-bang-dieu-hanh#tra-cuu-so-lieu) |
| **7** | **Phân hệ quản lý điều trị Lao – Phổi kết nối VITIMES**                                    | • Hướng dẫn quản lý điều trị lao CTCLQG<br>• Phần mềm quản lý thông tin lao VITIMES              | Quản lý ca bệnh chuyên khoa: Phân loại ca (Mới, Tái phát, Kháng thuốc MDR), Thể bệnh (AFB(+)/(-)), Phác đồ điều trị, Lịch xét nghiệm đờm T2/T5/T6, Tuân thủ DOTS, Đồng bộ 2 chiều VITIMES. | Nghiệp vụ → Tác nghiệp → Điều trị lao – phổi → [Theo dõi ca điều trị](http://localhost:5174/bv-lao)                                                                      |

---

## 2. Quy trình nghiệp vụ chi tiết & Thao tác trên GDOS

### TT 1: Nghiên cứu, phát triển và thử nghiệm AI hỗ trợ đọc X-quang phổi

#### 1. Bối cảnh lâm sàng & Mục tiêu

- **Mục tiêu**: Hỗ trợ bác sĩ chẩn đoán hình ảnh phát hiện sớm các dấu hiệu nghi lao và bệnh phổi (nốt mờ, thâm nhiễm, xơ hóa, tạo hang, đông đặc, tràn dịch màng phổi) trên ảnh chụp X-quang ngực thẳng.
- **Phạm vi triển khai**: Kết hợp song song giữa máy X-quang cố định tại khoa Chẩn đoán hình ảnh bệnh viện và xe X-quang kỹ thuật số lưu động phục vụ chiến dịch tầm soát lao chủ động (chiến lược 2X: X-quang & GeneXpert) trong cộng đồng.
- **Nguyên tắc an toàn y tế**: AI hoạt động như một công cụ hỗ trợ ra quyết định (Clinical Decision Support - CDS). Bác sĩ luôn là người chịu trách nhiệm chuyên môn cuối cùng. Thực hiện mô hình **đọc song song độc lập (Double reading)**: Bác sĩ đưa ra nhận định lâm sàng trước, sau đó đối chiếu với gợi ý của mô hình AI để tránh hiện tượng thiên kiến tự động (automation bias).

#### 2. Dữ liệu & Luồng trạng thái

- Mỗi ca chụp bao gồm: Mã phim (`XQ-xxxx`), Mã chỉ định HIS (`HIS-XQ-xxxx`), Họ tên bệnh nhân, Tuổi, Khoa chỉ định, Nguồn chụp (`benh-vien` hoặc `xe-luu-dong`), Nhóm dữ liệu (`Học`, `Đánh giá`, hoặc `Chạy song song`).
- Chu trình xử lý 3 trạng thái:
  1. `cho-nhan` (Chờ nhận định): Bác sĩ chuyên khoa xem hình ảnh, thông tin lâm sàng và ghi nhận nhãn:
     - `khong-co-dau`: Không phát hiện tổn thương nghi lao.
     - `co-dau`: Có tổn thương nghi ngờ (kèm phân vùng giải phẫu).
     - `khong-doc`: Phim hỏng kỹ thuật, lỗi tư thế, dị vật cắt cụt đỉnh/góc sườn hoành.
  2. `cho-duyet` (Chờ duyệt): Chuyển lên Trưởng khoa CĐHA hoặc người giám sát chuyên môn để xác nhận nhãn chuẩn.
  3. `da-duyet` (Đã duyệt): Khóa nhãn chuyên môn; cho phép kích hoạt mô hình AI để đối chiếu gợi ý, phân tích danh sách tổn thương tự động và tính điểm tin cậy (Confidence score).

#### 3. Bảng điều khiển KPI trên giao diện

Màn hình [Kho phim và gán nhãn](http://localhost:5174/bv-phim) hiển thị 4 thẻ KPI thời gian thực:

- **Tổng số phim**: Toàn bộ phim trong kho lưu trữ của đơn vị.
- **Chờ dán nhãn**: Các ca chụp mới đẩy từ máy X-quang/PACS chưa được bác sĩ đọc.
- **Chờ duyệt nhãn**: Các ca đã dán nhãn sơ bộ cần trưởng khoa phê duyệt.
- **Tỷ lệ đồng thuận AI**: Tỷ lệ phần trăm các ca có sự trùng khớp hoàn toàn giữa kết luận của bác sĩ đã duyệt và dự đoán của mô hình AI.

---

### TT 2: Gán nhãn 5.000 phim lịch sử, Hội đồng đạo đức & Hồ sơ thiết bị y tế (SaMD)

#### 1. Quản lý tập dữ liệu vàng (Gold Standard Dataset)

- Hệ thống quản lý cơ sở dữ liệu **5.000 phim X-quang lịch sử** đã được ẩn danh hoàn toàn (De-identified) theo quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).
- Mọi trường định danh trực tiếp (Tên thật, số CMND/CCCD, địa chỉ, số điện thoại) được bóc tách và mã hóa bằng định danh nghiên cứu đồng nhất.

#### 2. Theo dõi 4 mốc nghiên cứu khoa học

Tại màn hình [Hồ sơ nghiên cứu](http://localhost:5174/bv-nghien-cuu), lãnh đạo đề tài theo dõi và cập nhật tiến độ:

1. **Đề cương và kế hoạch ẩn danh**: Đề cương nghiên cứu chi tiết, quy chuẩn gán nhãn đa chuyên gia (Consensus reading).
2. **Biên bản Hội đồng đạo đức**: Phê duyệt chấp thuận của Hội đồng đạo đức trong nghiên cứu y sinh học cấp cơ sở/Bộ Y tế (Yêu cầu tài khoản có quyền duyệt `APPROVE`).
3. **Hồ sơ phân loại thiết bị y tế**: Báo cáo kỹ thuật phân loại phần mềm như một trang thiết bị y tế (Software as a Medical Device - SaMD) theo quy chuẩn Nghị định 98/2021/NĐ-CP (nhóm B hoặc C tùy chỉ định hỗ trợ sàng lọc hoặc chẩn đoán).
4. **Đào tạo sử dụng và phản hồi của người đọc**: Nhật ký tập huấn bác sĩ, kỹ thuật viên và khảo sát độ hài lòng của nhân viên y tế.

#### 3. Ma trận đối chiếu khoa học (Confusion Matrix)

Hệ thống tự động tính toán các chỉ số thống kê giá trị chẩn đoán:

- **Đúng có dấu (True Positive - TP)**: AI và Bác sĩ cùng xác nhận có tổn thương.
- **Đúng không dấu (True Negative - TN)**: AI và Bác sĩ cùng xác nhận bình thường.
- **Báo dư (False Positive - FP)**: AI cảnh báo có tổn thương nhưng Bác sĩ kết luận bình thường (nguy cơ chỉ định xét nghiệm GeneXpert quá mức).
- **Bỏ sót (False Negative - FN)**: AI kết luận bình thường nhưng Bác sĩ phát hiện tổn thương (nguy cơ lọt bệnh trong cộng đồng).
- Từ các chỉ số trên, hệ thống tính toán Độ nhạy (Sensitivity), Độ đặc hiệu (Specificity), Giá trị dự báo dương tính (PPV) và Giá trị dự báo âm tính (NPV).

#### 4. Kết xuất tài liệu khoa học

Cho phép xuất file Excel và biên bản tài liệu chuẩn bị nghiệm thu đề tài tại [Báo cáo nghiên cứu](http://localhost:5174/bv-bao-cao-phim).

---

### TT 3: Kho dữ liệu bệnh viện & Lớp kết nối API đa nguồn

#### 1. Nguyên tắc kiến trúc kho dữ liệu

- Tuân thủ thiết kế **Một kho dữ liệu tập trung (Single Source of Truth)** theo ADR-0010.
- Lớp kết nối API đóng vai trò Adapter trung gian, thu nhận dữ liệu từ các phần mềm chuyên môn y tế phân tán trong bệnh viện, chuẩn hóa về bảng chỉ tiêu thống nhất (`chi_tieu_so_lieu`), phục vụ đồng thời cho Bảng điều hành giám đốc, Trợ lý AI và các báo cáo tự động.

#### 2. Đặc tả giao thức kết nối 5 nguồn y tế

Tại màn hình [Nguồn bệnh viện](http://localhost:5174/bv-ket-noi), hệ thống phân định rõ giao thức chuẩn:

| Nguồn hệ thống                          | Giao thức chuẩn hóa                                   | Chỉ tiêu thu nhận                                                                                                                       | Cơ chế đồng bộ                                                                         |
| :-------------------------------------- | :---------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **HIS (Hospital Information System)**   | REST API (JSON) qua HTTPS nội bộ có mTLS              | `BV-01` (Khám ngoại trú)<br>`BV-02` (Nhập viện)<br>`BV-03` (Ra viện)<br>`BV-04` (Ngày giường sử dụng)<br>`BV-05` (Ngày giường khả dụng) | Định kỳ cuối ngày hoặc truy vấn on-demand theo tháng.                                  |
| **LIS (Laboratory Information System)** | ASTM E1381/E1394 hoặc HL7 v2.5 MSH/ORU                | `BV-06` (Tổng lượt xét nghiệm sinh hóa, huyết học, vi sinh, đờm AFB)                                                                    | Kết nối Socket TCP/IP qua cổng trung gian của máy xét nghiệm tự động.                  |
| **Máy X-quang / PACS**                  | DICOM 3.0 (C-FIND, C-MOVE, C-STORE, WADO-RS)          | `BV-07` (Lượt chụp X-quang)                                                                                                             | Lắng nghe trực tiếp từ PACS server hoặc máy chụp kỹ thuật số.                          |
| **Cổng tiếp nhận BHXH**                 | REST API gửi/nhận gói XML chuẩn Quyết định 130/QĐ-BYT | `BV-08` (Hồ sơ gửi giám định)<br>`BV-09` (Hồ sơ bị từ chối/xuất toán)                                                                   | Ký số token HSM/USB Token và gửi cổng tiếp nhận dữ liệu BHXH Việt Nam.                 |
| **Hệ thống VITIMES**                    | REST API Chương trình Chống lao Quốc gia (CTCLQG)     | `BV-10` (Ca lao mới phát hiện)<br>`BV-11` (Ca lao đang quản lý điều trị cuối kỳ)                                                        | Tích hợp xác thực OAuth2 / Bearer Token với máy chủ cơ sở dữ liệu bệnh lao trung ương. |

---

### TT 4: Bảng điều hành, giao ban, KPI & Báo cáo tự động

#### 1. Giám sát điều hành bệnh viện thời gian thực

Màn hình [Bảng điều hành bệnh viện](http://localhost:5174/dh-bang-dieu-hanh#benh-vien) trực quan hóa các chỉ số hoạt động then chốt:

- **Lượt khám ngoại trú**: Theo dõi áp lực tiếp nhận tại Khoa Khám bệnh.
- **Lượt điều trị nội trú & Nhập viện**: Theo dõi luồng bệnh nhân vào các khoa lâm sàng (Lao 1, Lao 2, Hô hấp, Hồi sức cấp cứu).
- **Công suất sử dụng giường bệnh (%)**:
  $$\text{Công suất giường} = \frac{\text{Ngày giường sử dụng (BV-04)}}{\text{Ngày giường khả dụng (BV-05)}} \times 100\%$$
  Tự động đổi màu cảnh báo: Xanh lá (75%–90% - tối ưu), Vàng (<75% - lãng phí công suất), Đỏ (>95% - quá tải giường bệnh).
- **Hồ sơ gửi BHYT**: Theo dõi tiến độ thanh quyết toán với cơ quan bảo hiểm.

#### 2. Biểu đồ xu hướng và phân tích 3 chế độ

- Biểu đồ cột thể hiện xu hướng biến động 6 tháng liên tiếp giúp Ban Giám đốc phát hiện chu kỳ mùa bệnh hô hấp.
- Hỗ trợ 3 chế độ nguồn dữ liệu:
  - **Tự động**: Ưu tiên số liệu nạp thật từ HIS/LIS, bù đắp chỉ tiêu còn thiếu bằng mô phỏng để bảo đảm liền mạch báo cáo.
  - **Đã nạp**: Chỉ hiển thị các con số thực tế có xác nhận nguồn và thời gian đồng bộ.
  - **Giả lập**: Phục vụ công tác diễn tập quy trình và đào tạo cán bộ mới.

#### 3. Tự động kết xuất 3 mẫu báo cáo Excel chuẩn

Từ số liệu điều hành, hệ thống cho phép xuất file Excel định dạng chuẩn chỉ với 1 cú click:

1. **Báo cáo Sở Y tế**: Tổng hợp chuyên môn hoạt động KCB toàn viện, cơ cấu mặt bệnh, công suất sử dụng giường.
2. **Báo cáo BHXH**: Thống kê số lượng hồ sơ đề nghị thanh toán, tỷ lệ hồ sơ hợp lệ, cảnh báo tỷ lệ từ chối.
3. **Báo cáo VITIMES**: Thống kê hoạt động phát hiện và thu nhận bệnh nhân lao gửi Chương trình Chống lao tỉnh/Quốc gia.

---

### TT 5: AI hỗ trợ rà soát hồ sơ BHYT trước khi gửi (QĐ 130/QĐ-BYT)

#### 1. Mục tiêu và nghiệp vụ tiền kiểm (Pre-audit)

- Ngăn ngừa tình trạng **xuất toán BHYT** do sai sót kỹ thuật hành chính và chỉ định dịch vụ không phù hợp.
- Tự động quét toàn bộ các bảng dữ liệu XML theo Quyết định 130/QĐ-BYT (Bảng 1: Tổng hợp chi phí KCB; Bảng 2: Chi tiết thuốc; Bảng 3: Chi tiết dịch vụ kỹ thuật và vật tư y tế).

#### 2. Bộ quy tắc kiểm tra chuyên sâu

Hệ thống tự động phát hiện 4 nhóm lỗi phổ biến:

1. **Lỗi thẻ BHYT**: Thiếu mã thẻ, mã thẻ không đúng định dạng (15 ký tự), thẻ hết hạn sử dụng tại thời điểm chỉ định dịch vụ, không khớp thông tin hành chính với Cổng tra cứu BHXH.
2. **Lỗi danh mục kỹ thuật**: Mã dịch vụ chưa được phê duyệt trong danh mục kỹ thuật được BHYT thanh toán của bệnh viện, sai mã tương đương Bộ Y tế.
3. **Lỗi trùng lặp**: Trùng lượt khám, trùng chỉ định kỹ thuật cùng loại (ví dụ: chụp X-quang 2 lần trong cùng ngày mà không có biên bản hội chẩn hoặc ghi chú lý do diễn biến cấp tính).
4. **Lỗi tỷ lệ thanh toán & Định mức**: Áp sai mức hưởng BHYT (80%, 95%, 100%), tính vượt số ngày giường thực tế.

#### 3. Phân tầng rủi ro & Đề xuất AI

Tại màn hình [Rà soát hồ sơ BHYT](http://localhost:5174/bv-bhyt):

- Phân loại trực quan mức độ rủi ro xuất toán:
  - `cao` (Huy hiệu đỏ): Chắc chắn bị cổng giám định từ chối (thiếu thẻ, hết hạn, trùng lặp kỹ thuật nặng).
  - `trung-binh` (Huy hiệu vàng): Cần kiểm tra lại hồ sơ bệnh án hoặc bổ sung chứng từ kèm theo.
  - `thap` (Huy hiệu xanh): Hồ sơ chuẩn hóa, đầy đủ thông tin, sẵn sàng ký số gửi cổng.
- **Khối đề xuất AI**: Phân tích chi tiết nguyên nhân lỗi và hướng dẫn nhân viên giám định BHYT phương án xử lý nhanh (ví dụ: _"Bổ sung mã thẻ BHYT hợp lệ từ cơ sở dữ liệu tra cứu cổng BHXH"_, _"Áp dụng mã dịch vụ chuẩn danh mục Bộ Y tế: DV-MAU-XQ"_).
- Phân định rõ thẩm quyền: Chuyên viên rà soát và bổ sung thông tin → Lãnh đạo phòng KHTH/Giám định duyệt hồ sơ → Người có thẩm quyền ký số gửi cổng giám định.

---

### TT 6: Trợ lý AI hỗ trợ lâm sàng & Hành chính bệnh viện

Hệ thống tích hợp trợ lý AI chuyên khoa sâu tại [Trợ lý lâm sàng – hành chính](http://localhost:5174/bv-tro-ly) với 4 nhóm năng lực:

#### 1. Tra cứu danh mục mã bệnh ICD-10 chuyên khoa

- Hỗ trợ bác sĩ tra cứu nhanh và chính xác mã bệnh theo chuẩn ICD-10 của WHO và Bộ Y tế:
  - Lao hô hấp có xác định vi khuẩn học/mô bệnh học: `A15` (A15.0 - Lao phổi soi đờm trực tiếp dương tính, A15.1 - Lao phổi cấy đờm dương tính, A15.2 - Lao phổi khẳng định mô bệnh học...).
  - Lao hô hấp không xác định vi khuẩn học: `A16` (A16.0 - Lao phổi AFB âm tính, A16.2 - Lao phổi không đề cập đến vi khuẩn học).
  - Các bệnh phổi đồng mắc: Bệnh phổi tắc nghẽn mạn tính COPD (`J44`), Hen phế quản (`J45`), Giãn phế quản (`J47`), Viêm phổi kẽ (`J84`).

#### 2. Kiểm tra đơn thuốc chống lao & Phác đồ điều trị CTCLQG

- Kiểm tra tính tuân thủ phác đồ chuẩn của Chương trình Chống lao Quốc gia:
  - **Phác đồ A1 (2RHZE/4RH)**: Phác đồ chuẩn điều trị lao nhạy cảm thuốc cho người lớn (Giai đoạn tấn công 2 tháng gồm 4 loại thuốc Rifampicin, Isoniazid, Pyrazinamide, Ethambutol; Giai đoạn duy trì 4 tháng gồm Rifampicin và Isoniazid).
  - **Phác đồ lao kháng thuốc (MDR-TB)**: Kiểm tra các phác đồ ngắn hạn và dài hạn có thuốc mới (Bedaquiline, Linezolid, Moxifloxacin/Levofloxacin).
- Cảnh báo an toàn dùng thuốc:
  - **Độc tính trên gan**: Thuốc R, H, Z đều chuyển hóa qua gan. AI tự động nhắc nhở bác sĩ kiểm tra men gan (AST, ALT, Bilirubin) trước khi điều trị và định kỳ mỗi tháng.
  - **Độc tính thần kinh thị giác**: Cảnh báo kiểm tra thị lực và phân biệt màu sắc đối với Ethambutol (E).
  - **Tương tác thuốc**: Cảnh báo Rifampicin là chất cảm ứng enzym Cytochrome P450 mạnh, làm giảm nồng độ thuốc kháng retrovirus (ARV ở bệnh nhân đồng nhiễm Lao/HIV), thuốc điều trị đái tháo đường dạng uống, thuốc chống đông.

#### 3. Soạn thảo văn bản mẫu y tế (Thông tư 46/2018/TT-BYT)

- Tự động dự thảo **Bản tóm tắt bệnh án ra viện** chuẩn y khoa theo quy định của Bộ Y tế:
  - Quá trình bệnh lý và diễn biến lâm sàng.
  - Tóm tắt kết quả xét nghiệm cận lâm sàng có giá trị chẩn đoán (soi đờm AFB, X-quang phổi, công thức máu, chức năng gan thận).
  - Phương pháp điều trị đã áp dụng và đáp ứng lâm sàng.
  - Tình trạng người bệnh khi ra viện (Khỏi bệnh, Đỡ/giảm, Ổn định, Nặng xin về).
  - Hướng dẫn chế độ điều trị tiếp theo tại tuyến y tế cơ sở và lịch hẹn tái khám.

#### 4. Trợ lý hỏi đáp số liệu điều hành & Giao ban bệnh viện

- Tự động tổng hợp và trả lời ngôn ngữ tự nhiên về số liệu lượt khám, tỷ lệ sử dụng giường bệnh, tỷ lệ khỏi bệnh giữa các khoa.
- Soạn thảo dự thảo nội dung báo cáo giao ban sáng cho Ban Giám đốc và lãnh đạo các khoa phòng.

---

### TT 7: Phân hệ quản lý điều trị Lao – Phổi kết nối VITIMES

#### 1. Quản lý hồ sơ bệnh nhân lao chuyên sâu

Màn hình [Theo dõi ca điều trị lao](http://localhost:5174/bv-lao) số hóa đầy đủ các trường bệnh học chuyên khoa:

- **Thông tin nhân khẩu**: Mã số bệnh nhân lao, Họ tên, Năm sinh, Giới tính, Địa chỉ cư trú.
- **Phân loại ca bệnh theo CTCLQG**:
  - `Mới`: Bệnh nhân chưa bao giờ dùng thuốc chống lao hoặc dùng dưới 1 tháng.
  - `Tái phát`: Đã được công nhận khỏi bệnh trước đây, nay mắc bệnh trở lại có vi khuẩn lao.
  - `Sau bỏ trị`: Bỏ trị từ 2 tháng liên tục trở lên, sau đó quay lại điều trị với đờm dương tính.
  - `Thất bại điều trị`: Đờm vẫn dương tính từ tháng thứ 5 trở đi.
  - `Lao kháng thuốc (MDR/RR)`: Kháng đồng thời Rifampicin và Isoniazid.
- **Thể bệnh**: Lao phổi AFB(+), Lao phổi AFB(-), Lao ngoài phổi (Lao màng phổi, Lao màng não, Lao hạch...).

#### 2. Quản lý theo dõi xét nghiệm đờm AFB theo mốc điều trị

Theo đúng hướng dẫn quản lý lao, bệnh nhân phải được soi kính hiển vi tìm trực khuẩn kháng cồn toan (AFB) ở các thời điểm quyết định:

- **Tháng thứ 2** (Cuối giai đoạn tấn công): Đánh giá việc chuyển âm tính đờm để quyết định chuyển sang giai đoạn duy trì.
- **Tháng thứ 5**: Đánh giá nguy cơ thất bại điều trị (nếu dương tính phải cấy và làm kháng sinh đồ).
- **Tháng thứ 6/8** (Kết thúc liệu trình): Xác nhận tiêu chuẩn khỏi bệnh.

#### 3. Giám sát tuân thủ điều trị DOTS (Directly Observed Treatment, Short-course)

- Hiển thị thanh tiến độ tuân thủ uống thuốc có giám sát trực tiếp (tỷ lệ % số ngày uống thuốc đủ liều dưới sự giám sát của nhân viên y tế hoặc người hỗ trợ điều trị).
- Cảnh báo các ca có tỷ lệ tuân thủ <85% để Tổ chống lao tuyến huyện/xã kịp thời liên hệ tư vấn và hỗ trợ, ngăn ngừa nguy cơ bỏ trị sinh ra lao kháng thuốc.

#### 4. Đồng bộ dữ liệu hai chiều với hệ thống VITIMES

- Hỗ trợ nút **Đồng bộ VITIMES**: Đẩy thông tin ca bệnh, phác đồ, biến cố bất lợi của thuốc và kết quả điều trị cuối cùng lên hệ thống quản lý thông tin bệnh lao quốc gia.
- Lưu vết lịch sử đồng bộ, thời gian đồng bộ và mã định danh quốc gia do VITIMES phản hồi.

---

## 3. Ma trận phân quyền và trách nhiệm (RBAC theo ADR-0006)

Hệ thống GDOS tuân thủ mô hình phân quyền chặt chẽ theo vai trò y tế:

| Phân hệ / Nghiệp vụ                   | Bác sĩ điều trị / Kỹ thuật viên | Chuyên viên KHTH / BHYT | Trưởng khoa / Người duyệt chuyên môn |             Ban Giám đốc              |   Quản trị viên hệ thống   |
| :------------------------------------ | :-----------------------------: | :---------------------: | :----------------------------------: | :-----------------------------------: | :------------------------: |
| **Phim X-quang & Gán nhãn (TT 1, 2)** |     Gán nhãn, xem gợi ý AI      |      Xem đối chiếu      |    Duyệt nhãn, đối chiếu kết quả     |          Xem báo cáo tiến độ          |   Quản trị nguồn kết nối   |
| **Hồ sơ nghiên cứu SaMD (TT 2)**      |      Cập nhật dữ liệu thô       |        Lập hồ sơ        |     Phê duyệt mốc đạo đức, SaMD      |           Ký duyệt báo cáo            |     Quản trị tài liệu      |
| **Kho dữ liệu & Kết nối API (TT 3)**  |         Không truy cập          |   Xem số liệu đã nạp    |         Xem số liệu tổng hợp         |              Xem báo cáo              |  Cấu hình & kích hoạt API  |
| **Bảng điều hành & Giao ban (TT 4)**  |        Xem chỉ tiêu khoa        |      Xem toàn viện      |     Xem & kết xuất báo cáo khoa      | Điều hành, kết xuất báo cáo toàn viện | Quản trị cấu hình hiển thị |
| **Rà soát hồ sơ BHYT (TT 5)**         |      Bổ sung hồ sơ bệnh án      | Rà soát lỗi, áp bản sửa |        Duyệt hồ sơ thanh toán        |         Xem tổng hợp chi phí          |  Giám sát luồng tích hợp   |
| **Trợ lý AI chuyên khoa (TT 6)**      | Tra cứu ICD, đơn thuốc, soạn BA |    Hỏi đáp giao ban     |        Duyệt văn bản dự thảo         |       Tra cứu số liệu điều hành       |    Cấu hình tham số AI     |
| **Điều trị Lao & VITIMES (TT 7)**     |  Cập nhật mốc, xét nghiệm đờm   |    Đối soát số liệu     |       Duyệt hoàn tất điều trị        |          Xem báo cáo dịch tễ          |  Quản trị kết nối VITIMES  |

---

## 4. Kiểm soát an toàn dữ liệu y tế & Quy chuẩn công nghệ

1. **Tuân thủ quy định bảo mật & Y đức**:
   - Tuân thủ Luật Khám bệnh, chữa bệnh số 15/2023/QH15 và Luật Bảo hiểm y tế.
   - Dữ liệu nghiên cứu thử nghiệm được ẩn danh hóa (Anonymization) tuyệt đối, không lưu trữ thông tin nhận dạng cá nhân trong các tập huấn luyện của AI.
   - RLS (Row-Level Security) theo ADR-0004 phân tách dữ liệu đa đơn vị: Bệnh viện Phổi tỉnh và Trung tâm Y tế cấp huyện chỉ nhìn thấy dữ liệu thuộc phạm vi đơn vị mình quản lý.

2. **Cơ chế hoạt động của mô hình AI**:
   - Mô hình AI được thiết kế như một **cố vấn lâm sàng thứ hai (Second Reader)**. AI không bao giờ tự động ra quyết định y khoa hay tự động kê đơn/gửi hồ sơ. Mọi hành động chuyên môn bắt buộc phải có sự xác nhận của cán bộ y tế có thẩm quyền.

3. **Tối ưu hóa tài nguyên vận hành**:
   - Hệ thống được cấu hình hỗ trợ chạy trên cơ sở dữ liệu nhúng **PGlite** siêu nhẹ, giúp các máy trạm tại trạm y tế xã hoặc máy tính xách tay trên xe X-quang lưu động có thể vận hành trơn tru mà không cần cấu hình phần cứng phức tạp hay tiêu tốn nhiều RAM.
   - Khi triển khai quy mô lớn tại trung tâm dữ liệu bệnh viện, hệ thống kết nối thẳng vào cụm PostgreSQL chịu tải cao thông qua biến môi trường tiêu chuẩn.

---

## 5. Kết luận & Khuyến nghị vận hành

Nền tảng GDOS đã hoàn thành đầy đủ cả 7 hạng mục chuyên khoa theo chuẩn nghiệp vụ của Bệnh viện Phổi Long An.

Để đưa hệ thống vào vận hành chính thức tại bệnh viện:

1. **Kết nối hạ tầng thật**: Mở cổng mạng nội bộ cho các máy xét nghiệm (LIS), máy chụp X-quang kỹ thuật số (PACS) và kết nối API nội bộ với hệ thống HIS của bệnh viện.
2. **Ký số & Cổng BHXH**: Tích hợp chứng thư số tổ chức (HSM / USB Token) của bệnh viện để thực hiện ký số gói tin XML gửi cổng BHXH Việt Nam.
3. **Phê duyệt Hội đồng đạo đức**: Đệ trình biên bản nghiên cứu khoa học và đề cương ứng dụng AI cho Hội đồng đạo đức trong nghiên cứu y sinh học để chính thức đưa AI vào hỗ trợ sàng lọc lâm sàng.
