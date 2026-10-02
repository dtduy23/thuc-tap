import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { MauPill } from '@/dieu-hanh/mocks/types'

/** Số liệu bản gốc viết thẳng trong `V.gdyt` — không nằm trong object `D`. */

export interface TheSo {
  nhan: string
  giaTri: string
  phu: string
  mau: string
  drill: ChiTieuDrill
}

/* ---------- Tab "Giáo dục" ---------- */

export const THE_GIAO_DUC: TheSo[] = [
  {
    nhan: 'TRƯỜNG HỌC',
    giaTri: '14',
    phu: 'MN 6 · TH 5 · THCS 3',
    mau: 'var(--brand)',
    drill: {
      ten: 'Trường học trên địa bàn',
      val: 14,
      sub: 'trường · MN 6, TH 5, THCS 3',
      pct: 100,
      mod: 'gdyt',
      dv: 'Văn hóa - Xã hội',
    },
  },
  {
    nhan: 'HỌC SINH',
    giaTri: '8.240',
    phu: 'năm học 2025–2026',
    mau: 'var(--teal)',
    drill: {
      ten: 'Học sinh toàn địa bàn',
      val: 8240,
      sub: 'em · năm học 2025–2026',
      pct: 100,
      mod: 'gdyt',
      dv: 'Văn hóa - Xã hội',
    },
  },
  {
    nhan: 'PHỔ CẬP ĐÚNG TUỔI',
    giaTri: '99,2%',
    phu: 'mục tiêu ≥ 99%',
    mau: 'var(--ok)',
    drill: {
      ten: 'Phổ cập đúng tuổi',
      val: 99.2,
      sub: '% · MT ≥ 99%',
      pct: 100,
      mod: 'gdyt',
      dv: 'Văn hóa - Xã hội',
    },
  },
  {
    nhan: 'NGUY CƠ BỎ HỌC',
    giaTri: '3',
    phu: 'cần theo dõi',
    mau: 'var(--gdos-danger)',
    drill: {
      ten: 'HS nguy cơ bỏ học',
      val: 3,
      sub: 'trường hợp cần theo dõi',
      pct: 30,
      mod: 'gdyt',
      dv: 'Văn hóa - Xã hội',
    },
  },
]

export const HS_THEO_CAP: MucChart[] = [
  ['Mầm non', 1240, '#D97E06'],
  ['Tiểu học', 2980, '#1B66E0'],
  ['THCS', 2140, '#0E9488'],
]
export const TONG_HS = '6.360'

export const CHUYEN_CAN = [96.8, 97.4, 96.1, 97.0]
export const TUAN = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']

/** Chỉ tiêu giáo dục — [tên, giá trị, mục tiêu]. */
export const CHI_TIEU_GD: [string, number, string][] = [
  ['Phổ cập MN 5 tuổi', 100, '≥100%'],
  ['Phổ cập TH đúng tuổi', 99.4, '≥99%'],
  ['Phổ cập THCS', 98.6, '≥98%'],
  ['Trường đạt chuẩn QG', 71, '≥75%'],
]

/** Cảnh báo nguy cơ bỏ học — [tên học sinh, lý do]. */
export const NGUY_CO_BO_HOC: [string, string][] = [
  ['N.V.T — Lớp 8A2, THCS Lê Lợi', 'Nghỉ 6 buổi/2 tuần · hoàn cảnh khó khăn'],
  ['T.T.M — Lớp 7B1, THCS Q.Trung', 'Nghỉ 4 buổi · theo bố mẹ đi làm xa'],
  ['L.V.H — Lớp 9A3, THCS Lê Lợi', 'Kết quả giảm mạnh · nghỉ 3 buổi'],
]

/** Chuyên cần 4 tuần trong modal chi tiết trường. */
export const CHUYEN_CAN_TRUONG = [97, 98, 96, 97]

/* ---------- Tab "Y tế" ---------- */

export const THE_Y_TE: TheSo[] = [
  {
    nhan: 'TRẠM Y TẾ',
    giaTri: '2',
    phu: 'đạt chuẩn quốc gia',
    mau: 'var(--brand)',
    drill: {
      ten: 'Trạm y tế đạt chuẩn',
      val: 2,
      sub: 'trạm · chuẩn quốc gia',
      pct: 100,
      mod: 'gdyt',
      dv: 'Trạm y tế',
    },
  },
  {
    nhan: 'HSSK ĐIỆN TỬ',
    giaTri: '92%',
    phu: '50.610 / 55.010 dân',
    mau: 'var(--teal)',
    drill: {
      ten: 'HSSK điện tử',
      val: 92,
      sub: '% · 85.410/92.840 dân',
      pct: 97,
      mod: 'gdyt',
      dv: 'Trạm y tế',
    },
  },
  {
    nhan: 'TIÊM CHỦNG MR',
    giaTri: '98,5%',
    phu: 'trẻ dưới 1 tuổi',
    mau: 'var(--ok)',
    drill: {
      ten: 'Tiêm chủng mở rộng',
      val: 98.5,
      sub: '% trẻ dưới 1 tuổi',
      pct: 100,
      mod: 'gdyt',
      dv: 'Trạm y tế',
    },
  },
  {
    nhan: 'CẢNH BÁO DỊCH',
    giaTri: '1',
    phu: 'SXH theo dõi khu phố 5',
    mau: 'var(--gdos-danger)',
    drill: {
      ten: 'Ổ dịch đang cảnh báo',
      val: 1,
      sub: 'SXH khu phố 5 vượt ngưỡng',
      pct: 20,
      mod: 'gdyt',
      dv: 'Trạm y tế',
    },
  },
]

export const CA_SXH = [3, 5, 8, 11]
export const DRILL_SXH: ChiTieuDrill = {
  ten: 'Ca sốt xuất huyết tuần này',
  val: 11,
  sub: 'ca · vượt ngưỡng cảnh báo 8',
  pct: 20,
  mod: 'gdyt',
  dv: 'Trạm y tế',
}

export const LUOT_KHAM: MucChart[] = [
  ['Trẻ em', 740, '#1B66E0'],
  ['Người lớn', 910, '#0E9488'],
  ['Người cao tuổi', 590, '#7C3AED'],
]
export const TONG_LUOT_KHAM = '2.240'

export interface DichBenh {
  ten: string
  ca: number[]
  mau: MauPill
  tinhTrang: string
  khuyenCao: string
}

export const DICH_BENH: DichBenh[] = [
  {
    ten: 'Sốt xuất huyết',
    ca: [4, 7, 12, 19],
    mau: 'red',
    tinhTrang: 'Vượt ngưỡng — khu phố 5, 15',
    khuyenCao: 'AI đề xuất: ra quân diệt lăng quăng khu phố 5-15 trong tuần, phun hóa chất ổ dịch',
  },
  {
    ten: 'Tay chân miệng',
    ca: [6, 5, 8, 7],
    mau: 'yel',
    tinhTrang: 'Theo dõi — trường MN',
    khuyenCao: 'Khử khuẩn đồ chơi hằng ngày theo CV 318/PGDĐT',
  },
  {
    ten: 'Cúm mùa',
    ca: [22, 18, 15, 12],
    mau: 'green',
    tinhTrang: 'Giảm dần',
    khuyenCao: 'Duy trì giám sát thường quy',
  },
]

/** Bản gốc map màu pill sang biến màu cột. */
export const mauCot = (m: MauPill): string =>
  m === 'red' ? 'var(--gdos-danger)' : m === 'yel' ? 'var(--warn)' : 'var(--ok)'

/** Nhãn pill theo mức dịch. */
export const nhanDich = (m: MauPill): string =>
  m === 'red' ? 'Cảnh báo' : m === 'yel' ? 'Theo dõi' : 'Ổn định'

/** Trạm y tế — [tên, nhân lực, lượt khám, HSSK]. */
export const TRAM_Y_TE: [string, string, string, string][] = [
  ['TYT Khu A', '5 BS · 8 ĐD', '1.840', '94%'],
  ['TYT Khu B', '4 BS · 7 ĐD', '1.520', '89%'],
]

/** Tiêm chủng mở rộng Q1/2026. */
export const TIEM_CHUNG: [string, number][] = [
  ['Trẻ <1 tuổi đủ mũi', 98.5],
  ['Sởi mũi 2 (18 th)', 96.2],
  ['Uốn ván thai phụ', 94.8],
  ['HPV nữ 11 tuổi', 82.4],
]

export const mauTiem = (v: number): string => (v >= 95 ? '#12A150' : v >= 90 ? '#D97E06' : '#D93843')

export const DAN_SO: MucChart[] = [
  ['Người cao tuổi (>60)', 7510, '#7C3AED'],
  ['Trẻ em dưới 6 tuổi', 4780, '#1B66E0'],
  ['Bảo trợ xã hội', 742, '#0E9488'],
]
export const TONG_DAN_SO = '13.032'
