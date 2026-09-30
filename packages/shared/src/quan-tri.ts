/**
 * Hợp đồng dữ liệu của Tầng 2 (tài khoản, đơn vị) và nhật ký thao tác — API trả
 * đúng các kiểu này, web đọc đúng các kiểu này. Không có gì bí mật ở đây.
 */
import type { PhanCong } from './vai-tro.js'

export const CAP_DON_VI = { tinh: 'Tỉnh', xa: 'Xã' } as const
export type CapDonVi = keyof typeof CAP_DON_VI

export interface DonViDong {
  id: string
  ma: string
  ten: string
  cap: CapDonVi
  chaId: string | null
  /** Tài khoản còn dùng (chưa xóa) thuộc đơn vị. */
  soTaiKhoan: number
}

export interface TaiKhoanDong {
  id: string
  tenDangNhap: string
  hoTen: string
  donViId: string
  donViTen: string
  laQuanTri: boolean
  nativeUserId: string | null
  trangThai: 'hoat-dong' | 'khoa'
  /** Khóa TẠM do nhập sai nhiều lần (ISO) — hết hạn thì tự mở. */
  khoaTamDen: string | null
  phaiDoiMatKhau: boolean
  taoLuc: string
  phanCong: PhanCong[]
}

/** Trả MỘT lần khi tạo tài khoản / đặt lại mật khẩu — không lưu, không xem lại được. */
export interface KetQuaCapMatKhau {
  taiKhoan: TaiKhoanDong
  matKhauTam: string
}

export interface NhatKyDong {
  id: number
  luc: string
  /** null = hệ thống tự làm (vd đếm lần đăng nhập sai). */
  taiKhoanId: string | null
  /** null mà có taiKhoanId = người làm ở đơn vị ngoài phạm vi của người xem. */
  nguoiLam: string | null
  donViTen: string | null
  hanhDong: string
  bang: string
  banGhiId: string | null
  giaTriCu: Record<string, unknown> | null
  giaTriMoi: Record<string, unknown> | null
}

export interface TrangNhatKy {
  dong: NhatKyDong[]
  /** Đưa vào `truoc` để lấy trang kế; null = hết. */
  tiep: number | null
}

export const TEN_BANG: Record<string, string> = {
  don_vi: 'Đơn vị',
  tai_khoan: 'Tài khoản',
  phan_cong: 'Phân công',
}

export const TEN_HANH_DONG_NHAT_KY: Record<string, string> = {
  INSERT: 'Thêm mới',
  UPDATE: 'Sửa',
  XOA_MEM: 'Xóa',
  DOI_MAT_KHAU: 'Đổi mật khẩu',
  DELETE: 'Xóa hẳn',
}

/**
 * Tên đăng nhập: chữ không dấu, số, dấu chấm, gạch — 3 đến 50 ký tự, bắt đầu
 * bằng chữ hoặc số. Web và API kiểm cùng một luật.
 */
const TEN_DANG_NHAP = /^[a-z0-9][a-z0-9._-]{2,49}$/i

export function kiemTenDangNhap(ten: string): string | null {
  return TEN_DANG_NHAP.test(ten)
    ? null
    : 'Tên đăng nhập 3–50 ký tự: chữ không dấu, số, dấu chấm, gạch ngang/dưới; bắt đầu bằng chữ hoặc số'
}
