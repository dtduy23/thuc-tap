import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

/**
 * Số liệu bản gốc viết thẳng trong `V.ktxh` (không nằm trong object `D`).
 * Gom ra đây để JSX không chứa số — giữ nguyên giá trị và thứ tự.
 */

/** Donut "Phân loại 84 chỉ tiêu". */
export const PHAN_LOAI: MucChart[] = [
  ['Đạt / vượt', 52, '#12A150'],
  ['Bám sát KH', 22, '#1B66E0'],
  ['Chậm tiến độ', 10, '#D97E06'],
]

/** Chữ giữa vòng donut. */
export const TONG_CHI_TIEU = '84'

/** Chỉ tiêu mở khi bấm thẻ donut — tham số của drillCt() bản gốc. */
export const DRILL_PHAN_LOAI: ChiTieuDrill = {
  ten: 'Chỉ tiêu đạt / vượt kế hoạch',
  val: 52,
  sub: '/ 84 chỉ tiêu (62%)',
  pct: 62,
  mod: 'ktxh',
  dv: 'Văn phòng UBND',
}

/** Bar "Mức đạt kế hoạch theo nhóm (%)". */
export const MUC_DAT_THEO_NHOM: MucChart[] = [
  ['Kinh tế', 86, '#1B66E0'],
  ['Xã hội', 99, '#12A150'],
  ['N.nghiệp', 89, '#0E9488'],
  ['CĐ Số', 84, '#D97E06'],
]

/** HBar "5 chỉ tiêu chậm nhất (% đạt KH)". */
export const CHAM_NHAT: MucChart[] = [
  ['TT không tiền mặt', 73, '#D93843'],
  ['Thu ngân sách', 74, '#D93843'],
  ['DVC toàn trình', 84, '#D97E06'],
  ['Hộ KD mới', 86, '#D97E06'],
  ['Mã vùng trồng', 80, '#D97E06'],
]

/** Thang màu theo % đạt kế hoạch — dùng chung cho gauge và bar trong màn này. */
export const mauTheoPct = (pct: number): string =>
  pct >= 100 ? '#12A150' : pct >= 90 ? '#1B66E0' : pct >= 80 ? '#D97E06' : '#D93843'

/**
 * Bản gốc: `(''+it[2]).split('·')[0].trim()` — lấy phần đơn vị trước dấu '·'
 * trong mô tả chỉ tiêu ("tỷ đồng · KH 58,8 tỷ" → "tỷ đồng").
 */
export const donViChiTieu = (moTa: string): string => String(moTa).split('·')[0]!.trim()
