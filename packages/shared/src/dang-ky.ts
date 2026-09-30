/**
 * REGISTRY — danh sách module cấp 3 và chức năng cấp 4 CÓ THẬT của GDOS.
 *
 * Nguồn duy nhất cho: cây sidebar (web), kiểm quyền (API), trang "Toàn bộ chức
 * năng". Chỉ khai module đã có màn hình — bản mẫu docs/khung-mau.html là đặc tả,
 * không phải danh sách để khai trước.
 *
 * Thêm module: khai ở đây + tạo màn hình + viết test quyền. `kiemTraCay()` chạy
 * trong test nên khai sai là CI đỏ.
 */
import type { ModuleDef } from './phan-he.js'

export const DANH_SACH_MODULE: readonly ModuleDef[] = [
  // ── Tầng 1 · Giám sát & Lưu vết ─────────────────────────────────────────
  {
    id: 'nhat-ky',
    nhan: 'Nhật ký thao tác',
    nhom: 'giam-sat',
    maQuyen: 'NHAT_KY',
    nguon: 'db',
    mo: 'Ai, lúc nào, làm gì — bằng chứng pháp lý. Do database tự ghi, không ai sửa hay xóa được.',
    con: [{ id: 'nk-tat-ca', nhan: 'Tất cả thao tác' }],
  },

  // ── Tầng 2 · Người dùng & Phân quyền ────────────────────────────────────
  {
    id: 'qt-tai-khoan',
    nhan: 'Tài khoản',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_TAI_KHOAN',
    nguon: 'db',
    mo: 'Tạo, khóa tài khoản; gán vai và phân công phân hệ.',
    con: [
      { id: 'tk-ds', nhan: 'Danh sách tài khoản' },
      { id: 'tk-tao', nhan: 'Tạo tài khoản', hanhDong: 'CREATE' },
    ],
  },
  {
    id: 'qt-don-vi',
    nhan: 'Đơn vị',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_DON_VI',
    nguon: 'db',
    mo: 'Đơn vị hành chính (tỉnh, xã). Phạm vi dữ liệu của mỗi tài khoản tính theo đơn vị.',
    con: [{ id: 'dv-ds', nhan: 'Danh sách đơn vị' }],
  },
  {
    id: 'qt-vai-tro',
    nhan: 'Vai trò & quyền',
    nhom: 'qt-nguoi-dung',
    maQuyen: 'QT_VAI_TRO',
    nguon: 'db',
    mo: 'Ba vai cố định (ADR-0006) và ma trận quyền sinh ra từ đó. Chỉ xem — vai đổi bằng ADR, không đổi bằng màn hình.',
    con: [{ id: 'vt-ma-tran', nhan: 'Ma trận quyền' }],
  },

  // ── Tầng 2 · Cấu hình & Vận hành ────────────────────────────────────────
  {
    id: 'qt-cau-hinh',
    nhan: 'Cấu hình hệ thống',
    nhom: 'qt-cau-hinh',
    maQuyen: 'QT_CAU_HINH',
    nguon: 'db',
    mo: 'Chính sách đăng nhập, mật khẩu và tên hiển thị của hệ thống. Chỉ quản trị ở đơn vị gốc được sửa.',
    con: [
      { id: 'ch-bao-mat', nhan: 'Đăng nhập & mật khẩu' },
      { id: 'ch-nhan-dien', nhan: 'Tên & nhận diện' },
    ],
  },
]
