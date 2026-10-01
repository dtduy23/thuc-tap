import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { MauPill } from '@/dieu-hanh/mocks/types'

/** Số liệu bản gốc viết thẳng trong `V.datdai` — không nằm trong object `D`. */

/** Donut "Cơ cấu sử dụng đất (ha)". */
export const CO_CAU_DAT: MucChart[] = [
  ['Đất ở', 520, '#D97E06'],
  ['Nông nghiệp', 430, '#12A150'],
  ['TM-DV', 98, '#7C3AED'],
  ['Công cộng', 186, '#1B66E0'],
]
export const TONG_DIEN_TICH = '1.234'

/** Bar "Hồ sơ đất đai tháng này theo loại". */
export const HO_SO_THEO_LOAI: MucChart[] = [
  ['Biến động', 12, '#1B66E0'],
  ['Tách thửa', 8, '#B7791F'],
  ['Cấp GCN', 6, '#12A150'],
  ['Chuyển MĐ', 3, '#7C3AED'],
]

/** Line "Hồ sơ đất đai 6 tháng". */
export const HO_SO_6_THANG = [18, 22, 19, 25, 23, 29]
export const KY_6_THANG = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4']
export const MAU_HO_SO = '#B7791F'

export const DRILL_HO_SO: ChiTieuDrill = {
  ten: 'Hồ sơ đất đai tiếp nhận',
  val: 29,
  sub: 'hồ sơ · tháng 4 · tăng 38% sau sắp xếp',
  pct: 60,
  mod: 'datdai',
  dv: 'Địa chính - Xây dựng',
}

/** Danh sách "Hồ sơ đất đai đang xử lý" — bấm để định vị thửa trên bản đồ. */
export interface HoSoDat {
  ma: string
  moTa: string
  nhan: string
  mau: MauPill
  /** Id thửa trong `D.parcels`. */
  thua: string
}

export const HO_SO_DANG_XU_LY: HoSoDat[] = [
  { ma: 'ĐĐ-2026-0312', moTa: 'Tách thửa · thửa 125/32', nhan: 'Quá hạn', mau: 'red', thua: '125/32' },
  { ma: 'ĐĐ-2026-0318', moTa: 'Biến động · thửa 126/32', nhan: 'Hạn nay', mau: 'yel', thua: '126/32' },
  { ma: 'ĐĐ-2026-0324', moTa: 'Cấp GCN · thửa 141/32', nhan: 'Xử lý', mau: 'blue', thua: '141/32' },
]

/** Ba thẻ số của tab "Địa giới hành chính". */
export interface TheDiaGioi {
  nhan: string
  giaTri: string
  phu: string
  mau: string
  drill: ChiTieuDrill
}

export const THE_DIA_GIOI: TheDiaGioi[] = [
  {
    nhan: 'DIỆN TÍCH TỰ NHIÊN',
    giaTri: '100 km²',
    phu: 'sau sắp xếp đơn vị hành chính',
    mau: 'var(--brand)',
    drill: {
      ten: 'Diện tích tự nhiên',
      val: 100,
      sub: 'km² · theo nghị quyết sắp xếp đơn vị hành chính',
      pct: 100,
      mod: 'datdai',
      dv: 'Địa chính - Xây dựng',
    },
  },
  {
    nhan: 'ĐVHC CŨ HỢP NHẤT',
    giaTri: '6',
    phu: 'Xã A · Xã B · Phường C · Xã D +2',
    mau: 'var(--teal)',
    drill: {
      ten: 'Đơn vị hành chính cũ hợp nhất',
      val: 6,
      sub: 'đơn vị: Xã A, Xã B, Phường C, Xã D + phần Xã E, Xã F',
      pct: 100,
      mod: 'datdai',
      dv: 'Văn phòng UBND',
    },
  },
  {
    nhan: 'MỐC ĐỊA GIỚI',
    giaTri: '6 / 6',
    phu: 'đã cắm & số hóa',
    mau: 'var(--ok)',
    drill: {
      ten: 'Mốc địa giới số hóa',
      val: 6,
      sub: '/ 6 mốc đã cắm',
      pct: 100,
      mod: 'datdai',
      dv: 'Địa chính - Xây dựng',
    },
  },
]

/** Toạ độ VN-2000 của 6 mốc địa giới — bảng "Hồ sơ mốc địa giới · 513/CP". */
export const TOA_DO_MOC = [
  '2325 461 · 583 12',
  '2325 872 · 583 66',
  '2325 655 · 584 03',
  '2325 214 · 584 11',
  '2324 987 · 583 71',
  '2325 102 · 583 24',
]

/** Màu nét thửa dùng cho chú giải dưới bản đồ — khớp `NET`/`NET_CHON` khi vẽ. */
export const CHU_GIAI_THUA = {
  thua: { nen: 'rgba(127,166,255,.22)', vien: '1.5px solid #2A5CFF' },
  dangChon: { nen: '#3D7BFF', vien: '2px solid #C2183B' },
} as const

/** Màu chữ hai dòng chú giải của tab địa giới — khớp nét vẽ trên bản đồ. */
export const MAU_RANH_MOI = '#E5484D'
