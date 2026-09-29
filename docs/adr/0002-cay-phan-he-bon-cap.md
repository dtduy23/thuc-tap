# ADR-0002 — Cây phân hệ bốn cấp và luật đặt chỗ

- Trạng thái: **Đã chốt** · Ngày: 2026-09-29 · Người chốt: Nguyễn Mạnh Toàn
- Mã: `packages/shared/src/phan-he.ts` · Bản mẫu: `docs/khung-mau.html`

## Bối cảnh

GDOS cũ có 41 module, 16 bị ẩn khỏi sidebar nhưng route vẫn sống, 6 cặp trùng vai, và hai nhóm
là triệu chứng thiếu luật: `phan-he-mo-rong` (ngăn kéo vứt đồ) và `cau-hinh-xu-ly-van-ban` (một
nhóm cấp cao đẻ ra chỉ để chứa cấu hình của một module). Hai nhóm `tro-ly-ai`, `tri-thuc-ai` gom
theo _công nghệ_ thay vì theo _việc người dùng làm_.

## Quyết định

**Mindset:** _Khung đóng băng, ngành biến thiên ở nội dung. Mỗi cấp chỉ hỏi một câu._

```text
Cấp 1  TẦNG       Nghiệp vụ | Quản trị hệ thống                        — danh sách ĐÓNG
Cấp 2  NHÓM       Tầng 1: Điều hành · Tác nghiệp · Danh mục · Giám sát & Lưu vết
                  Tầng 2: Người dùng & Phân quyền · Kết nối · Cấu hình & Vận hành   — ĐÓNG
Cấp 3  MODULE     một ĐỐI TƯỢNG nghiệp vụ
Cấp 4  CHỨC NĂNG  một ĐƯỜNG VÀO của chính đối tượng đó
```

**Luật đặt chỗ** — hỏi theo thứ tự, dừng ở câu đầu tiên trả lời _có_:

1. Phải mở một hồ sơ trước mới xem được? → **thẻ trong hồ sơ**, không lên cây
2. Gom việc từ nhiều module cho một người? → **Việc của tôi** (vỏ, không thuộc cây)
3. Tìm kiếm / hội thoại dùng cho mọi nghiệp vụ? → **vỏ** (thanh trên, widget)
4. Chỉ đọc, tổng hợp nhiều hồ sơ? → **Điều hành**
5. Có mã hồ sơ + thời hạn đo được + người chịu trách nhiệm? → **Tác nghiệp**
6. Là vết của việc đã làm, người xem là thanh tra/lãnh đạo? → **Giám sát & Lưu vết**
7. Có từ hai nhóm nghiệp vụ tham chiếu tới? → **Danh mục**
8. Chỉ quản trị viên dùng, sai thì ảnh hưởng cả hệ? → **Tầng 2**
9. Không rơi vào câu nào → (a) đang là hai màn bị gộp, tách ra; (b) là _quy tắc_ của màn
   khác → Cấu hình; (c) không nên tồn tại.

**Luật cấp 4:** chỉ ba loại — _bộ lọc_ (Tất cả / Tôi phụ trách / Chờ xác nhận), _chặng hành
trình_ (Tiếp nhận → Thụ lý → Giải quyết, đúng thứ tự), _thao tác_ (Tạo mới, Nhập Excel). Là
đối tượng mới thì lên cấp 3.

**Không có cấp 5.** Thẻ trong hồ sơ là trục phạm vi, không phải độ sâu.

**Không bao giờ** có nhóm theo công nghệ ("AI") hay nhóm ngăn kéo ("Khác", "Mở rộng").
Tóm tắt, soạn thảo văn bản là chức năng của _Tác nghiệp › Xử lý văn bản_.

## Hệ quả — chặn bằng máy

| Luật                                              | Cách chặn                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Không thêm tầng/nhóm tùy tiện                     | `TANG`, `NHOM` là mảng `as const`; `MaNhom` suy ra từ mảng — nhóm chưa khai thì registry không biên dịch |
| Tầng 2 đúng ba nhóm, không có nhóm ngăn kéo       | test trong `phan-he.test.ts`                                                                             |
| Mã trùng, sai dạng; module không có cấp 4         | `kiemTraCay()` — registry của app phải gọi trong test                                                    |
| Màn nghiệp vụ nấp sau cờ quản trị, hoặc ngược lại | `kiemTraCay()`: Tầng 2 bắt buộc `ADMIN.*`, Tầng 1 cấm `ADMIN.*`                                          |
| Menu lọc theo quyền ở mọi cấp                     | `locTheoQuyen()` — sidebar, trang "Toàn bộ chức năng" và test dùng chung                                 |

Con số thực hành: 2–5 mục con mỗi nhóm · 3–7 màn mỗi mục · ≤25 màn một trang.

## Phương án đã loại

- **Cây phẳng như GDOS cũ:** đã chứng minh là trôi (41 module, 8 nhóm, 2 nhóm vô nghĩa).
- **Nhóm theo vai trò ("Lãnh đạo / Chuyên viên"):** người dùng không biết mình thuộc nhóm nào,
  nội dung chồng lấn phải nhân bản. Vai trò dùng để _lọc_, không để _phân nhóm_.
- **Nhóm theo phòng ban:** việc đi xuyên phòng ban (đề xuất → duyệt → kế toán) bị cắt vụn.
- **Nhóm "AI":** tiền lệ menu _Tools_ của Office 2003 — gom theo loại công cụ thành ngăn kéo.
