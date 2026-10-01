# Chuẩn lưới danh sách — bắt buộc đọc trước khi làm bất kỳ lưới nào

> Lấy nguyên từ chuẩn của PRM (`PRM/docs/system/grid_screen_standard.md`, màn mẫu "Cơ hội
> kinh doanh") — chủ đầu tư đã phải nhắc nhiều lần: _"Ví dụ dưới một cột cần một bộ lọc."_
> File này là **hợp đồng**. Làm lưới mà bỏ mục nào ở §1 thì phải nói rõ lý do với chủ đầu
> tư, không im lặng bỏ qua.
>
> GDOS là React nên **không chép mã Vue/PrimeVue của PRM** — dùng component chung
> `apps/web/src/ui/luoi/luoi.tsx`. Mọi mục ở §1 đã có sẵn trong component đó.

## 1. Danh sách kiểm — tick đủ mới coi là xong

Mỗi ô tự kiểm trên trình duyệt, không suy từ mã nguồn.

| #   | Hạng mục                                                                                     | Trong `Luoi`                        |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | **Mỗi cột có một ô lọc ngay dưới tiêu đề**                                                   | hàng lọc thứ hai của `thead`        |
| 2   | Cột chữ: nút **toán tử** (6: chứa, không chứa, bằng, không bằng, bắt đầu, kết thúc) + ô nhập | `kieu: 'chu'`                       |
| 3   | Cột số: nút **toán tử** (5: =, >, ≥, <, ≤) + ô nhập số                                       | `kieu: 'so'`                        |
| 4   | Cột ngày: chọn **khoảng từ–đến**                                                             | `kieu: 'ngay'` (giá trị YYYY-MM-DD) |
| 5   | Cột danh mục / trạng thái: **chọn nhiều** (lọc IN)                                           | `kieu: 'danh-muc'` + `luaChon`      |
| 6   | Ô **tìm tổng** trên thanh công cụ, quét mọi cột đang hiện, không dấu                         | có sẵn                              |
| 7   | Nút **Xóa lọc (n)** — đếm số bộ lọc đang bật                                                 | có sẵn                              |
| 8   | **Ẩn/hiện cột** + **kéo–thả thứ tự** (kèm nút ↑↓)                                            | nút "Cột n/m" → `chon-cot.tsx`      |
| 9   | **Ghim cột** trái cho cột định danh                                                          | mặc định ghim cột đầu               |
| 10  | **Giãn/gọn dòng**                                                                            | nút "Giãn dòng"                     |
| 11  | **Kéo đổi bề rộng cột**                                                                      | kéo mép phải tiêu đề cột            |
| 12  | **Xuất Excel** đúng phần đang lọc, đúng cột đang hiện                                        | `POST /api/xuat-bang`               |
| 13  | **Phân trang** + tổng số bản ghi thật                                                        | 25/50/100/200 mỗi trang             |
| 14  | Nhớ ghim/ẩn/thứ tự/bề rộng/giãn vào **localStorage**                                         | khóa `gdos-luoi:<ma>`               |
| 15  | Dòng **tổng** (đếm bản ghi · cộng tiền) theo phần đang lọc                                   | cột có `cong: true`                 |
| 16  | Rỗng nói rõ vì sao (chưa có dữ liệu ≠ lọc không ra)                                          | prop `rong` + "Không khớp bộ lọc"   |

## 2. Cách dùng

```tsx
const COT: CotLuoi<DuAnDong>[] = [
  { id: 'ten', nhan: 'Tên dự án', kieu: 'chu', rong: 300, batBuoc: true, giaTri: (d) => d.ten },
  { id: 'cdt', nhan: 'Chủ đầu tư', kieu: 'danh-muc', giaTri: (d) => d.donViTen },
  { id: 'tongMuc', nhan: 'Tổng mức (tr.đ)', kieu: 'so', cong: true, giaTri: (d) => d.tongMuc },
  { id: 'capNhat', nhan: 'Cập nhật', kieu: 'ngay', giaTri: (d) => d.capNhatNgay },
]
<Luoi ma="du-an-tat-ca" tieuDe="Danh sách dự án" cot={COT} dong={ds} khoa={(d) => d.id}
      moDong={(d) => mo(d)} rong="Chưa có dự án nào." congCu={<NutTao />} />
```

- **Một thông tin một cột** — đừng dồn mã, tên, đơn vị vào một ô: dồn thì không lọc riêng được.
- `giaTri` trả giá trị **thô** (để lọc, sắp, xuất); `hien` chỉ để vẽ (chip, link…).
- `batBuoc`: không ẩn được. `an`: ẩn khi người dùng chưa chỉnh gì. `khongLoc`: cột nút thao tác.
- `chon`: cột ô chọn dòng (vd Đôn đốc chọn dự án).
- `ma` là khóa nhớ thiết lập — **đổi bộ cột lớn thì đổi `ma`** (thêm `-v2`). Thiết lập cũ không
  bao giờ làm mất cột mới (`apThuTu`: id lạ xếp cuối).

## 3. Lọc ở máy người dùng hay ở máy chủ

| Dữ liệu                    | Cách làm                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| ≤ vài trăm dòng            | Tải hết, `Luoi` lọc/sắp ở máy người dùng (mọi danh sách hiện có của GDOS) |
| lớn hơn / tăng không ngừng | Lọc ở máy chủ, phân trang theo mã — vd **Nhật ký thao tác** (xem §4)      |

## 4. Chỗ chưa dùng `Luoi` — và vì sao

| Màn                                               | Lý do                                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Giám sát › Nhật ký thao tác                       | Dữ liệu tăng mãi, lọc ở máy chủ (bảng, hành động, khoảng ngày, hồ sơ, người); cần bản `Luoi` lọc máy chủ |
| Bảng trong hồ sơ dự án (checklist, vốn, văn bản…) | Là "lưới dòng trong hồ sơ", có sửa tại chỗ — theo mẫu riêng                                              |
| Danh mục (lĩnh vực, nguồn vốn…)                   | Bảng cấu hình vài dòng, có đổi thứ tự bằng tay — sắp xếp theo cột sẽ phá thứ tự đó                       |
| Bảng báo cáo (Biểu 01/02/03…)                     | Bố cục theo mẫu biểu của tỉnh, tham số ở đầu báo cáo                                                     |

## 5. Lỗi đã mắc — đừng lặp lại

| Lỗi                                    | Hậu quả                                 | Cách tránh                                 |
| -------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Lưới không có ô lọc dưới cột           | Chủ đầu tư phải nhắc lại nhiều lần      | Dùng `Luoi`, tick đủ §1 trước khi báo xong |
| Tự dựng bảng lọc riêng cho một màn     | Mỗi màn một kiểu, sửa một chỗ không lan | Chỉ dùng `ui/luoi`                         |
| Dồn nhiều thông tin vào một ô          | Không lọc riêng được                    | Một thông tin một cột                      |
| Ẩn cột rồi bỏ luôn khỏi dữ liệu gửi đi | Ghi rỗng đè dữ liệu thật                | Ẩn là hiển thị, không phải xóa             |
