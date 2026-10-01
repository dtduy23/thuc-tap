import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

/** Số liệu bản gốc viết thẳng trong `V.ditich` — không nằm trong object `D`. */

export interface TheSo {
  nhan: string
  giaTri: string
  phu: string
  mau: string
  drill: ChiTieuDrill
}

export const THE_DI_TICH: TheSo[] = [
  {
    nhan: 'DI TÍCH & ĐIỂM DTLS',
    giaTri: '8',
    phu: 'quanh phường · kết nối tour núi Bà',
    mau: 'var(--brand)',
    drill: {
      ten: 'Di tích & điểm DTLS',
      val: 18,
      sub: 'điểm trên địa bàn',
      pct: 100,
      mod: 'ditich',
      dv: 'Văn hóa - Xã hội',
    },
  },
  {
    nhan: 'XẾP HẠNG QUỐC GIA',
    giaTri: '5',
    phu: '1 Quốc gia đặc biệt (TW Cục)',
    mau: 'var(--gdos-accent)',
    drill: {
      ten: 'Di tích xếp hạng Quốc gia',
      val: 5,
      sub: 'điểm · trong đó 1 Quốc gia đặc biệt',
      pct: 100,
      mod: 'ditich',
      dv: 'Văn hóa - Xã hội',
    },
  },
  {
    nhan: 'ĐÃ SỐ HÓA QR / 360°',
    giaTri: '6 / 2',
    phu: 'điểm gắn mã · tour ảo',
    mau: 'var(--teal)',
    drill: {
      ten: 'Điểm đã số hóa QR / 360°',
      val: 14,
      sub: 'QR · 6 tour ảo 360°',
      pct: 78,
      mod: 'ditich',
      dv: 'Văn hóa - Xã hội',
    },
  },
]

/** Donut "8 điểm theo xếp hạng". */
export const THEO_XEP_HANG: MucChart[] = [
  ['QG đặc biệt', 1, '#E5484D'],
  ['Quốc gia', 4, '#7C3AED'],
  ['Kiểm kê phường', 3, '#5A6B7F'],
]
export const TONG_DIEM = '8'

/** Bar "Lượt quét QR thuyết minh theo điểm · 30 ngày". */
export const QUET_THEO_DIEM: MucChart[] = [
  ['Núi Bà Đen', 3240, '#1B66E0'],
  ['Tòa Thánh', 2410, '#7C3AED'],
  ['TW Cục MN', 1180, '#E5484D'],
  ['Đình H.Ninh', 620, '#0E9488'],
]

export const DRILL_SO_HOA: ChiTieuDrill = {
  ten: 'Điểm đã số hóa QR / 360°',
  val: 75,
  sub: '% · 6/8 điểm',
  pct: 75,
  mod: 'ditich',
  dv: 'Văn hóa - Xã hội',
}

/** Ba cảnh của trình xem 360° nội bộ. */
export const CANH_360 = ['Sân trước & cổng di tích', 'Gian trưng bày hiện vật', 'Phòng truyền thống']

/** Từ khóa ảnh cho từng cảnh — P360KW của bản gốc. */
export const KW_360 = ['temple', 'pagoda', 'shrine']

/** Chú giải ghim trên bản đồ — màu phải khớp `c` trong `D.dt`. */
export const CHU_GIAI_GHIM: { nhan: string; mau: string }[] = [
  { nhan: 'Xếp hạng Quốc gia', mau: '#7C3AED' },
  { nhan: 'Kiểm kê cấp phường', mau: '#1B66E0' },
  { nhan: 'Địa chỉ đỏ', mau: '#E5484D' },
]
