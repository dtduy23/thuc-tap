# Tiến độ

Đọc file này **đầu mỗi phiên**. Cập nhật **cuối mỗi phiên**: xong gì, dở gì, phát hiện gì.

## Các mốc

| Mốc   | Nội dung                                                                             | Trạng thái                                         |
| ----- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **0** | Khởi tạo repo, CI, ADR, khung dùng chung                                             | ✅ Xong — **CI/CD giao kỹ thuật FOXAI** (xem dưới) |
| **1** | Nền móng: tài khoản, đơn vị, vai trò & quyền, RLS, nhật ký, khung portal + cây 4 cấp | ✅ Xong — nhánh `moc-1-nen-mong`, chưa đẩy         |
| **2** | Đưa lên máy thử (image, nginx, CI/CD)                                                | Chưa bắt đầu                                       |
| **3** | Module Dự án (từ PMS)                                                                | 🔄 Phiên 5a/6 — + cảnh báo, đôn đốc, việc của tôi  |
| **4** | Module Khiếu nại đất đai                                                             | Chưa bắt đầu                                       |
| **5** | Nối FOXAI Native (văn bản, tóm tắt, hỏi đáp)                                         | Chưa bắt đầu — **chờ đội Native**                  |
| **6** | Điều hành: dashboard, báo cáo                                                        | Chưa bắt đầu                                       |
| **7** | Thiết lập: bật/tắt module theo đơn vị, cảnh báo, luồng duyệt                         | Chưa bắt đầu                                       |

## Mốc 3 — Dự án (từ PMS)

Người dùng chốt: làm **đủ chức năng PMS**, **không** chuyển dữ liệu dự án (tự nạp bằng Nhập Excel).
Tổ chức theo ADR-0007 (một chủ — nhiều lối vào) và ADR-0008 (mô hình dữ liệu).

| Phiên | Việc                                                                                                                       | Trạng thái    |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **1** | Lược đồ, RLS, 6 quy trình mẫu NĐ 45, tính hạn dùng chung, loại đơn vị mở rộng                                              | ✅ 30/09/2026 |
| **2** | API + màn: danh sách (3 bộ lọc), tạo từ quy trình mẫu, hồ sơ (Tổng quan · Checklist · Thành viên), nhà thầu gửi → xác nhận | ✅ 30/09/2026 |
| **3** | Kế hoạch & điều chỉnh (bước nháp, chốt kế hoạch, phiên bản), thêm/xóa bước tùy biến, Gantt                                 | ✅ 30/09/2026 |
| **4** | Văn bản (kho tệp) · Kinh phí & giải ngân · Vướng mắc · thẻ Nhật ký                                                         | ✅ 30/09/2026 |
| 5     | Đóng góp theo ADR-0007: báo cáo (Biểu 01/02/03, BC35), chỉ số KPI, cảnh báo, việc của tôi · Đôn đốc                        | 🔄 5a xong    |
| 6     | Nhập / xuất Excel · giám sát theo lĩnh vực · màn quản lý Danh mục nghiệp vụ, Quy trình mẫu                                 |               |

### Phiên 5a — đóng góp (ADR-0007): cảnh báo, đôn đốc, việc của tôi (30/09/2026)

**Đã làm**

- `@gdos/shared › dong-gop.ts`: module nghiệp vụ khai `dongGop` (báo cáo · chỉ số · cảnh báo · việc).
  Test chặn: chỉ nhóm Tác nghiệp / Danh mục có đóng góp; mã mang tiền tố module chủ; không module
  xuyên suốt nào mang tên nghiệp vụ. Quyền xem đóng góp = quyền của chủ (`dongGopCua`).
- API: giao diện `NguonDongGop` + danh sách `NGUON_DONG_GOP` (app.module) — thêm nghiệp vụ là thêm
  một nguồn. Điểm gom `/api/canh-bao?loai=` (cần `QUA_HAN.READ`) và `/api/viec-cua-toi`.
- Dự án đóng góp: bước quá hạn, sắp hạn (10 ngày), dự án lâu không cập nhật (15 ngày); việc: bước
  của dự án tôi phụ trách, cập nhật chờ tôi xác nhận, bị đôn đốc (30 ngày), vướng mắc mở.
- **Đôn đốc** (Điều 36): chọn nhiều dự án → một đợt; bảng `du_an_don_doc` (vết, không sửa); chỉ dự án
  thuộc đơn vị trong phạm vi; quyền `DU_AN.ASSIGN` (lãnh đạo).
- Web: Giám sát › Hồ sơ quá hạn (3 cấp 4 — một màn), Dự án › Đôn đốc, trang chủ có **Việc của tôi**.
- Test: 7 đầu cuối. **Đã kiểm trên trình duyệt**: Việc của tôi, Sắp đến hạn.

### Phiên 4 — văn bản, kinh phí & giải ngân, vướng mắc, nhật ký (30/09/2026)

**Đã làm**

- Bảng `du_an_van_ban`, `du_an_von`, `du_an_giai_ngan`, `du_an_vuong_mac` — cùng RLS như bước.
- **Kho tệp** (`apps/api/src/kho-tep`): giao diện `KhoTep` + bản lưu thư mục (`KHO_TEP_THU_MUC`,
  production bắt buộc đặt; dev `.data/tep`). Khóa tệp do API sinh, không ghi đè, không ra ngoài
  thư mục. Tải lên ≤ 25 MB, chỉ đuôi văn bản/ảnh/nén; tên tiếng Việt giữ nguyên khi tải về.
- Giải ngân = **tổng các đợt** (không có ô nhập tay — PMS có cả hai nên từng lệch); % theo tổng mức
  và theo kế hoạch vốn tới năm nay (công thức KPI giải ngân của PMS).
- Vướng mắc: nêu (gắn bước được), giải quyết (bắt buộc ghi kết quả), mở lại. Danh sách dự án đếm
  vướng mắc đang mở.
- Thẻ Nhật ký = chính màn Giám sát › Nhật ký thao tác lọc theo dự án (ADR-0007), quyền `NHAT_KY.READ`
  — chuyên viên không thấy thẻ này.
- **Đã kiểm trên trình duyệt**: tải lên / tải về PDF tên tiếng Việt, thêm kế hoạch vốn + đợt giải
  ngân (23,5% tổng mức, 40% kế hoạch), nêu vướng mắc.

**Chưa làm**

- **Kho tệp MinIO** — máy dev không có Docker nên chưa kiểm được; bản thư mục dùng được cho máy
  chủ gắn ổ đĩa. Làm ở Mốc 2 cùng kỹ thuật FOXAI.
- Nhà thầu tải lên văn bản, nêu vướng mắc — hiện chỉ chủ đầu tư ghi (thành viên chỉ đọc + gửi cập
  nhật bước).

### Phiên 3 — kế hoạch & điều chỉnh, Gantt (30/09/2026)

**Đã làm**

- Bảng `du_an_phien_ban`: mỗi lần **chốt kế hoạch** ghi một phiên bản (ảnh chụp hạn, lý do, căn cứ,
  ngày kết thúc dự kiến, số ngày lùi so với lần trước). Phiên bản không sửa được — RLS không có
  policy UPDATE. Phiên bản 1 = kế hoạch gốc lúc tạo; dự án cũ được dựng bù phiên bản 1.
- Thêm bước tự khai → luôn vào dạng **nháp** (không hạn, không tiến độ); chốt thì thành chính thức.
  Bước tự thêm đổi tên, xóa (mềm) được; bước theo quy trình mẫu chỉ bỏ qua được.
- Thẻ Kế hoạch: so hạn hiện tại với lần chốt gần nhất (bước nào lệch, kết thúc lùi bao nhiêu), chốt
  kế hoạch, thêm bước, lịch sử phiên bản. Thẻ Gantt: vẽ từ đúng chuỗi hạn của checklist, 3 mức
  thu phóng, vạch hôm nay, chấm ngày xong thực tế.
- Thứ tự bước là số thực — chèn giữa không phải đánh số lại cả dự án (tránh hàng chục dòng nhật ký rác).
- **Đã kiểm trên trình duyệt**: thêm bước nháp → chốt → v2 lùi 5 ngày; Gantt.

**Khác PMS, có lý do**: PMS lưu kế hoạch bằng cách gửi TOÀN BỘ danh sách bước, bước nào thiếu thì
bị xóa âm thầm (chính PMS ghi cảnh báo này). GDOS làm từng thao tác riêng — không có đường xóa hàng loạt.

### Phiên 1–2 (30/09/2026)

**Đã làm**

- Chủ đầu tư là đơn vị (RLS tự giới hạn). Nhà thầu, tư vấn là đơn vị doanh nghiệp + thành viên dự án,
  chỉ gửi cập nhật qua hàm `buoc_gui_cap_nhat` — database chặn việc tự đánh dấu xong.
- Tạo dự án chép quy trình mẫu, tính hạn nối chuỗi (giữ công thức PMS), mã tự sinh `DA-năm-số`.
- Bước: hoàn thành · bỏ hoàn thành · bỏ qua có lý do · khôi phục · sửa số ngày / hạn ghi đè (hạn
  các bước sau dời theo).
- Quyền trên từng dự án = quyền vai ∩ vị trí: chủ đầu tư sửa; lãnh đạo đơn vị xác nhận; thành viên
  ngoài đơn vị chỉ gửi.
- Danh bạ tài khoản + hàm lấy tên qua ranh giới RLS: chủ đầu tư cấp xã chọn được nhà thầu; nhà thầu
  thấy tên chủ đầu tư.
- Test: 14 bảo mật database + 14 đầu cuối. **Đã kiểm trên trình duyệt**: tạo dự án 53 bước, xem
  tổng quan, ghi nhận bước.

**Khác PMS, có lý do**

- Cập nhật của nhà thầu do chủ đầu tư **hoặc lãnh đạo đơn vị** xác nhận (PMS: Sở / chủ đầu tư).
- Cột "văn bản mẫu" của quy trình được ghi vào ghi chú của bước; ô số văn bản để trống cho đơn vị
  điền số thật.

## Mốc 1 — Nền móng

| Phiên | Việc                                                                                                                        | Trạng thái    |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **1** | Vai trò & tính quyền · lược đồ · RLS · nhật ký · test bảo mật DB                                                            | ✅ 30/09/2026 |
| **2** | Đăng nhập (argon2id của Node, cookie HttpOnly, refresh xoay vòng, khóa khi sai) · CLI tạo quản trị viên · guard quyền ở API | ✅ 30/09/2026 |
| **3** | Web: khung portal + cây 4 cấp lọc quyền (mang từ `docs/khung-mau.html` + GDOS cũ) · màn đăng nhập                           | ✅ 30/09/2026 |
| **4** | Tầng 2: Tài khoản · Phân công · Đơn vị · Ma trận quyền · Nhật ký thao tác (API + màn hình)                                  | ✅ 30/09/2026 |
| **5** | Cấu hình hệ thống (chính sách bảo mật, tên & nhận diện) · tông màu kiểu PMS · cài đặt cá nhân                               | ✅ 30/09/2026 |

### Sau phiên 5 — dựng đủ cây phân hệ (30/09/2026)

Người dùng chốt: **cấp 1–2 cố định; bám cây cấp 3 của bản mẫu `docs/khung-mau.html`**; dựng đủ khung
trên giao diện trước để thấy mindset, rồi mới bàn cách tổ chức PMS ở cấp 3–4. Đề xuất cây riêng cho
PMS (tách Bảng điều hành / Cảnh báo / Biểu mẫu / KPI thành module riêng) **bị loại** — trái nguyên
tắc: Điều hành có module chung cho mọi nghiệp vụ (Tổng quan, Báo cáo điều hành, Bộ chỉ số), phần
riêng của dự án là cấp 4 (Theo chủ đầu tư, Theo lĩnh vực…).

- Registry khai đủ 24 module / 64 chức năng theo bản mẫu. Chưa xây thì đánh `phac: true` (màn phác):
  có chỗ trên cây, có quyền, có đường dẫn; mở ra thấy vị trí trong khung, câu hỏi của nhóm, nguồn dữ
  liệu, mã quyền. Test chặn hai chiều (không phác thì phải có màn, phác thì không được có màn).
- Khác bản mẫu, có lý do: thêm **Đơn vị** và **Chính sách đăng nhập** vào Người dùng & Phân quyền
  (GDOS tự giữ tài khoản — ADR-0003); "Tên & nhận diện" là cấp 4 của **Hiển thị**; Tổ chức ở Danh
  mục là danh bạ chỉ đọc lấy từ GDOS, không phải gương của Native.
- Cây bỏ dòng diễn giải dưới tên tầng.

### Phiên 5 — cấu hình hệ thống, giao diện (30/09/2026)

Theo góp ý của người dùng sau phiên 4: chính sách bảo mật phải chỉnh được trên màn hình, mặc định
nới lỏng hơn; giao diện giống PMS (sản phẩm nhà nước, cờ đỏ sao vàng); mỗi người tự chọn tông màu.

**Đã làm**

- Module mới Tầng 2 › Cấu hình & Vận hành › **Cấu hình hệ thống** (`QT_CAU_HINH`), hai màn:
  - **Đăng nhập & mật khẩu** — form dựng từ khai báo `CHINH_SACH` trong `@gdos/shared`; API kiểm
    cùng khai báo. Mặc định mới: khóa tạm sau **10** lần sai trong **10** phút · vé **30** phút · giữ
    đăng nhập **30** ngày · mật khẩu ≥ **8** ký tự (trước: 5 lần/15 phút · 15 phút · 7 ngày · 10 ký tự).
  - **Tên & nhận diện** — tên cơ quan, tên hệ thống, mô tả; xem trước màn đăng nhập ngay trên form.
- Bảng `cau_hinh` (migration 0006, 0007). App chỉ ĐỌC; ghi qua hàm `cau_hinh_ghi` — database tự kiểm
  người ghi là quản trị ở **đơn vị gốc** (hệ nhiều xã: quản trị xã không đổi được chính sách chung).
  Mọi lần sửa vào nhật ký thao tác; màn nhật ký đọc được từng tham số đổi từ gì sang gì.
- API đọc chính sách có bộ nhớ đệm 10 giây; đổi xong áp dụng ngay cho lần đăng nhập / làm mới /
  đổi mật khẩu tiếp theo. `GET /api/cau-hinh/cong-khai` (không cần đăng nhập) cho màn đăng nhập.
- Giao diện theo PMS: phông Be Vietnam Pro + Noto Serif, bộ màu navy #14366B + vàng kim #C9A227;
  cây phân hệ nền đậm như sidebar PMS; màn đăng nhập nền navy, **cờ đỏ sao vàng**, tên cơ quan.
- **Cài đặt cá nhân** (`/cai-dat`, nút bánh răng trên thanh trên): 5 tông màu (Xanh nhà nước — mặc
  định, Đỏ cờ, Xanh lục, Xanh dương, Tím than) × Sáng / Tối / Theo máy. Lưu ở máy, theo từng tài khoản.
- Test: shared 42 · API 108 (thêm 7 test đầu cuối cấu hình) · web 22.
- **Đã kiểm trên trình duyệt**: màn đăng nhập mới; lưu tên cơ quan → màn đăng nhập đổi theo; đổi
  tông Đỏ cờ + Tối áp dụng ngay.

### Phiên 4 — màn quản trị Tầng 2 và nhật ký (30/09/2026)

**Đã làm**

- API (mọi route khai `@CanQuyen`; có test chặn mã quyền gõ sai):
  - `/api/tai-khoan`: danh sách · tạo · sửa (họ tên, mã Native, cờ quản trị) · thay phân công ·
    khóa / mở khóa · đặt lại mật khẩu. Không có xóa — thôi dùng thì khóa.
  - `/api/don-vi`: danh sách (kèm số tài khoản) · thêm xã dưới tỉnh · sửa mã, tên.
  - `/api/nhat-ky`: lọc theo đối tượng, hành động, khoảng ngày (giờ Việt Nam); phân trang theo mã.
- **Mật khẩu tạm** (ADR-0003 mục 6): quản trị không bao giờ biết mật khẩu thật của ai. Người nhận
  mật khẩu tạm bị API chặn mọi route cần quyền cho tới khi tự đổi; web đưa thẳng vào màn đổi mật
  khẩu. Đổi xong API trả vé mới luôn, không phải chờ 15 phút.
- Migration `0004` (cột `phai_doi_mat_khau`) và `0005`: policy `them_cap_duoi` (thêm đơn vị khi CHA
  nằm trong phạm vi); hàm `phien_thu_hoi_tai_khoan` tự kiểm bằng database rằng người gọi có cờ quản
  trị và tài khoản đích nằm trong phạm vi.
- Chặn tự hại: không tự khóa mình, không tự bỏ cờ quản trị, không tự "đặt lại" mật khẩu của mình.
- Web: 5 màn (`tk-ds`, `tk-tao`, `dv-ds`, `vt-ma-tran`, `nk-tat-ca`), tách bundle theo màn. Bộ soạn
  phân công dùng CHÍNH `kiemTraPhanCong()` của API để báo lỗi tại chỗ. Ma trận quyền sinh từ
  `tinhQuyen()` — không thể lệch quyền thật. Nhật ký đọc thành chữ: trường nào đổi từ gì sang gì.
  Test chặn: chức năng nào trong registry cũng phải có màn.
- Test: shared 39 · API 101 (thêm 29 test đầu cuối Tầng 2 + nhật ký) · web 22.
- **Đã kiểm trên trình duyệt** (DB nhúng): tạo tài khoản → mật khẩu tạm hiện một lần → đăng nhập
  bằng nó bị đưa vào màn đổi mật khẩu → đổi xong vào được nhật ký; khóa / mở khóa; nhật ký ghi đủ ai
  làm gì.

**Chưa làm (để sau, không chặn Mốc 2)**

- Ngừng dùng (xóa mềm) đơn vị; chuyển tài khoản sang đơn vị khác.
- Xuất nhật ký ra tệp (quyền `NHAT_KY.EXPORT` đã có, chưa có nút).
- "Thêm xã" mới kiểm bằng test — DB nhúng ở máy dev chỉ có một xã, không có tỉnh.

**Phát hiện**

- `INSERT … RETURNING` bị RLS chặn khi dòng mới chưa nằm trong phạm vi ĐỌC (đơn vị vừa tạo) → sinh
  mã ở API, không dùng RETURNING.
- Quyền đọc theo cột của `tai_khoan` (0002) phải cấp lại cho mỗi cột mới — quên thì API báo
  "permission denied" ngay ở test đầu tiên, không lặng lẽ rò.

### Phiên 3 — khung web (30/09/2026)

**Đã làm**

- Web: TanStack Router + Query. Route `/dang-nhap`, khung portal (guard một chỗ), `/`, `/doi-mat-khau`,
  và MỘT route động `/$chucNang` phủ cả registry.
- Lớp gọi API duy nhất (`lib/http.ts`): tự gắn `X-GDOS`; gặp 401 thì làm mới phiên ĐÚNG MỘT LẦN rồi
  gọi lại, nhiều request cùng hết hạn dùng chung một lần làm mới (token xoay vòng — làm mới hai lần là
  bị coi như dùng lại token cũ).
- Cây 4 cấp dựng từ `locTheoQuyen()` trên đúng tập quyền API trả về; tự mở nhánh đang xem; nhớ
  đóng/mở theo máy; màn hẹp thành ngăn kéo ☰.
- `?tiep=` chỉ nhận đường dẫn nội bộ — chống dùng màn đăng nhập làm bàn đạp chuyển sang trang lừa đảo.
- Token màu từ bản mẫu, riêng chữ phụ đậm hơn để đạt tương phản WCAG AA.
- **Database nhúng cho máy dev** (`DB_NHUNG=1`, PGlite ghi ra `.data/pglite`) — chạy `pnpm dev` không
  cần Docker. Production cấm. Lệnh khởi tạo cũng dùng được.
- **Đã kiểm trên trình duyệt**: chưa đăng nhập vào `/tk-ds` → về màn đăng nhập kèm `?tiep`; sai mật
  khẩu → câu chung, xóa ô mật khẩu; đúng → quay lại đúng `/tk-ds`; đường dẫn C1›C2›C3›C4; cây đúng
  quyền; ngăn kéo màn hẹp.

**Phát hiện**

- `node --watch` trên Windows khởi động lại API liên tục dù `dist/` không đổi (phần mềm diệt virus
  quét thư mục sinh sự kiện giả) → thay bằng `apps/api/scripts/chay-dev.mjs`: chỉ khởi động lại khi dấu
  vân tay (mtime + kích thước) các tệp `.js` thật sự đổi. Bật biên dịch tăng dần (`.tsbuildinfo`).
- pnpm 11 chuyển nguyên dấu `--` vào lệnh CLI → lệnh `khoi-tao` chấp nhận cả hai kiểu gõ.
- ESLint (react-hooks 7) chặn `setState` trong `useEffect` → điều chỉnh state ngay lúc render khi đầu
  vào đổi (cách React khuyên). `jsx-a11y` chặn `autoFocus` ở màn đăng nhập → bỏ.

### Phiên 2 — đăng nhập (30/09/2026)

**Đã làm**

- `packages/shared/src/dang-ky.ts` — REGISTRY thật (chỉ module đã có màn): Nhật ký thao tác; Tầng 2
  Tài khoản · Đơn vị · Vai trò & quyền. API và web dùng chung.
- Mật khẩu: argon2id của Node (`crypto.argon2`), tham số tối thiểu OWASP, dạng PHC. Luật mật khẩu mới:
  **≥ 10 ký tự, không chứa tên đăng nhập** (NIST: độ dài hơn độ phức tạp).
- Vé đăng nhập: JSON ký HMAC-SHA256, 15 phút, mang sẵn phân công — không dùng JWT (không cho người gửi
  tự khai thuật toán). Token làm mới: 7 ngày, xoay vòng, chỉ lưu bản băm.
- Cookie `gdos_ve` (HttpOnly, SameSite=Lax, Path=/api) và `gdos_phien` (HttpOnly, SameSite=Strict,
  Path=/api/xac-thuc). Chống giả mạo: request ghi phải có header `X-GDOS: 1`.
- Guard toàn cục **mặc định chặn**: route phải khai `@CongKhai` / `@ChiCanDangNhap` / `@CanQuyen`,
  quên khai → 500.
- Migration `0003_phien.sql`: `don_vi_pham_vi` (tỉnh thấy mọi xã trực thuộc), `phien_doi` (xoay
  vòng, token cũ dùng lại sau 10 giây → thu hồi mọi phiên), `phien_thu_hoi`.
- API `/api/xac-thuc/`: `dang-nhap` · `lam-moi` · `dang-xuat` · `toi` · `doi-mat-khau`.
- CLI `pnpm --filter @gdos/api khoi-tao`: migration + đơn vị gốc + quản trị viên đầu tiên; mật khẩu
  nhập ẩn (hoặc `GDOS_MAT_KHAU_QUAN_TRI`), không bao giờ qua tham số dòng lệnh; mặc định CHỈ cờ quản
  trị, `--toan-quyen` cho lúc xây dựng.
- Test: API 70 (trong đó 20 test đầu cuối HTTP thật + Postgres thật).

**Chưa kiểm được**: lệnh CLI chạy trên Postgres thật (máy không có) — logic đã có test trên PGlite.

**Mặc định đang dùng — người dùng xác nhận sau**: vé 15 phút · phiên 7 ngày · mật khẩu ≥ 10 ký tự.
Đổi phân công / khóa tài khoản có hiệu lực chậm tối đa 15 phút (lúc vé làm mới).

### Phiên 1 — nền dữ liệu (30/09/2026)

**Đã làm**

- ADR-0006: ba vai (Lãnh đạo · Chuyên viên · Thanh tra) + cờ quản trị; quyền = vai × phân công.
- `@gdos/shared`: `HANH_DONG` (7 hành động), mã quyền **ghép** bằng `quyenCua()` thay vì gõ tay;
  `tinhQuyen()`, `kiemTraPhanCong()`. Tầng 2 bắt buộc mã quyền `QT_`, Tầng 1 cấm `QT_`.
- Lược đồ: `don_vi`, `tai_khoan`, `phan_cong`, `phien_dang_nhap`, `nhat_ky_thao_tac`.
- Migration `0002_bao-mat.sql`: role `gdos_app`, RLS theo đơn vị, không cấp `DELETE`, không cấp
  đọc `mat_khau_bam`, nhật ký do trigger ghi và không sửa/xóa được, `updated_at` tự cập nhật,
  hai hàm `SECURITY DEFINER` cho đăng nhập (tìm tài khoản, đếm sai và khóa).
- `trongPhamVi()` / `khongNguCanh()` / `truyVan()` — lối vào database duy nhất.
- Test: shared 34 · API bảo mật DB 19 (chạy trên PGlite — Postgres thật, không cần Docker).

**Phát hiện**

- `FORCE ROW LEVEL SECURITY` làm hàm đăng nhập không tìm thấy ai → bỏ `FORCE`, dựa vào việc app
  luôn chạy dưới `gdos_app`. ADR-0004 đã sửa (chưa trộn vào `main` nên sửa thẳng, có ghi chú).
- Drizzle bọc lỗi Postgres trong `cause` — test kiểm lỗi phải đọc lỗi gốc (`loiGoc()`), không thì
  một câu lệnh hỏng vì lý do khác cũng "đạt".

**Mặc định đang dùng — người dùng xác nhận sau**

- Khóa tài khoản sau **5** lần sai liên tiếp, trong **15** phút (tham số của `dang_nhap_ghi`).

## Mốc 0 — Khởi tạo (30/09/2026)

Monorepo, CI, ADR 0001–0005, `CLAUDE.md`, bản mẫu HTML. `pnpm kiem-tra` xanh; đã đẩy nhánh.

**Giao cho kỹ thuật FOXAI (người dùng chốt 30/09/2026)**

- [ ] **Pipeline CI.** Pipeline #2665 treo "stuck" vì job không gắn tag. Đã sửa (`aade7d4`): gắn tag
      `foxai-build` (shell executor, SRV-01 — theo runbook CI/CD của repo cũ), mỗi job tự
      `docker run`. Nếu vẫn stuck: runner `foxai-build` có thể chưa được bật cho project này —
      Settings → CI/CD → Runners → Enable for this project.
- [ ] **`docker compose up`** trên một máy có Docker.

**Phát hiện** (đã ghi vào ADR-0005): `PORT` chung làm API chiếm cổng web → `API_PORT`; đường dẫn
có dấu làm vỡ script `prepare` của pnpm trên Windows; máy dev có Postgres khác ở 5432 với dữ liệu
thật → GDOS dùng 5433.

## Câu hỏi mở

| Câu hỏi                                                                                       | Hỏi ai                | Chặn       |
| --------------------------------------------------------------------------------------------- | --------------------- | ---------- |
| Kết quả pipeline CI / runner là docker hay shell executor                                     | Người dùng xem GitLab | Trộn Mốc 0 |
| GDOS gọi Native thay mặt người dùng bằng cách nào? Quyền phía Native kiểm theo tài khoản nào? | Đội Native            | Mốc 5      |
| Server + tên miền phụ cho máy thử                                                             | Hạ tầng               | Mốc 2      |
| ~~Ngưỡng khóa tài khoản~~ — đã chỉnh được trên màn Cấu hình hệ thống (phiên 5)                | —                     | —          |
