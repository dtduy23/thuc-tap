/**
 * Văn bản — Tác nghiệp › Xử lý văn bản (ADR-0009). Hồ sơ ở GDOS; FOXAI Native xử lý
 * (tóm tắt…). Danh sách giá trị theo Document Service của Native
 * (foxai-gdos/docs/document-service/01_Summarize.md).
 */

/** Loại văn bản — đúng danh sách Document Service nhận. */
export const LOAI_VAN_BAN = [
  'Công văn',
  'Báo cáo',
  'Kế hoạch',
  'Thông báo',
  'Quyết định',
  'Tờ trình',
  'Biên bản',
  'Hợp đồng',
  'Khác',
] as const
export type LoaiVanBan = (typeof LOAI_VAN_BAN)[number]

export const TRANG_THAI_VAN_BAN = {
  'chua-gui': 'Chưa gửi xử lý',
  cho: 'Đang chờ',
  'dang-xu-ly': 'AI đang tóm tắt',
  xong: 'Đã tóm tắt',
  loi: 'Lỗi',
} as const
export type TrangThaiVanBan = keyof typeof TRANG_THAI_VAN_BAN

export const NGUON_VAN_BAN = {
  'tai-len': 'Tải lên',
  qlvb: 'Hệ thống QLVB&ĐH',
  'cong-dvc': 'Cổng dịch vụ công',
  email: 'Email công vụ',
  khac: 'Nguồn khác',
} as const
export type NguonVanBan = keyof typeof NGUON_VAN_BAN

/** Tệp Document Service đọc được. */
export const DUOI_TEP_VAN_BAN = ['pdf', 'docx', 'txt', 'md'] as const
export const KICH_THUOC_VAN_BAN_TOI_DA = 20 * 1024 * 1024

export interface VanBanDong {
  id: string
  ten: string
  loai: string
  nguon: NguonVanBan
  tenTep: string
  /** null: văn bản kéo về từ Native, tệp gốc nằm ở Native. */
  kichThuoc: number | null
  trangThai: TrangThaiVanBan
  soKyTuGoc: number | null
  soKyTuTomTat: number | null
  /** % rút gọn = 1 − tóm tắt / gốc. */
  tyLeRutGon: number | null
  daHieuChinh: boolean
  nguoiTao: string | null
  donViTen: string
  taoLuc: string
}

export interface VanBanChiTiet extends VanBanDong {
  noiDungGoc: string | null
  tomTat: string | null
  moHinh: string | null
  loi: string | null
  /** Người xem có được gửi Native (tài khoản đã liên kết) và sửa không. */
  quyen: { xuLy: boolean; sua: boolean; xoa: boolean }
}

/** Tình trạng dùng Native của người đang xem — màn văn bản hiện thông báo theo đây. */
export interface TrangThaiXuLyVanBan {
  cheDo: 'gia' | 'that' | 'chua'
  moTa: string
  /** Tài khoản đã liên kết FOXAI Native (có native_user_id). */
  daLienKet: boolean
}

/** Một kết nối ra ngoài — Tầng 2 › Dịch vụ nền tảng. */
export interface KetNoiDong {
  ma: string
  ten: string
  /** gia: bản giả (máy dev) · that: đang nối thật · chua: chưa cấu hình. */
  cheDo: 'gia' | 'that' | 'chua'
  diaChi: string | null
  moTa: string
}

export interface KetQuaKiemTraKetNoi {
  ma: string
  ok: boolean
  thongDiep: string
  msPhanHoi: number
  luc: string
}

/** Liên kết tài khoản FOXAI Native của người đang xem (ADR-0009). */
export interface LienKetNativeDong {
  /** Máy chủ có nối Native (thật hoặc giả) để liên kết không. */
  coTheLienKet: boolean
  daLienKet: boolean
  nativeUserId: string | null
  nativeTen: string | null
  lienKetLuc: string | null
}
