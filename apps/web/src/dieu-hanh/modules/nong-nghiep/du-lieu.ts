import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { MauPill, TrangThai } from '@/dieu-hanh/mocks/types'

/** Số liệu bản gốc viết thẳng trong `V.nongnghiep` — không nằm trong object `D`. */

/** 4 thẻ số đầu tab "Truy xuất nguồn gốc". */
export interface TheSo {
  nhan: string
  giaTri: string
  phu: string
  mau: string
  drill: ChiTieuDrill
}

export const THE_TRUY_XUAT: TheSo[] = [
  {
    nhan: 'MÃ VÙNG TRỒNG',
    giaTri: '8',
    phu: 'đã cấp QR · mãng cầu chủ lực',
    mau: 'var(--brand)',
    drill: {
      ten: 'Mã vùng trồng đã cấp',
      val: 8,
      sub: 'mã QR đang vận hành · mãng cầu Bà Đen',
      pct: 100,
      mod: 'nongnghiep',
      dv: 'Kinh tế - Nông nghiệp',
    },
  },
  {
    nhan: 'DIỆN TÍCH',
    giaTri: '238 ha',
    phu: 'mãng cầu · lúa · rau',
    mau: 'var(--ok)',
    drill: {
      ten: 'Diện tích truy xuất',
      val: 238,
      sub: 'ha · mãng cầu, lúa, rau',
      pct: 91,
      mod: 'nongnghiep',
      dv: 'Kinh tế - Nông nghiệp',
    },
  },
  {
    nhan: 'HỘ THAM GIA',
    giaTri: '56',
    phu: 'nhật ký điện tử',
    mau: 'var(--teal)',
    drill: {
      ten: 'Hộ ghi nhật ký điện tử',
      val: 56,
      sub: 'hộ sản xuất',
      pct: 93,
      mod: 'nongnghiep',
      dv: 'Kinh tế - Nông nghiệp',
    },
  },
  {
    nhan: 'LƯỢT QUÉT QR',
    giaTri: '4.218',
    phu: '30 ngày qua',
    mau: 'var(--gdos-accent)',
    drill: {
      ten: 'Lượt quét QR 30 ngày',
      val: 4218,
      sub: 'lượt người mua quét',
      pct: 100,
      mod: 'nongnghiep',
      dv: 'Kinh tế - Nông nghiệp',
    },
  },
]

/** Bar "Diện tích theo vùng trồng (ha)". */
export const DIEN_TICH_VUNG: MucChart[] = [
  ['M.cầu BĐ', 86, '#12A150'],
  ['M.cầu VGAP', 64, '#0E9488'],
  ['Lúa ST25', 42, '#1B66E0'],
  ['Nhãn', 18, '#D97E06'],
  ['Rau AT', 12, '#7C3AED'],
]

/** Line "Lượt quét QR 6 tháng". */
export const QUET_QR_6_THANG = [980, 1120, 1040, 1310, 1560, 1860]
export const KY_6_THANG = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4']
export const DRILL_QUET_QR: ChiTieuDrill = {
  ten: 'Lượt quét QR truy xuất',
  val: 1860,
  sub: 'lượt / tháng · tăng 90% so T11',
  pct: 100,
  mod: 'nongnghiep',
  dv: 'Kinh tế - Nông nghiệp',
}

/** Donut "Cơ cấu nhóm cây (ha)". */
export const CO_CAU_CAY: MucChart[] = [
  ['Mãng cầu', 150, '#12A150'],
  ['Lúa', 42, '#1B66E0'],
  ['Rau màu', 12, '#0E9488'],
  ['Khác', 34, '#5A6B7F'],
]
export const TONG_DIEN_TICH = '238'

/* ---------- Tab "Thời tiết & Sâu bệnh" ---------- */

export const THOI_TIET_HOM_NAY = {
  nhietDo: '32°',
  moTa: 'Nắng, chiều mưa rào',
  phu: 'Độ ẩm 78% · Gió ĐN cấp 3',
  canhBao: 'Khuyến cáo: hoãn phun thuốc 10–11/04 do mưa lớn',
  nhanCanhBao: '⚠ Mưa lớn 10/04',
}

/** 7 ngày: [thứ, nhiệt độ, có mưa lớn]. */
export const THOI_TIET_7_NGAY: [string, number, 0 | 1][] = [
  ['T4', 32, 0],
  ['T5', 33, 0],
  ['T6', 29, 1],
  ['T7', 27, 1],
  ['CN', 28, 0],
  ['T2', 30, 0],
  ['T3', 31, 0],
]

export interface SauBenh {
  ten: string
  viTri: string
  muc: string
  mau: MauPill
  pct: number
  khuyenCao: string
}

export const SAU_BENH: SauBenh[] = [
  {
    ten: 'Rầy nâu — Lúa ST25',
    viTri: 'Cánh đồng Nam · 820 con/m² (ngưỡng 750)',
    muc: 'Cao',
    mau: 'red',
    pct: 82,
    khuyenCao: 'Phun sinh học trước 09/04 — sau đó mưa lớn 2 ngày',
  },
  {
    ten: 'Sâu cuốn lá — Lúa nếp',
    viTri: 'Cánh đồng Bắc · 210 con/m²',
    muc: 'Trung bình',
    mau: 'yel',
    pct: 46,
    khuyenCao: 'Theo dõi, chưa cần phun',
  },
  {
    ten: 'Bệnh loét — Bưởi',
    viTri: 'Vườn Bưởi Diễn · rải rác',
    muc: 'Thấp',
    mau: 'green',
    pct: 18,
    khuyenCao: 'Cắt tỉa cành bệnh, bôi vôi gốc',
  },
]

/** Bản gốc map màu pill sang biến màu thanh tiến độ. */
export const mauThanh = (m: MauPill): string =>
  m === 'red' ? 'var(--gdos-danger)' : m === 'yel' ? 'var(--warn)' : 'var(--ok)'

/* ---------- Tab "Thủy lợi" ---------- */

export interface TramNuoc {
  ten: string
  pct: number
  nhan: string
  mau: MauPill
}

export const TRAM_NUOC: TramNuoc[] = [
  { ten: 'Kênh N2 — Trạm bơm Đông', pct: 78, nhan: 'Bình thường', mau: 'green' },
  { ten: 'Kênh N4 — Trạm bơm Tây', pct: 92, nhan: 'Vượt báo động 1', mau: 'red' },
  { ten: 'Hồ chứa Đồng Sen', pct: 64, nhan: 'Bình thường', mau: 'green' },
]

/** Lịch vận hành tưới tiêu — [thời gian, nội dung, trạng thái]. */
export const LICH_TUOI: [string, string, TrangThai][] = [
  ['09/04 · 05:00–09:00', 'Bơm tưới Kênh N2 → Cánh đồng Nam', ['Kế hoạch', 'blue']],
  ['10/04 · cả ngày', 'Ngừng bơm — mưa lớn, mở cống tiêu C3', ['Điều chỉnh', 'yel']],
  ['12/04 · 05:00–08:00', 'Bơm tưới Kênh N4 → Cánh đồng Bắc', ['Kế hoạch', 'blue']],
]
