/**
 * Hợp đồng dữ liệu của Tầng 2 (tài khoản, đơn vị) và nhật ký thao tác — API trả
 * đúng các kiểu này, web đọc đúng các kiểu này. Không có gì bí mật ở đây.
 */
import type { MaVai, PhanCong } from './vai-tro.js'

/**
 * Loại đơn vị. Chủ đầu tư là đơn vị (sở/ngành, cơ quan Đảng, xã…); nhà thầu, tư vấn
 * là "doanh nghiệp" — có tài khoản, nhưng chỉ thấy dự án mình là thành viên (ADR-0008).
 */
export const CAP_DON_VI = {
  tinh: 'Tỉnh',
  'so-nganh': 'Sở, ban, ngành',
  'co-quan-dang': 'Cơ quan Đảng',
  xa: 'Xã',
  'doanh-nghiep': 'Doanh nghiệp',
} as const
export type CapDonVi = keyof typeof CAP_DON_VI

/** Loại đơn vị thêm được dưới một tỉnh. Tỉnh (đơn vị gốc) chỉ tạo bằng lệnh khởi tạo. */
export const CAP_DUOI_TINH: readonly CapDonVi[] = ['so-nganh', 'co-quan-dang', 'xa', 'doanh-nghiep']

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
  /** Lĩnh vực được giám sát: XEM mọi dự án của lĩnh vực đó ở mọi đơn vị, không sửa. */
  giamSatLinhVuc: { id: string; ten: string }[]
}

/** Một dòng danh bạ cán bộ (Danh mục › Tổ chức) — chỉ thông tin để tra cứu, không có gì về bảo mật. */
export interface CanBoDong {
  id: string
  hoTen: string
  tenDangNhap: string
  donViId: string
  donViTen: string
  donViCap: string
  /** Các vai trò đang giữ (không trùng). */
  vai: MaVai[]
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
  cau_hinh: 'Cấu hình hệ thống',
  du_an: 'Dự án',
  du_an_buoc: 'Bước dự án',
  du_an_thanh_vien: 'Thành viên dự án',
  du_an_phien_ban: 'Phiên bản kế hoạch',
  du_an_van_ban: 'Văn bản dự án',
  du_an_von: 'Kế hoạch vốn',
  du_an_giai_ngan: 'Giải ngân',
  du_an_vuong_mac: 'Vướng mắc',
  du_an_gia_han: 'Yêu cầu gia hạn bước',
  du_an_don_doc: 'Đôn đốc',
  giam_sat_linh_vuc: 'Giám sát lĩnh vực',
  van_ban: 'Văn bản',
  ocr_loai: 'Loại chứng từ OCR',
  ocr_chung_tu: 'Chứng từ OCR',
  nguon_du_lieu: 'Nguồn dữ liệu vào',
  chi_tieu_lan_nap: 'Lần nạp số liệu chỉ tiêu',
  chi_tieu_so_lieu: 'Số liệu chỉ tiêu',
  benh_vien_thu: 'Diễn tập bệnh viện',
  danh_muc_gia_tri: 'Danh mục',
  quy_trinh_mau: 'Quy trình mẫu',
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
