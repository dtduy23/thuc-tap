# Tiến độ

Đọc file này **đầu mỗi phiên**. Cập nhật **cuối mỗi phiên**: xong gì, dở gì, phát hiện gì.

## Các mốc

| Mốc   | Nội dung                                                                             | Trạng thái                                         |
| ----- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **0** | Khởi tạo repo, CI, ADR, khung dùng chung                                             | ✅ Xong — **CI/CD giao kỹ thuật FOXAI** (xem dưới) |
| **1** | Nền móng: tài khoản, đơn vị, vai trò & quyền, RLS, nhật ký, khung portal + cây 4 cấp | ✅ Xong — nhánh `moc-1-nen-mong`, chưa đẩy         |
| **2** | Đưa lên máy thử (image, nginx, CI/CD)                                                | Chưa bắt đầu                                       |
| **3** | Module Dự án (từ PMS)                                                                | Chưa bắt đầu                                       |
| **4** | Module Khiếu nại đất đai                                                             | Chưa bắt đầu                                       |
| **5** | Nối FOXAI Native (văn bản, tóm tắt, hỏi đáp)                                         | Chưa bắt đầu — **chờ đội Native**                  |
| **6** | Điều hành: dashboard, báo cáo                                                        | Chưa bắt đầu                                       |
| **7** | Thiết lập: bật/tắt module theo đơn vị, cảnh báo, luồng duyệt                         | Chưa bắt đầu                                       |

## Mốc 1 — Nền móng

| Phiên | Việc                                                                                                                        | Trạng thái    |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **1** | Vai trò & tính quyền · lược đồ · RLS · nhật ký · test bảo mật DB                                                            | ✅ 30/09/2026 |
| **2** | Đăng nhập (argon2id của Node, cookie HttpOnly, refresh xoay vòng, khóa khi sai) · CLI tạo quản trị viên · guard quyền ở API | ✅ 30/09/2026 |
| **3** | Web: khung portal + cây 4 cấp lọc quyền (mang từ `docs/khung-mau.html` + GDOS cũ) · màn đăng nhập                           | ✅ 30/09/2026 |
| **4** | Tầng 2: Tài khoản · Phân công · Đơn vị · Ma trận quyền · Nhật ký thao tác (API + màn hình)                                  | ✅ 30/09/2026 |
| **5** | Cấu hình hệ thống (chính sách bảo mật, tên & nhận diện) · tông màu kiểu PMS · cài đặt cá nhân                               | ✅ 30/09/2026 |

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
