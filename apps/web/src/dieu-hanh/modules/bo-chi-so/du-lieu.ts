import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

/** Số liệu bản gốc viết thẳng trong `V.chiso` — không nằm trong object `D`. */

/** Line "Điểm điều hành 6 kỳ". */
export const DIEM_DIEU_HANH = [78, 80, 83, 84, 86, 88]
export const KY_DIEU_HANH = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4']
export const MAU_DIEM = '#0E9488'

/** Chỉ tiêu mở khi bấm thẻ "Điểm điều hành 6 kỳ". */
export const DRILL_DIEM: ChiTieuDrill = {
  ten: 'Điểm điều hành tổng hợp',
  val: 88,
  sub: '/100 · xếp thứ 3/12 phường xã',
  pct: 88,
  mod: 'chiso',
  dv: 'Văn phòng UBND',
}

/** HBar "Còn thiếu bao nhiêu điểm % tới mục tiêu". */
export const CON_THIEU: MucChart[] = [
  ['DVC trực tuyến', 13, '#D93843'],
  ['Phản hồi PA-KN', 6, '#D97E06'],
  ['Số hóa hồ sơ', 4, '#D97E06'],
]

/** Màu KPI: bản gốc chỉ phân biệt 'green' (đạt) và còn lại (cần đẩy). */
export const mauKpi = (mau: string): string => (mau === 'green' ? '#12A150' : '#D97E06')
