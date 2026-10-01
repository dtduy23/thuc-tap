# Tư duy xây dựng GDOS

Tài liệu cho **người sắp thêm hoặc sửa một module**. Đọc hết mất khoảng 15 phút. Luật chi tiết
và lý do nằm trong các ADR; ở đây là cách nghĩ, để hệ thống lớn lên mà không rối.

> **Bảy câu cần nhớ**
>
> 1. Khung đóng băng, nghiệp vụ thay đổi ở nội dung. **Cấp 1–2 cố định**; việc hằng ngày nằm ở cấp 3–4.
> 2. Cấp 3 là **một đối tượng**. Cấp 4 là **một đường vào** đối tượng đó. Không có cấp 5.
> 3. **Một chủ — nhiều lối vào.** Báo cáo, chỉ số, cảnh báo… khai báo **một lần** ở module sở hữu,
>    rồi tự hiện ở mọi nơi cần.
> 4. Nhóm xuyên suốt (Điều hành, Giám sát, Tầng 2) đặt tên theo **góc nhìn**, không bao giờ
>    theo tên một nghiệp vụ.
> 5. **Quy tắc ở Tầng 2, việc đang diễn ra ở Tầng 1.**
> 6. Danh mục chỉ lập khi có **từ hai nơi dùng**. Giá trị suy ra được thì không bắt người dùng khai.
> 7. Mọi thứ trên đều **chặn bằng máy** (kiểu dữ liệu, test, RLS), không trông vào trí nhớ.

---

## 1. Khung bốn cấp

```text
Cấp 1  TẦNG       Nghiệp vụ | Quản trị hệ thống                              — ĐÓNG
Cấp 2  NHÓM       Tầng 1: Điều hành · Tác nghiệp · Danh mục · Giám sát & Lưu vết
                  Tầng 2: Người dùng & Phân quyền · Kết nối · Cấu hình & Vận hành — ĐÓNG
Cấp 3  MODULE     một ĐỐI TƯỢNG (Dự án, Đơn thư, Tài khoản…)
Cấp 4  CHỨC NĂNG  một ĐƯỜNG VÀO đối tượng đó
```

- Cấp 1–2 khai trong `packages/shared/src/phan-he.ts`. Muốn thêm hay đổi thì phải có ADR. Thực
  tế là **không bao giờ cần**.
- Cấp 3–4 khai trong `packages/shared/src/dang-ky.ts` (registry). Sidebar, kiểm quyền ở API, trang
  chủ và ma trận quyền đều đọc từ file này.
- **Cấp 4 chỉ có ba loại:**

  | Loại             | Ví dụ                                                         |
  | ---------------- | ------------------------------------------------------------- |
  | Bộ lọc           | Tất cả dự án · Dự án tôi phụ trách · Tài khoản bị khóa        |
  | Chặng hành trình | Tiếp nhận → Thụ lý → Giải quyết → Đã giải quyết (đúng thứ tự) |
  | Thao tác         | Tạo mới · Nhập từ Excel · Đôn đốc                             |

  Thấy mình định thêm một cấp 4 mà nó là **đối tượng khác** thì đó là cấp 3.

- **Không có cấp 5.** Bên trong một hồ sơ (Checklist, Giải ngân, Vướng mắc, Văn bản…) là
  **thẻ**, tức là trục phạm vi của _một_ hồ sơ, không lên cây.
- Con số thực hành: nhóm có 2–5 module; module có 3–7 chức năng.

### Đặt một màn vào đâu — hỏi theo thứ tự, dừng ở câu đầu tiên trả lời "có"

1. Phải mở một hồ sơ trước mới xem được? → **thẻ trong hồ sơ**
2. Gom việc từ nhiều module cho một người? → **Việc của tôi** (vỏ)
3. Dùng cho mọi nghiệp vụ, như tìm kiếm, cài đặt cá nhân? → **vỏ**
4. Chỉ đọc, tổng hợp nhiều hồ sơ? → **Điều hành**
5. Có mã hồ sơ + thời hạn đo được + người chịu trách nhiệm? → **Tác nghiệp**
6. Là vết của việc đã làm, người xem là thanh tra hoặc lãnh đạo? → **Giám sát & Lưu vết**
7. Có từ hai nhóm nghiệp vụ tham chiếu tới? → **Danh mục**
8. Chỉ quản trị viên dùng, sai thì ảnh hưởng cả hệ thống? → **Tầng 2**
9. Không rơi vào câu nào → hoặc là hai màn đang bị gộp (tách ra), hoặc là _quy tắc_ của một màn
   khác (đưa về Cấu hình), hoặc là màn **không nên tồn tại**.

**Vỏ** là những thứ bao quanh cây, không nằm trong cây: thanh trên (tìm kiếm, cài đặt cá nhân,
đổi mật khẩu), trang chủ (Việc của tôi), thông báo.

---

## 2. Một chủ — nhiều lối vào

Đây là luật giữ cho hệ thống không rối khi có mười, hai mươi module. Cách làm giống SAP: một báo
cáo được khai báo đúng một lần trong danh mục ứng dụng, rồi được xếp ra nhiều trang theo vai trò.

```text
        SỞ HỮU — khai MỘT lần                    LỐI VÀO — tự gom, không viết lại
  ┌──────────────────────────────┐
  │ Tác nghiệp › Dự án           │──► Dự án › "Báo cáo dự án"          (lối vào tại chỗ)
  │   báo cáo  Biểu 01/02/03…    │──► Điều hành › Báo cáo điều hành    (lối vào tổng)
  │   chỉ số   KPI, xếp hạng     │──► Điều hành › Bộ chỉ số
  │   số liệu  thẻ Tổng quan     │──► Điều hành › Tổng quan
  │   cảnh báo quá hạn, …        │──► Giám sát › Hồ sơ quá hạn
  │   việc     chờ xác nhận, …   │──► Việc của tôi (trang chủ)
  │   tham số  ngưỡng, hạn…      │──► Tầng 2 › Quy tắc cảnh báo / Khai báo module
  │   điểm duyệt                 │──► Tầng 2 › Luồng phê duyệt
  └──────────────────────────────┘
```

**Luật 1 — Mỗi thứ có đúng một chủ.** Chủ là module sở hữu dữ liệu. Quyền xem cũng là quyền của
chủ, vd `DU_AN.EXPORT`. Vì vậy ai thấy ở chỗ này thì cũng thấy ở chỗ kia, không bao giờ có chuyện
"thấy ở Điều hành mà không thấy ở Dự án".

**Luật 2 — Một màn, một đường dẫn, một con số.** Hai lối vào mở **cùng một màn**. Không sao chép
màn, không viết lại truy vấn. Hai nơi lệch số nhau là lỗi nặng nhất có thể xảy ra ở phần báo cáo.

**Luật 3 — Nhóm xuyên suốt đặt tên theo góc nhìn.** Điều hành, Giám sát & Lưu vết và Tầng 2
**không bao giờ** có module mang tên một nghiệp vụ ("Báo cáo dự án", "Cấu hình đơn thư"…). Cấp 3–4
của các nhóm này là góc nhìn chung: _tất cả · định kỳ · theo đơn vị · theo lĩnh vực_. Nội dung
riêng của từng nghiệp vụ tự chảy vào và được lọc **ngay trong màn**.

> Vì sao: có 10 nghiệp vụ, mỗi nghiệp vụ có báo cáo + chỉ số + tổng quan. Nếu mỗi thứ là một
> module riêng thì Điều hành phình tới **30 module**. Theo luật 3, Điều hành **luôn chỉ có 3**.

**Luật 4 — Trong module nghiệp vụ chỉ có một lối vào báo cáo:** một cấp 4 "Báo cáo \<đối tượng\>",
liệt kê báo cáo của chính module đó.

**Luật 5 — Thứ gì tổng hợp nhiều nghiệp vụ** (vd báo cáo kinh tế – xã hội tổng hợp) thì chủ là
Điều hành, và chỉ có ở Điều hành.

Luật này cũng áp cho nhật ký: nhật ký thao tác có một chủ (trigger trong database). Lối vào gồm
Giám sát › Nhật ký thao tác, thẻ "Nhật ký" trong hồ sơ, và chi tiết tài khoản.

> **Trạng thái:** chỗ để module khai báo phần đóng góp (`dongGop`: báo cáo, chỉ số, cảnh báo,
> việc, tham số, điểm duyệt) **chưa có trong mã**. Sẽ thêm vào registry khi xây module nghiệp vụ
> đầu tiên (Dự án), kèm test chặn "báo cáo không có chủ" và "module mang tên nghiệp vụ ở Điều hành".

---

## 3. Quy tắc ở Tầng 2, việc đang diễn ra ở Tầng 1

Tầng 2 giữ **định nghĩa**, Tầng 1 giữ **thể hiện** của định nghĩa đó. Mỗi cặp dưới đây là hai
nửa của cùng một thứ, và **không được gộp**:

| Quy tắc (Tầng 2, quản trị viên)            | Việc đang diễn ra (Tầng 1, người làm nghiệp vụ) |
| ------------------------------------------ | ----------------------------------------------- |
| Luồng phê duyệt: ai duyệt, theo thứ tự nào | Việc chờ tôi duyệt → Việc của tôi               |
| Quy tắc cảnh báo: hạn luật định, ngưỡng    | Cảnh báo đang mở → Giám sát › Hồ sơ quá hạn     |
| Nhật ký hệ thống: lỗi, hàng đợi (kỹ thuật) | Nhật ký thao tác: ai làm gì (pháp lý)           |
| Khai báo module: bật/tắt, nhãn, tham số    | Chính module đó chạy theo khai báo              |
| Chính sách đăng nhập                       | Đăng nhập, đổi mật khẩu (vỏ)                    |

Module nghiệp vụ cần tham số, vd ngưỡng "lâu không cập nhật" của Dự án, thì **khai báo tham số
đó** (luật 1). Tham số tự hiện ở module Tầng 2 phù hợp (Quy tắc cảnh báo hoặc Khai báo module).
**Không** tạo module "Cấu hình dự án".

---

## 4. Danh mục

- Chỉ lập danh mục khi có **từ hai module khác nhau lưu tham chiếu** tới nó. Màn chỉ đọc
  (báo cáo, tổng quan) đọc danh mục _qua_ hồ sơ nên không tính là nơi thứ hai.
- Mới một module dùng thì đó là **tham số của module** (xem mục 3). Khi có module thứ hai dùng
  thì chuyển lên Danh mục. Lưu theo một kiểu chung ngay từ đầu, nên lúc chuyển chỉ là đổi chỗ trên
  menu, không phải di chuyển dữ liệu.
- **Suy ra được thì không bắt khai.** Ví dụ từ PMS: "dự án chuyển tiếp / mới" tính từ năm khởi
  công; "khối Đảng / sở ngành / xã" suy ra từ loại đơn vị của chủ đầu tư.
- **Danh sách do luật quy định thì nằm trong mã**, không cho sửa: nhóm dự án A/B/C, ba giai đoạn
  đầu tư, trạng thái hồ sơ.
- Người, tổ chức (chủ đầu tư, nhà thầu, cán bộ) là **đơn vị và tài khoản**, không phải danh sách
  tên. Khai báo ở Tầng 2, tra cứu ở Danh mục › Tổ chức.

---

## 5. Quyền và dữ liệu (tóm tắt — chi tiết ở ADR)

- **Quyền = vai × phân công** (ADR-0006). Vai quyết định _làm được gì_ (Lãnh đạo · Chuyên viên ·
  Thanh tra). Phân công quyết định _làm ở phân hệ nào_. Cờ quản trị tách riêng, chỉ mở Tầng 2.
  Không thêm vai chỉ vì cần phạm vi khác.
- Mã quyền `MÃ_PHÂN_HỆ.HÀNH_ĐỘNG` **ghép** bằng `quyenCua()`, không gõ tay. API và web cùng dùng
  `tinhQuyen()`, nên menu và API không thể lệch nhau.
- **Dữ liệu** (ADR-0004):
  - RLS theo đơn vị, nên quên viết `WHERE don_vi_id` cũng không rò dữ liệu.
  - Không có xóa cứng.
  - Nhật ký do trigger ghi.
  - Chạm dữ liệu nghiệp vụ **chỉ qua `trongPhamVi()`**.
  - Luật đầy đủ ở `CLAUDE.md` mục 5.
- Chặn quan trọng thì **chặn ở database**. Ví dụ: chỉ quản trị ở đơn vị gốc mới sửa được cấu hình
  chung; thu hồi phiên của người khác thì database tự kiểm quyền.

---

## 6. Cây chuẩn

Ký hiệu: ● đã chạy · ○ màn phác (có chỗ, chưa xây). Khớp với `dang-ky.ts`.

```text
TẦNG 1 — NGHIỆP VỤ
├─ ĐIỀU HÀNH                          (góc nhìn chung — luật 3)
│  ├─ Tổng quan               ○ Toàn cảnh · Theo đơn vị · Theo lĩnh vực
│  ├─ Báo cáo điều hành       ○ Tất cả báo cáo · Báo cáo định kỳ · Xuất dữ liệu
│  └─ Bộ chỉ số               ○ Tất cả chỉ số · Xếp hạng đơn vị
├─ TÁC NGHIỆP                         (mỗi module một đối tượng có mã + hạn + người chịu trách nhiệm)
│  ├─ Dự án                   ○ Tất cả · Tôi phụ trách · Chờ xác nhận bước · Tạo mới · Nhập Excel
│  │                            · Đôn đốc · Báo cáo dự án
│  ├─ Xử lý văn bản           ○ Văn bản đến · Tóm tắt · Soạn thảo · Phân công từ văn bản · Mẫu văn bản
│  ├─ Đơn thư — Khiếu nại     ○ Tiếp nhận → Thụ lý → Giải quyết → Đã giải quyết
│  └─ Nhiệm vụ                ○ Được giao cho tôi · Tôi đã giao · Theo dõi chung
├─ DANH MỤC                           (từ hai nơi dùng)
│  ├─ Tổ chức                 ○ Đơn vị · Cán bộ          (chỉ đọc; khai báo ở Tầng 2)
│  └─ Danh mục nghiệp vụ      ○ Lĩnh vực · Quy trình mẫu · Loại văn bản
└─ GIÁM SÁT & LƯU VẾT                 (vết — người xem là thanh tra, lãnh đạo)
   ├─ Nhật ký thao tác        ● Tất cả thao tác · ○ Theo hồ sơ · ○ Theo người dùng
   └─ Hồ sơ quá hạn           ○ Đã quá hạn · Sắp đến hạn · Lâu không cập nhật

TẦNG 2 — QUẢN TRỊ HỆ THỐNG
├─ NGƯỜI DÙNG & PHÂN QUYỀN            (ai được vào, được làm gì)
│  ├─ Tài khoản               ● Danh sách · ● Bị khóa · ● Tạo tài khoản
│  ├─ Đơn vị                  ● Danh sách đơn vị
│  ├─ Vai trò & quyền         ○ Tra cứu phân công · ● Ma trận quyền
│  ├─ Chính sách đăng nhập    ● Mật khẩu & phiên · ○ Đăng nhập một lần (SSO)
│  └─ Luồng phê duyệt         ○ Luồng theo nghiệp vụ · Thêm luồng
├─ KẾT NỐI                            (nói chuyện với bên ngoài qua đâu)
│  ├─ Dịch vụ nền tảng      ○ Danh sách kết nối · Kiểm tra & trạng thái
│  ├─ Nguồn dữ liệu vào       ○ Nguồn GraphQL / ERP · Bản sao dữ liệu · Công cụ API
│  └─ Tích hợp ra             ○ Webhook · API key cho đối tác · Nhật ký gọi ra
└─ CẤU HÌNH & VẬN HÀNH                (hệ thống chạy thế nào, đang chạy ra sao)
   ├─ Khai báo module         ○ Cây phân hệ · Nhãn theo khách hàng · Tham số nghiệp vụ
   ├─ Hiển thị                ● Tên & nhận diện · ○ Trang mặc định theo vai
   ├─ Quy tắc cảnh báo        ○ Hạn & ngưỡng cảnh báo · Kênh gửi thông báo
   ├─ Mô hình AI              ○ Mô hình mặc định · Giọng đọc · Hạn mức token theo đơn vị
   └─ Theo dõi vận hành       ○ Sức khỏe hệ thống · Hàng đợi xử lý · Lưu trữ tệp · Nhật ký hệ thống
```

### Vì sao Tầng 2 đổi như trên (review 30/09/2026)

| Chỗ                                    | Trước                                    | Đổi                                                 | Theo luật                                                                                                                 |
| -------------------------------------- | ---------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Kết nối › **Nền tảng Native**          | module mang tên một hệ thống             | **Dịch vụ nền tảng**, Native là kết nối đầu tiên    | Luật 3. Khối chính phủ sẽ nối thêm trục liên thông (LGSP/NDXP), Cổng dịch vụ công… — không đẻ thêm một module mỗi lần nối |
| SSO                                    | định thêm cấp 3 mới trong Kết nối        | cấp 4 của **Chính sách đăng nhập**                  | Là _một cách được vào_, thuộc "ai được vào". Địa chỉ của cổng SSO vẫn khai ở Dịch vụ nền tảng                             |
| Vai trò & quyền › Danh sách vai trò    | trùng với ma trận (vai cố định theo ADR) | **Tra cứu phân công**: ai có quyền gì ở phân hệ nào | Một cấp 4 chỉ lặp lại cấp 4 bên cạnh thì không nên tồn tại (câu 9)                                                        |
| Luồng phê duyệt › Luồng đang dùng      | danh sách chung                          | **Luồng theo nghiệp vụ**                            | Luật 1: module khai _điểm cần duyệt_, Tầng 2 chỉ gán người duyệt                                                          |
| Khai báo module                        | bật/tắt, nhãn                            | thêm **Tham số nghiệp vụ**                          | Mục 3: tham số của module hiện ở đây, không có module "Cấu hình X"                                                        |
| Quy tắc cảnh báo › Hạn luật định (SLA) | chỉ hạn luật định                        | **Hạn & ngưỡng cảnh báo**                           | Gồm cả ngưỡng "lâu không cập nhật" của PMS, nhóm theo nghiệp vụ trong màn                                                 |
| Theo dõi vận hành                      | hàng đợi, nhật ký hệ thống               | thêm **Sức khỏe hệ thống**, **Lưu trữ tệp**         | Dung lượng tệp (PMS có) và tình trạng database/phiên bản là việc kỹ thuật, không phải của thanh tra                       |

Giữ nguyên, có lý do:

- **Đơn vị** và **Chính sách đăng nhập** không có trong bản mẫu, nhưng phải có vì GDOS tự giữ tài
  khoản (ADR-0003). Cả hai đều trả lời câu "ai được vào".
- **Mô hình AI** là một _đối tượng cấu hình_ (mô hình nào dùng cho chức năng nào), không phải nhóm
  theo công nghệ. Chỉ chọn và kiểm tra; khóa của nhà cung cấp nằm ở Native.
- **Tông màu cá nhân** không nằm trong cây. Đó là vỏ (thanh trên › Cài đặt cá nhân), vì mỗi người
  tự chọn, không phải quản trị đặt.

---

## 7. Công thức thêm một module

1. **Đặt chỗ.** Chạy qua 9 câu ở mục 1 → biết nhóm. Kiểm: module có phải _một đối tượng_ không?
   Tên có phải tên đối tượng, không phải tên công nghệ hay tên phòng ban?
2. **Khai trong `dang-ky.ts`:** `id`, `nhan`, `nhom`, `maQuyen`, `nguon`, `mo`, cấp 4 (bộ lọc ·
   chặng · thao tác). Chưa xây thì `phac: true` — cây hiện ngay, quyền chạy ngay.
3. **Khai phần đóng góp** (mục 2): báo cáo, chỉ số, cảnh báo, việc, tham số, điểm duyệt.
   **Không** sửa Điều hành, Giám sát hay Tầng 2.
4. **Dữ liệu:**
   - Bảng có `don_vi_id`, RLS, `deleted_at`.
   - Trigger nhật ký và `updated_at`.
   - Không cấp DELETE cho `gdos_app`.
   - Test "xã A không thấy dữ liệu xã B".
5. **API:** mọi route khai `@CanQuyen(...)` bằng mã của module; thân request kiểm bằng
   `chung/kiem-than.ts`; chạm dữ liệu qua `trongPhamVi()`.
6. **Web:** tạo màn trong `apps/web/src/man/`, đăng ký vào `MAN_HINH`, bỏ `phac`. Test sẽ báo nếu quên.
7. **Hồ sơ:** những thứ phải mở một hồ sơ mới xem thì làm thành **thẻ**, không thêm cấp 4.
8. `pnpm kiem-tra` xanh → cập nhật `docs/tien-do.md` → commit.

---

## 8. Dấu hiệu đang làm sai

| Thấy                                                                 | Nghĩa là                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| Module "Báo cáo X", "Thống kê X", "Cảnh báo X" ở Điều hành, Giám sát | Vi phạm luật 3 → khai phần đóng góp ở module X       |
| Module "Cấu hình X" ở Tầng 2                                         | Tham số của X → khai trong X, hiện ở Khai báo module |
| Chép một màn báo cáo sang chỗ thứ hai                                | Vi phạm luật 2 → dùng chung một màn, một đường dẫn   |
| Cấp 4 là một đối tượng khác (vd "Nhà thầu" dưới Dự án)               | Lên cấp 3, hoặc là đơn vị hay tài khoản              |
| Muốn thêm cấp 5                                                      | Đó là thẻ trong hồ sơ, hoặc bộ lọc trong màn         |
| Nhóm "Khác", "Tiện ích", "AI", "Mở rộng"                             | Ngăn kéo vứt đồ → trả lời lại 9 câu                  |
| Danh mục mà chỉ một module dùng                                      | Là tham số của module đó                             |
| Bắt người dùng khai một giá trị hệ thống tự tính được                | Bỏ ô nhập, tính tự động                              |
| Thêm vai mới để giới hạn phạm vi                                     | Dùng phân công, không thêm vai                       |
| Kiểm quyền bằng `if` trong một màn mà API không kiểm                 | API là chốt chặn, web chỉ để ẩn cho gọn              |

---

## 9. Nguồn

- ADR-0002 — cây bốn cấp và 9 câu đặt chỗ
- ADR-0003 — tài khoản độc lập, chính sách đăng nhập
- ADR-0004 — RLS, nhật ký, xóa mềm
- ADR-0006 — vai × phân công
- ADR-0007 — một chủ, nhiều lối vào
- `docs/khung-mau.html` — bản mẫu giao diện; mở thẳng bằng trình duyệt
