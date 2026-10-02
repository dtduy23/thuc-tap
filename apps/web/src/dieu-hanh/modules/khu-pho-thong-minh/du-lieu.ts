import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

/** Số liệu bản gốc viết thẳng trong `V.apthongminh` — không nằm trong object `D`. */

/** Tên 5 tiêu chí — TCN của bản gốc. */
export const TCN = [
  'TC1 · Hạ tầng số',
  'TC2 · Chính quyền số',
  'TC3 · Kinh tế số',
  'TC4 · Xã hội số',
  'TC5 · An ninh trật tự',
]

/** Tiêu đề cột bảng chấm điểm. */
export const COT_BANG = [
  'Ấp / Thôn',
  'TC1 Hạ tầng số',
  'TC2 CQ số',
  'TC3 KT số',
  'TC4 XH số',
  'TC5 ANTT',
  'Tổng',
  'Kết quả',
] as const

export interface TheSo {
  nhan: string
  giaTri: string
  phu: string
  mau: string
  drill: ChiTieuDrill
}

export const THE_TONG_HOP: TheSo[] = [
  {
    nhan: 'ẤP ĐĂNG KÝ',
    giaTri: '6',
    phu: '6/6 khu phố · 18 tổ dân phố',
    mau: 'var(--brand)',
    drill: {
      ten: 'Ấp/thôn đăng ký xây dựng',
      val: 9,
      sub: 'trên 28 tổ/thôn',
      pct: 75,
      mod: 'apthongminh',
      dv: 'Văn phòng UBND',
    },
  },
  {
    nhan: 'ĐẠT CHUẨN',
    giaTri: '2',
    phu: 'đã công nhận 2025',
    mau: 'var(--ok)',
    drill: {
      ten: 'Ấp/thôn đạt chuẩn',
      val: 3,
      sub: 'đã công nhận 2025',
      pct: 100,
      mod: 'apthongminh',
      dv: 'Văn phòng UBND',
    },
  },
  {
    nhan: 'SẮP ĐẠT (≥80)',
    giaTri: '2',
    phu: 'dự kiến quý 3/2026',
    mau: 'var(--warn)',
    drill: {
      ten: 'Ấp/thôn sắp đạt (≥80 điểm)',
      val: 4,
      sub: 'dự kiến công nhận quý 3/2026',
      pct: 82,
      mod: 'apthongminh',
      dv: 'Văn phòng UBND',
    },
  },
]

/** Donut "Phân bố 6 khu phố đăng ký". */
export const PHAN_BO: MucChart[] = [
  ['Đạt chuẩn', 2, '#12A150'],
  ['Sắp đạt (≥80)', 2, '#D97E06'],
  ['Đang xây dựng', 2, '#1B66E0'],
]
export const TONG_KHU_PHO = '6'

/** Màu cột theo kết quả — bản gốc đọc từ r[8][1]. */
export const mauCot = (mau: string): string =>
  mau === 'green' ? '#12A150' : mau === 'yel' ? '#D97E06' : '#1B66E0'

/** Màu gauge từng tiêu chí trong tab chi tiết. */
export const mauTieuChi = (v: number): string => (v >= 90 ? '#12A150' : v >= 80 ? '#D97E06' : '#D93843')

/** Nền/chữ ô điểm — port từ scv(). */
export const oDiem = (v: number): { nen: string; chu: string } =>
  v >= 90
    ? { nen: 'var(--ok-bg)', chu: 'var(--ok-tx)' }
    : v >= 70
      ? { nen: 'var(--warn-bg)', chu: 'var(--warn-tx)' }
      : { nen: 'var(--gdos-danger-bg)', chu: 'var(--gdos-danger)' }

/** Việc cần hoàn thiện — [tiêu đề, ghi chú]. */
export const VIEC_CAN_LAM: [string, string][] = [
  ['Đưa hộ KD còn lại lên sàn TMĐT', 'phối hợp bưu điện, tổ CNSCĐ'],
  ['Bổ sung camera các ngõ chưa phủ', 'kinh phí xã hội hóa'],
  ['Tăng thanh toán không tiền mặt tại chợ', 'điểm quét QR + tuyên truyền'],
]

/** Minh chứng tự tổng hợp — [nội dung, đã có?]. */
export const MINH_CHUNG: [string, boolean][] = [
  ['Báo cáo DVC trực tuyến Q1/2026', true],
  ['Danh sách hộ KD trên sàn TMĐT', true],
  ['Nhật ký vận hành camera ANTT', true],
  ['Thống kê HSSK điện tử theo hộ', true],
  ['Biên bản tổ công nghệ số cộng đồng', false],
]
