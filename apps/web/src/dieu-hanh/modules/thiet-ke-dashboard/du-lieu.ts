/** Số liệu và kiểu dữ liệu của trình thiết kế dashboard — port từ khối DB của bản gốc. */

export type LoaiWidget = 'kpi' | 'bar' | 'pie' | 'line' | 'table'

export interface Widget {
  id: number
  type: LoaiWidget
  title: string
  /** Chỉ số cột dùng làm nhãn. */
  lbl: number
  /** Chỉ số cột dùng làm giá trị. */
  val: number
}

export interface BoDuLieu {
  id: number
  name: string
  headers: string[]
  rows: (string | number)[][]
}

/** WNAMES của bản gốc. */
export const TEN_WIDGET: Record<LoaiWidget, string> = {
  kpi: 'Thẻ KPI',
  bar: 'Biểu đồ cột',
  pie: 'Biểu đồ tròn',
  line: 'Biểu đồ đường',
  table: 'Bảng dữ liệu',
}

/** Bảng widget bên trái — thứ tự và icon theo bản gốc. */
export const BANG_WIDGET: { type: LoaiWidget; nhan: string; icon: string }[] = [
  { type: 'kpi', nhan: 'Thẻ KPI', icon: 'Σ' },
  { type: 'bar', nhan: 'Biểu đồ cột', icon: '▮▮' },
  { type: 'pie', nhan: 'Biểu đồ tròn', icon: '◔' },
  { type: 'line', nhan: 'Biểu đồ đường', icon: '⤳' },
  { type: 'table', nhan: 'Bảng dữ liệu', icon: '▤' },
]

/** DB_SAMPLE của bản gốc. */
export const BO_MAU = {
  name: 'Dữ liệu mẫu · KT-XH 6 tháng',
  headers: ['Tháng', 'Thu NS (tỷ)', 'Chi TX (tỷ)', 'Hồ sơ TTHC'],
  rows: [
    ['T11', 9.2, 6.1, 142],
    ['T12', 11.4, 6.8, 150],
    ['T1', 8.6, 5.9, 138],
    ['T2', 10.1, 6.2, 161],
    ['T3', 13.2, 7.1, 148],
    ['T4', 15.5, 7.4, 186],
  ] as (string | number)[][],
}

/** Bố cục widget mặc định khi mở màn lần đầu. */
export const WIDGET_MAC_DINH: Widget[] = [
  { id: 1, type: 'kpi', title: 'Tổng thu ngân sách', lbl: 0, val: 1 },
  { id: 2, type: 'pie', title: 'Cơ cấu thu NS theo tháng', lbl: 0, val: 1 },
  { id: 3, type: 'bar', title: 'Thu ngân sách theo tháng', lbl: 0, val: 1 },
  { id: 4, type: 'line', title: 'Xu hướng hồ sơ TTHC', lbl: 0, val: 3 },
]

export const TEN_DASHBOARD_MAC_DINH = 'Dashboard Kinh tế - Xã hội Quý II'

/** Port numCol1() — cột số đầu tiên sau cột nhãn, dùng làm cột giá trị mặc định. */
export const cotSoDau = (bo: BoDuLieu): number => {
  for (let i = 1; i < bo.headers.length; i++) {
    if (bo.rows.some((r) => !Number.isNaN(Number.parseFloat(String(r[i]))))) return i
  }
  return Math.min(1, bo.headers.length - 1)
}

/** Port wData() — lấy [nhãn, số] theo cột đã cấu hình, tối đa 12 dòng. */
export const duLieuWidget = (w: Widget, bo: BoDuLieu, gioiHan = 12): [string, number][] =>
  bo.rows.slice(0, gioiHan).map((r) => [String(r[w.lbl]), Number.parseFloat(String(r[w.val])) || 0])

/** Port parseCsv() — tách theo dấu phẩy / chấm phẩy / tab, bỏ dòng rỗng. */
export const docCsv = (text: string): string[][] =>
  (text || '')
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split(/[,;\t]/).map((c) => c.trim()))
    .filter((r) => r.length > 0 && r.some((c) => c !== ''))
