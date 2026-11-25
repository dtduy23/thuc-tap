import type { SoLieuBenhVien } from './benh-vien.js'

export const SO_PHIM_LICH_SU = 5_000
export const NGUON_PHIM = {
  'benh-vien': 'Máy X-quang bệnh viện',
  'xe-luu-dong': 'Xe X-quang lưu động',
} as const
export type NguonPhim = keyof typeof NGUON_PHIM
export const NHAN_PHIM = {
  'khong-co-dau': 'Không có dấu hiệu',
  'co-dau': 'Có dấu hiệu',
  'khong-doc': 'Không đạt chất lượng',
} as const
export type NhanPhim = keyof typeof NHAN_PHIM
export type TrangThaiPhim = 'cho-nhan' | 'cho-duyet' | 'da-duyet'
export type LocPhim = TrangThaiPhim | 'tat-ca'

export interface PhimThu {
  ma: string
  so: number
  maChiDinh: string
  nguon: NguonPhim
  nhom: 'Học' | 'Đánh giá' | 'Chạy song song'
  trangThai: TrangThaiPhim
  nhan: NhanPhim | null
  goiY: {
    nhan: Exclude<NhanPhim, 'khong-doc'>
    diem: number
    phienBan: string
    tonThuong?: string[]
    doTinCay?: number
  } | null
  capNhatLuc: string | null
  hoTen?: string
  tuoi?: number
  khoaChiDinh?: string
  tonThuongPhatHien?: string[]
}

export interface DanhSachPhimThu {
  dong: PhimThu[]
  tong: number
  choNhan: number
  choDuyet: number
  daDuyet: number
  daChay: number
}

export const VIEC_NGHIEN_CUU = [
  { ma: 'de-cuong', ten: 'Đề cương và kế hoạch ẩn danh' },
  { ma: 'dao-duc', ten: 'Biên bản Hội đồng đạo đức' },
  { ma: 'phan-loai', ten: 'Hồ sơ phân loại thiết bị y tế' },
  { ma: 'dao-tao', ten: 'Đào tạo sử dụng và phản hồi của người đọc' },
] as const
export type MucNghienCuu = (typeof VIEC_NGHIEN_CUU)[number]['ma']
export type LoaiDoiChieu = 'dungCoDau' | 'dungKhongDau' | 'baoDu' | 'boSot'
export interface DongDoiChieuPhimThu {
  ma: string
  nguon: NguonPhim
  nhom: PhimThu['nhom']
  nhan: Exclude<NhanPhim, 'khong-doc'>
  goiY: Exclude<NhanPhim, 'khong-doc'>
  diem: number
  ketQua: LoaiDoiChieu
}
export interface NghienCuuPhimThu {
  viec: { ma: MucNghienCuu; daGhiNhan: boolean; luc: string | null }[]
  doiChieu: Record<LoaiDoiChieu, number>
  chiTietDoiChieu?: DongDoiChieuPhimThu[]
  soPhimLichSu: number
  daDuyet: number
  choDuyet: number
  choNhan: number
  daChaySongSong: number
}

export const NGUON_BENH_VIEN = [
  { ma: 'his', ten: 'HIS', chiTieu: ['BV-01', 'BV-02', 'BV-03', 'BV-04', 'BV-05'] },
  { ma: 'lis', ten: 'LIS', chiTieu: ['BV-06'] },
  { ma: 'x-quang', ten: 'Máy X-quang', chiTieu: ['BV-07'] },
  { ma: 'bhxh', ten: 'Cổng BHXH', chiTieu: ['BV-08', 'BV-09'] },
  { ma: 'vitimes', ten: 'VITIMES', chiTieu: ['BV-10', 'BV-11'] },
] as const
export type MaNguonBenhVien = (typeof NGUON_BENH_VIEN)[number]['ma']
export interface KetNoiBenhVienThu {
  ma: MaNguonBenhVien
  ten: string
  ky: string
  luc: string | null
  soLieu: SoLieuBenhVien[]
}

export const TRANG_THAI_BHYT_THU = {
  'cho-ra-soat': 'Chờ rà soát',
  'can-sua': 'Cần bổ sung',
  'cho-duyet': 'Chờ duyệt',
  'da-duyet': 'Đã duyệt',
  'da-gui': 'Đã gửi BHXH',
} as const
export type TrangThaiBhytThu = keyof typeof TRANG_THAI_BHYT_THU
export interface HoSoBhytThu {
  ma: string
  ngay: string
  maThe: string | null
  maDichVu: string | null
  trangThai: TrangThaiBhytThu
  loi: string[]
  hoTen?: string
  namSinh?: number
  khoa?: string
  tongChiPhi?: number
  tienBhyt?: number
  mucDoRuiRo?: 'thap' | 'trung-binh' | 'cao'
  goiYAI?: string
}

export const KET_QUA_NHAC_LAO = { 'da-xac-nhan': 'Đã xác nhận', 'bo-lo': 'Cần liên hệ lại' } as const
export type KetQuaNhacLao = keyof typeof KET_QUA_NHAC_LAO
export interface CaLaoThu {
  ma: string
  batDau: string
  theoDoi: string
  maIcd: string
  hoanTat: boolean
  lanTheoDoi: { ngay: string; ketQua: KetQuaNhacLao | null }[]
  dongBoLuc: string | null
  hoTen?: string
  namSinh?: number
  gioiTinh?: 'Nam' | 'Nữ'
  phanLoai?: 'Mới' | 'Tái phát' | 'Sau bỏ trị' | 'Thất bại' | 'Kháng thuốc (MDR/RR)'
  theBenh?: 'Lao phổi AFB(+)' | 'Lao phổi AFB(-)' | 'Lao ngoài phổi'
  phacDo?: string
  tuanThuDots?: number
  ketQuaXnDom?: { thang: number; ketQua: 'Dương tính' | 'Âm tính'; ngayXn: string }[]
}

export const CHU_DE_TRO_LY_BENH_VIEN = {
  'ma-icd': 'Tra mã ICD trong hồ sơ mẫu',
  'nhac-theo-doi': 'Nhắc theo dõi điều trị lao',
  'du-thao': 'Dự thảo văn bản giao ban',
  'so-lieu': 'Hỏi đáp số liệu điều hành',
  'kiem-tra-don-thuoc': 'Kiểm tra đơn thuốc & phác đồ lao',
  'soan-thao': 'Soạn thảo văn bản y khoa mẫu BYT',
} as const
export type ChuDeTroLyBenhVien = keyof typeof CHU_DE_TRO_LY_BENH_VIEN
export interface TraLoiBenhVienThu {
  noiDung: string
  nguon: string
}
