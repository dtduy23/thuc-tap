/**
 * Dữ liệu Dashboard GDOS Xã/Phường — port từ docs/Dashboard_GDOS_XaPhuong_3.html.
 * Giữ nguyên chữ, số và thứ tự của file; màu là token `--bd-*` thay cho `--s*`.
 * Ghi chú có `<b>` ở đầu câu trong file được tách thành { dam, con }.
 */
import type { TuyChonChuoi } from '@/dieu-hanh/lib/chuoi-mo-phong'

/* ── Kiểu ─────────────────────────────────────────────────────────────────── */

export type MauTile = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'orange'

export type IconTile =
  | 'users'
  | 'home'
  | 'shield'
  | 'file'
  | 'check'
  | 'clock'
  | 'alert'
  | 'msg'
  | 'heart'
  | 'leaf'
  | 'patrol'
  | 'ticket'
  | 'camera'
  | 'road'
  | 'build'
  | 'drop'
  | 'bulb'
  | 'hospital'
  | 'steth'
  | 'school'
  | 'student'
  | 'shop'
  | 'timer'
  | 'done'
  | 'globe'
  | 'task'
  | 'scan'
  | 'smile'

/** Một thẻ chỉ số — tham số của renderTiles(). */
export interface TileXp {
  code: string
  label: string
  value: number | null
  unit?: string
  icon: IconTile
  color: MauTile
  period: 'T8' | 'T9'
  sim?: TuyChonChuoi
  /** Chuỗi 10 kỳ cho sẵn, bỏ qua mô phỏng. */
  data?: number[]
  dec?: number
  foot?: string
  /** Chân thẻ tô màu cảnh báo (class .warnt của file). */
  footCanhBao?: boolean
  span?: 3 | 4
  /** So kỳ trước theo điểm % thay vì % thay đổi. */
  pp?: boolean
}

export type LoaiNhan = 'ok' | 'no' | 'na' | 'wa'

export interface GhiChu {
  dam: string
  con: string
}

export interface DongKv {
  k: string
  v: string
  /** Giá trị hiện dạng badge thay vì chữ đậm. */
  nhan?: LoaiNhan
  /** Chữ thường (font-weight 500) — các ô "Đầu mối", "Cán bộ"… */
  nhe?: boolean
}

export interface PhanDonut {
  label: string
  value: number
  color: string
}

export interface CotBieuDo {
  label: string
  value: number
  color?: string
  display?: string
  /** Dòng dưới tiêu đề tooltip; bỏ trống thì hiện số + hậu tố. */
  tip?: string
}

export interface ThanhNgangXp {
  label: string
  value: number
  color?: string
  display?: string
  /** Badge thay cho số ở cột phải (Cứng hóa đường → "Đã đạt"). */
  nhanDat?: boolean
}

/** Thông số một vòng tiến độ hoặc gauge đơn lẻ. */
export interface ChiSoVong {
  v: number
  label: string
  sub: string
  color?: string
  target?: number
  invalid?: boolean
  dec?: number
}

/** Chuỗi xu hướng mô phỏng dựng từ một chỉ tiêu (hist(code, value, sim)). */
export interface XuHuongXp {
  code: string
  name: string
  value: number
  sim: TuyChonChuoi
  color: string
}

export type IdTrang = 'overview' | 'kpi' | 'tthc' | 'ktxh' | 'antt' | 'ht' | 'ytgd' | 'pakn'

export interface TrangXp {
  id: IdTrang
  /** id module trong registry — đích của các nút data-go. */
  module: string
  t: string
  s: string
  p: string
}

export interface KpiXp {
  code: string
  name: string
  short: string
  t: number
  v: number | null
  how: string
  src: IdTrang | null
  srcName: string
  owner: string
  icon: IconTile
  color: MauTile
  sim?: TuyChonChuoi
}

/* ── Điều hướng ───────────────────────────────────────────────────────────── */

export const TRANG: Record<IdTrang, TrangXp> = {
  overview: {
    id: 'overview',
    module: 'dashboard-tong-quan',
    t: 'Dashboard tổng quan',
    s: 'Bức tranh chung các lĩnh vực quản lý của xã',
    p: 'T8–T9/2026',
  },
  kpi: {
    id: 'kpi',
    module: 'bo-chi-so-kpi',
    t: 'Bộ chỉ số KPI',
    s: 'KPI điều hành cấp trên giao – tự động tổng hợp từ các dashboard lĩnh vực',
    p: 'T9/2026',
  },
  tthc: {
    id: 'tthc',
    module: 'tthc-mot-cua',
    t: 'TTHC – Một cửa',
    s: 'Tiếp nhận và giải quyết thủ tục hành chính',
    p: 'T9/2026',
  },
  ktxh: {
    id: 'ktxh',
    module: 'kinh-te-dan-cu-xa-hoi',
    t: 'Kinh tế – Dân cư – Xã hội',
    s: 'Dân số, an sinh, doanh nghiệp, nông nghiệp, ngân sách',
    p: 'T8/2026',
  },
  antt: {
    id: 'antt',
    module: 'an-ninh-trat-tu',
    t: 'An ninh – Trật tự',
    s: 'Vụ việc, tuần tra, vi phạm và camera giám sát',
    p: 'T8/2026',
  },
  ht: {
    id: 'ht',
    module: 'ha-tang-do-thi',
    t: 'Hạ tầng – Đô thị',
    s: 'Giao thông, chiếu sáng, nước sạch, môi trường, GIS',
    p: 'T8/2026',
  },
  ytgd: {
    id: 'ytgd',
    module: 'y-te-giao-duc',
    t: 'Y tế – Giáo dục',
    s: 'Y tế cơ sở và hệ thống trường học',
    p: 'T8/2026',
  },
  pakn: {
    id: 'pakn',
    module: 'phan-anh-kien-nghi',
    t: 'Phản ánh – Kiến nghị',
    s: 'Tiếp nhận và xử lý phản ánh, kiến nghị của người dân',
    p: 'T9/2026',
  },
}

/* ── KPI: suy ra từ chỉ tiêu lĩnh vực ─────────────────────────────────────── */

const SRC = {
  'TTHC-02': 9825,
  'TTHC-03': 9824,
  'TTHC-07': 99.77,
  'TTHC-08': 100,
  'TTHC-17': 0.99,
  'PAKN-05': 100,
}

export const KPIS: KpiXp[] = [
  {
    code: 'KPI-01',
    name: 'TTHC đúng hạn',
    short: 'TTHC đúng hạn',
    t: 90,
    v: (SRC['TTHC-03'] / SRC['TTHC-02']) * 100,
    how: 'TTHC-03 ÷ TTHC-02 = 9.824 ÷ 9.825',
    src: 'tthc',
    srcName: 'TTHC – Một cửa',
    owner: 'Văn phòng – Một cửa',
    icon: 'check',
    color: 'blue',
    sim: { pct: true, vol: 1.6, drift: 0.3 },
  },
  {
    code: 'KPI-02',
    name: 'Dịch vụ công trực tuyến toàn trình',
    short: 'DVC toàn trình',
    t: 80,
    v: SRC['TTHC-07'],
    how: 'Lấy trực tiếp TTHC-07',
    src: 'tthc',
    srcName: 'TTHC – Một cửa',
    owner: 'Văn phòng – Một cửa',
    icon: 'globe',
    color: 'orange',
    sim: { pct: true, vol: 3, drift: 1.6 },
  },
  {
    code: 'KPI-03',
    name: 'Phản hồi phản ánh – kiến nghị trong 3 ngày',
    short: 'PAKN ≤ 3 ngày',
    t: 90,
    v: SRC['PAKN-05'],
    how: 'Lấy trực tiếp PAKN-05',
    src: 'pakn',
    srcName: 'Phản ánh – Kiến nghị',
    owner: 'Văn phòng HĐND-UBND',
    icon: 'msg',
    color: 'teal',
    sim: { pct: true, vol: 6, drift: 0.6 },
  },
  {
    code: 'KPI-04',
    name: 'Nhiệm vụ cấp trên giao thực hiện đúng hạn',
    short: 'Nhiệm vụ đúng hạn',
    t: 90,
    v: null,
    how: 'Chưa có chỉ tiêu nguồn trong các sheet lĩnh vực',
    src: null,
    srcName: '—',
    owner: 'Văn phòng HĐND-UBND',
    icon: 'task',
    color: 'amber',
  },
  {
    code: 'KPI-05',
    name: 'Số hóa hồ sơ, kết quả giải quyết TTHC',
    short: 'Số hóa hồ sơ',
    t: 95,
    v: SRC['TTHC-08'],
    how: 'Lấy trực tiếp TTHC-08',
    src: 'tthc',
    srcName: 'TTHC – Một cửa',
    owner: 'Một cửa – CNTT',
    icon: 'scan',
    color: 'violet',
    sim: { pct: true, vol: 2.6, drift: 0.5 },
  },
  {
    code: 'KPI-06',
    name: 'Mức độ hài lòng của người dân',
    short: 'Hài lòng',
    t: 90,
    v: SRC['TTHC-17'] * 100,
    how: 'TTHC-17 × 100 = 0,99 × 100',
    src: 'tthc',
    srcName: 'TTHC – Một cửa',
    owner: 'Khảo sát / Một cửa',
    icon: 'smile',
    color: 'red',
    sim: { pct: true, vol: 2.2, drift: 0.35 },
  },
]

export const MAU_CHUOI_KPI: Record<string, string> = {
  'KPI-01': 'var(--bd-1)',
  'KPI-02': 'var(--bd-2)',
  'KPI-03': 'var(--bd-3)',
  'KPI-05': 'var(--bd-7)',
  'KPI-06': 'var(--bd-5)',
}

/* ── Thẻ chỉ số từng trang ────────────────────────────────────────────────── */

export const TILE_OVERVIEW: TileXp[] = [
  {
    code: 'DC-01',
    label: 'Tổng dân số',
    value: 28514,
    unit: 'người',
    icon: 'users',
    color: 'blue',
    period: 'T8',
    sim: { vol: 0.002, drift: 0.003 },
    foot: '677 hộ',
  },
  {
    code: 'TTHC-01',
    label: 'Hồ sơ TTHC',
    value: 10045,
    unit: 'hồ sơ',
    icon: 'file',
    color: 'green',
    period: 'T9',
    foot: 'đúng hạn 99,99%',
  },
  {
    code: 'PAKN-01',
    label: 'Phản ánh, kiến nghị',
    value: 42,
    unit: 'lượt',
    icon: 'msg',
    color: 'violet',
    period: 'T9',
    foot: 'xử lý TB 3 ngày',
  },
  {
    code: 'ANTT-01',
    label: 'Vụ việc ANTT',
    value: 9,
    unit: 'vụ',
    icon: 'shield',
    color: 'orange',
    period: 'T8',
    sim: { small: true, vol: 5 },
    foot: 'đã xử lý 9/9',
  },
]

export const TILE_TTHC: TileXp[] = [
  {
    code: 'TTHC-01',
    label: 'Tiếp nhận',
    value: 10045,
    icon: 'file',
    color: 'blue',
    period: 'T9',
    foot: 'trực tiếp + trực tuyến',
  },
  {
    code: 'TTHC-02',
    label: 'Đã giải quyết',
    value: 9825,
    icon: 'check',
    color: 'green',
    period: 'T9',
    foot: 'đúng hạn 99,99%',
  },
  {
    code: 'TTHC-04',
    label: 'Đang xử lý',
    value: 220,
    icon: 'clock',
    color: 'amber',
    period: 'T9',
    foot: 'còn trong hạn',
  },
  {
    code: 'TTHC-05',
    label: 'Quá hạn chưa trả',
    value: 0,
    icon: 'alert',
    color: 'red',
    period: 'T9',
    sim: { small: true, vol: 4 },
    foot: '1 hồ sơ trả trễ',
  },
]

export const TILE_KTXH: TileXp[] = [
  {
    code: 'DC-01',
    label: 'Tổng dân số',
    value: 28514,
    icon: 'users',
    color: 'blue',
    period: 'T8',
    sim: { vol: 0.002, drift: 0.003 },
    foot: 'nam 52,8%',
  },
  {
    code: 'DC-06',
    label: 'Tổng số hộ dân',
    value: 677,
    icon: 'home',
    color: 'violet',
    period: 'T8',
    sim: { vol: 0.004, drift: 0.002 },
    foot: '≈42 người/hộ',
    footCanhBao: true,
  },
  {
    code: 'DC-09',
    label: 'Bao phủ BHYT',
    value: 94.95,
    dec: 2,
    unit: '%',
    icon: 'heart',
    color: 'green',
    period: 'T8',
    sim: { pct: true, vol: 0.8, drift: 0.25 },
  },
  {
    code: 'KT-09',
    label: 'Đất nông nghiệp',
    value: 8989.21,
    dec: 0,
    unit: 'ha',
    icon: 'leaf',
    color: 'teal',
    period: 'T8',
    sim: { int: false, vol: 0.002, drift: -0.001 },
  },
]

export const TILE_KTXH_2: TileXp[] = [
  {
    code: 'KT-06',
    label: 'Hộ KD đăng ký mới',
    value: 30,
    unit: 'hộ',
    icon: 'shop',
    color: 'orange',
    period: 'T8',
    span: 3,
    sim: { small: true, vol: 10 },
    foot: '+7,8% quy mô HKD',
  },
]

export const TILE_ANTT: TileXp[] = [
  {
    code: 'ANTT-01',
    label: 'Vụ việc ANTT',
    value: 9,
    unit: 'vụ',
    icon: 'shield',
    color: 'orange',
    period: 'T8',
    sim: { small: true, vol: 5 },
    foot: '0,32/1.000 dân',
  },
  {
    code: 'ANTT-03',
    label: 'Lượt tuần tra',
    value: 150,
    unit: 'lượt',
    icon: 'patrol',
    color: 'blue',
    period: 'T8',
    sim: { vol: 0.12 },
    foot: '≈5 lượt/ngày',
  },
  {
    code: 'ANTT-05',
    label: 'Vi phạm TTĐT/ATGT',
    value: 228,
    unit: 'vụ',
    icon: 'ticket',
    color: 'red',
    period: 'T8',
    sim: { vol: 0.14 },
    foot: '≈7,4 vụ/ngày',
  },
  {
    code: 'ANTT-04',
    label: 'Camera giám sát',
    value: 76,
    icon: 'camera',
    color: 'teal',
    period: 'T8',
    data: [58, 60, 62, 62, 66, 68, 70, 72, 72, 76],
    foot: '2,67/1.000 dân',
  },
]

export const TILE_HT: TileXp[] = [
  {
    code: 'HT-01',
    label: 'Tuyến đường trục',
    value: 7,
    unit: 'tuyến',
    icon: 'road',
    color: 'blue',
    period: 'T8',
    sim: { flat: true },
    foot: '100% cứng hóa',
  },
  {
    code: 'HT-06',
    label: 'Công trình đang thi công',
    value: 17,
    icon: 'build',
    color: 'orange',
    period: 'T8',
    sim: { small: true, vol: 5 },
  },
  {
    code: 'HT-04',
    label: 'Hộ dùng nước sạch',
    value: 80.9,
    dec: 1,
    unit: '%',
    icon: 'drop',
    color: 'teal',
    period: 'T8',
    sim: { pct: true, vol: 1.2, drift: 0.6 },
  },
  {
    code: 'HT-03',
    label: 'Hẻm/ngõ có chiếu sáng',
    value: 55,
    unit: '%',
    icon: 'bulb',
    color: 'amber',
    period: 'T8',
    sim: { pct: true, vol: 2, drift: 1 },
    foot: 'thấp nhất nhóm',
  },
]

export const TILE_YTGD: TileXp[] = [
  {
    code: 'YTGD-01',
    label: 'Trạm y tế',
    value: 3,
    unit: 'trạm',
    icon: 'hospital',
    color: 'red',
    period: 'T8',
    sim: { flat: true },
    foot: '9.505 dân/trạm',
  },
  {
    code: 'YTGD-02',
    label: 'Lượt khám / tháng',
    value: 2341,
    icon: 'steth',
    color: 'blue',
    period: 'T8',
    sim: { vol: 0.1 },
    foot: '780 lượt/trạm',
  },
  {
    code: 'YTGD-04',
    label: 'Trường học',
    value: 3,
    unit: 'trường',
    icon: 'school',
    color: 'violet',
    period: 'T8',
    sim: { flat: true },
    foot: '100% chuẩn QG',
  },
  {
    code: 'YTGD-05',
    label: 'Tổng số học sinh',
    value: 2728,
    icon: 'student',
    color: 'green',
    period: 'T8',
    sim: { vol: 0.006, drift: 0.002 },
    foot: '909 HS/trường',
  },
]

export const TILE_PAKN: TileXp[] = [
  {
    code: 'PAKN-01',
    label: 'Tiếp nhận',
    value: 42,
    unit: 'lượt',
    icon: 'msg',
    color: 'violet',
    period: 'T9',
    foot: '1,47/1.000 dân',
  },
  {
    code: 'PAKN-02',
    label: 'Đã xử lý xong',
    value: 42,
    icon: 'done',
    color: 'green',
    period: 'T9',
    foot: '100% tiếp nhận',
  },
  {
    code: 'PAKN-04',
    label: 'Quá hạn chưa xử lý',
    value: 0,
    icon: 'alert',
    color: 'red',
    period: 'T9',
    sim: { small: true, vol: 3 },
    foot: 'chưa có dữ liệu chính thức',
  },
  {
    code: 'PAKN-06',
    label: 'Thời gian xử lý TB',
    value: 3,
    unit: 'ngày',
    icon: 'timer',
    color: 'blue',
    period: 'T9',
    data: [5, 5, 4, 4, 4, 3, 4, 3, 4, 3],
    foot: 'đạt ngưỡng 3 ngày',
  },
]

/* ── Tổng quan ────────────────────────────────────────────────────────────── */

export interface LinhVucTomTat {
  id: IdTrang
  n: string
  kv: [string, string][]
  st: ['ok' | 'wa', string]
}

export const DOM: LinhVucTomTat[] = [
  {
    id: 'tthc',
    n: 'TTHC – Một cửa',
    kv: [
      ['Đúng hạn', '99,99%'],
      ['Toàn trình', '99,77%'],
      ['Hài lòng', '99%'],
    ],
    st: ['ok', 'Tốt'],
  },
  {
    id: 'ktxh',
    n: 'Kinh tế – Dân cư – XH',
    kv: [
      ['Hộ nghèo / cận nghèo', '7 / 115'],
      ['Doanh nghiệp · HKD', '40 · 387'],
      ['BHYT', '94,95%'],
    ],
    st: ['wa', 'Thiếu ngân sách'],
  },
  {
    id: 'antt',
    n: 'An ninh – Trật tự',
    kv: [
      ['Vụ việc (xử lý)', '9 (9)'],
      ['Vi phạm TTĐT/ATGT', '228'],
      ['Camera', '76'],
    ],
    st: ['ok', 'Ổn định'],
  },
  {
    id: 'ht',
    n: 'Hạ tầng – Đô thị',
    kv: [
      ['Đường cứng hóa', '100%'],
      ['Chiếu sáng hẻm', '55%'],
      ['CT đang thi công', '17'],
    ],
    st: ['wa', 'Chiếu sáng thấp'],
  },
  {
    id: 'ytgd',
    n: 'Y tế – Giáo dục',
    kv: [
      ['Trạm y tế · Trường', '3 · 3'],
      ['Lượt khám/tháng', '2.341'],
      ['Trường chuẩn QG', '100%'],
    ],
    st: ['ok', 'Tốt'],
  },
  {
    id: 'pakn',
    n: 'Phản ánh – Kiến nghị',
    kv: [
      ['Tiếp nhận', '42'],
      ['Trong 3 ngày', '100%'],
      ['Quá hạn', '0'],
    ],
    st: ['ok', 'Tốt'],
  },
]

export const COT_DAU_MOI = ['Phòng ban', 'Đầu mối', 'Chức vụ', 'Phụ trách', 'Điện thoại', 'Email'] as const

export const CONTACTS: string[][] = [
  ['Đảng ủy – HĐND – UBND', '—', '—', 'Chỉ đạo chung, KPI điều hành', '', ''],
  ['Văn phòng HĐND-UBND', '—', '—', 'Nhiệm vụ, văn bản, PAKN, tổng hợp KT-XH', '', ''],
  ['Phòng Kinh tế', '—', '—', 'Kinh tế – ngân sách, hạ tầng đô thị, nông nghiệp', '', ''],
  ['Phòng Văn hóa – Xã hội', '—', '—', 'Dân cư – xã hội, y tế – giáo dục', '', ''],
  ['Trung tâm Phục vụ HCC', '—', '—', 'TTHC & Một cửa, số hóa hồ sơ', '', ''],
  ['Công an xã/phường', '—', '—', 'An ninh trật tự, dữ liệu dân cư', '', ''],
  ['Ban Chỉ huy Quân sự', '—', '—', 'Quốc phòng – dân quân tự vệ', '', ''],
  ['Bộ phận CNTT / CĐS', '—', '—', 'Hạ tầng CNTT, tích hợp hệ thống', '', ''],
]

/** [nhãn, số chỉ tiêu đã có, tổng chỉ tiêu] */
export const COMP: [string, number, number][] = [
  ['TTHC', 14, 17],
  ['PAKN', 6, 6],
  ['Kinh tế', 7, 13],
  ['Dân cư', 13, 13],
  ['ANTT', 6, 6],
  ['Hạ tầng', 6, 6],
  ['Y tế – GD', 6, 6],
  ['GIS', 5, 5],
  ['KPI (tự tính)', 5, 6],
]

/* ── KPI ──────────────────────────────────────────────────────────────────── */

export const GHI_CHU_KPI: GhiChu[] = [
  {
    dam: 'Hiện trạng KPI được tính tự động',
    con: ' từ số liệu các sheet lĩnh vực (TTHC-03/02, TTHC-07, TTHC-08, TTHC-17, PAKN-05) vì cột "Hiện trạng đạt được" trong sheet KPI còn trống. Khi đơn vị điền số chính thức, cần đối chiếu lại.',
  },
  {
    dam: 'KPI-04 (Nhiệm vụ cấp trên giao đúng hạn)',
    con: ' chưa có chỉ tiêu nguồn trong bất kỳ sheet nào – đề nghị bổ sung dữ liệu từ hệ thống quản lý văn bản / giao việc của Văn phòng HĐND-UBND.',
  },
  {
    dam: 'KPI-06 lấy từ TTHC-17',
    con: ' – mới phản ánh mức hài lòng với thủ tục hành chính, chưa bao gồm các lĩnh vực khác.',
  },
  {
    dam: 'Số liệu kỳ trước là mô phỏng',
    con: ' để minh họa diễn biến và bản đồ nhiệt; chỉ kỳ T9/2026 là số thực tế.',
  },
]

/* ── TTHC ─────────────────────────────────────────────────────────────────── */

export const TTHC_DONUT: PhanDonut[] = [
  { label: 'Giải quyết đúng hạn', value: 9824, color: 'var(--bd-1)' },
  { label: 'Đang xử lý trong hạn', value: 220, color: 'var(--bd-4)' },
  { label: 'Giải quyết quá hạn', value: 1, color: 'var(--bd-2)' },
  { label: 'Quá hạn chưa trả', value: 0, color: 'var(--bd-chua-dat)' },
]

export interface VongMucTieu {
  label: string
  code: string
  v: number
  t: number
  color: string
  dec?: number
}

export const TTHC_RADIAL: VongMucTieu[] = [
  { label: 'Giải quyết đúng hạn', code: 'TTHC-06', v: 99.99, t: 90, color: 'var(--bd-1)' },
  { label: 'DVC trực tuyến toàn trình', code: 'TTHC-07', v: 99.77, t: 80, color: 'var(--bd-3)' },
  { label: 'Số hóa hồ sơ, kết quả', code: 'TTHC-08', v: 100, t: 95, color: 'var(--bd-7)', dec: 0 },
  { label: 'Mức độ hài lòng', code: 'TTHC-17', v: 99, t: 90, color: 'var(--bd-2)', dec: 0 },
]

export const TTHC_MOT_CUA: DongKv[] = [
  { k: 'Phần mềm đang sử dụng', v: 'Chưa khai báo', nhan: 'na' },
  { k: 'Hỗ trợ API / xuất Excel', v: 'Chưa khai báo', nhan: 'na' },
  { k: 'Đầu mối', v: 'TT Phục vụ HCC', nhe: true },
]

export const GHI_CHU_TTHC: GhiChu[] = [
  {
    dam: 'Đất đai chỉ 1 hồ sơ/tháng',
    con: ' – thấp bất thường so với 8.989 ha đất nông nghiệp, cần xác minh.',
  },
  { dam: '59,6% hồ sơ chưa phân loại lĩnh vực', con: ' (TTHC-14 để trống).' },
]

export const TTHC_TONG_TIEP_NHAN = 10045

export const TTHC_LINH_VUC: CotBieuDo[] = [
  { label: 'Tư pháp – Hộ tịch', value: 2282 },
  { label: 'Lao động – TB – XH', value: 1281 },
  { label: 'Đăng ký kinh doanh / HKD', value: 387 },
  { label: 'Xây dựng', value: 103 },
  { label: 'Đất đai', value: 1 },
  { label: 'Lĩnh vực khác*', value: 5991, color: 'var(--bd-khac)', display: '5.991*' },
]

/* ── Kinh tế – Dân cư – Xã hội ────────────────────────────────────────────── */

export const KTXH_GIOI_TINH: PhanDonut[] = [
  { label: 'Nam', value: 15053, color: 'var(--bd-1)' },
  { label: 'Nữ', value: 13461, color: 'var(--bd-2)' },
]

export const DAN_SO = 28514

export const KTXH_NHOM_TUOI: PhanDonut[] = [
  { label: 'Trẻ em 0–14 tuổi', value: 4770, color: 'var(--bd-3)' },
  { label: 'Trong độ tuổi lao động', value: 11195, color: 'var(--bd-1)' },
  { label: 'Cao tuổi 60+', value: 4022, color: 'var(--bd-7)' },
  { label: 'Chưa phân nhóm*', value: 8527, color: 'var(--bd-khac)' },
]

export const KTXH_NGHEO: ThanhNgangXp[] = [
  { label: 'Hộ nghèo', value: (7 / 677) * 100, color: 'var(--bd-2)', display: '7 hộ · 1,0%' },
  { label: 'Hộ cận nghèo', value: (115 / 677) * 100, color: 'var(--bd-4)', display: '115 hộ · 17,0%' },
  { label: 'Nghèo + cận nghèo', value: (122 / 677) * 100, color: 'var(--bd-7)', display: '122 hộ · 18,0%' },
]

export const KTXH_LAO_DONG: DongKv[] = [
  { k: 'Người trong độ tuổi lao động', v: '11.195' },
  { k: 'Lao động có việc làm ổn định', v: '15.389' },
  { k: 'Hộ mới phát sinh trong kỳ', v: '0' },
  { k: 'Đồng bộ CSDL quốc gia dân cư (VNeID/C06)', v: 'Một phần · "563"', nhan: 'wa' },
  { k: 'Đầu mối số liệu', v: 'Phòng Văn hóa – Xã hội', nhe: true },
]

export const KTXH_CHU_THE: CotBieuDo[] = [
  { label: 'Hộ kinh doanh cá thể', value: 387, tip: '387 hộ (30 hộ đăng ký mới)' },
  { label: 'Doanh nghiệp', value: 40, color: 'var(--bd-3)' },
  { label: 'Hợp tác xã', value: 2, color: 'var(--bd-7)' },
]

export const KTXH_SAN_PHAM = ['Sản phẩm OCOP A', 'Sản phẩm OCOP B']

export const KTXH_MA_VUNG: DongKv[] = [{ k: 'Mã vùng trồng (KT-10)', v: 'Chưa có', nhan: 'na' }]

/** [mã, tên, đơn vị] — các chỉ tiêu ngân sách chưa có số liệu. */
export const KTXH_NGAN_SACH: [string, string, string][] = [
  ['KT-01', 'Tổng thu ngân sách', 'Tỷ đồng'],
  ['KT-02', 'Tổng chi ngân sách', 'Tỷ đồng'],
  ['KT-03', 'Đạt KH thu NS năm', '%'],
  ['KT-04', 'Giải ngân đầu tư công', '%'],
  ['KT-12', 'Thanh toán không tiền mặt', '%'],
]

export const GHI_CHU_KTXH: GhiChu[] = [
  {
    dam: 'Quy mô hộ bất thường:',
    con: ' 28.514 người / 677 hộ ≈ 42 người/hộ (bình quân cả nước ~3,5). Tỷ lệ hộ nghèo, cận nghèo phụ thuộc vào số này.',
  },
  {
    dam: 'Lao động có việc làm (15.389) lớn hơn số người trong độ tuổi lao động (11.195)',
    con: ' – cần kiểm tra định nghĩa hoặc số liệu.',
  },
  { dam: 'DC-12 ghi "563" với đơn vị %', con: ' – không hợp lệ; có thể là số người/hộ đã đồng bộ.' },
  { dam: 'Ngân sách (KT-01→04) và thanh toán không tiền mặt (KT-12) chưa có số liệu.', con: '' },
]

/* ── An ninh – Trật tự ────────────────────────────────────────────────────── */

export const ANTT_DONUT: PhanDonut[] = [
  { label: 'Vi phạm TTĐT / ATGT', value: 228, color: 'var(--bd-2)' },
  { label: 'Vụ việc an ninh trật tự', value: 9, color: 'var(--bd-7)' },
]

export const ANTT_XU_HUONG: XuHuongXp = {
  code: 'ANTT-05',
  name: 'Vi phạm TTĐT/ATGT đã xử lý',
  value: 228,
  sim: { vol: 0.14 },
  color: 'var(--bd-2)',
}

export const ANTT_VONG: ChiSoVong = {
  v: 100,
  label: 'Vụ việc đã xử lý / điều tra',
  sub: '9 / 9 vụ',
  color: 'var(--bd-dat)',
}

export const ANTT_MAT_DO: DongKv[] = [
  { k: 'Dân số / 1 camera', v: '375 người' },
  { k: 'Lượt tuần tra / 1.000 dân', v: '5,3 lượt' },
  { k: 'Vi phạm TTĐT–ATGT / 1.000 dân', v: '8,0 vụ' },
  { k: 'Lượt tuần tra / vụ việc', v: '16,7 lượt' },
]

export const ANTT_NGUON: DongKv[] = [
  { k: 'Đầu mối', v: 'Công an xã', nhe: true },
  { k: 'Cán bộ', v: '—', nhe: true },
  { k: 'Cập nhật', v: 'Theo tháng', nhe: true },
  { k: 'Dữ liệu', v: 'Có – đầy đủ', nhan: 'ok' },
]

/* ── Hạ tầng – Đô thị ─────────────────────────────────────────────────────── */

/** [nhãn, mã, %, màu] */
export const HT_VONG: [string, string, number, string][] = [
  ['Đường cứng hóa', 'HT-02', 100, 'var(--bd-1)'],
  ['Thu gom, xử lý rác', 'HT-05', 90, 'var(--bd-3)'],
  ['Hộ dùng nước sạch', 'HT-04', 80.9, 'var(--bd-7)'],
  ['Hẻm/ngõ chiếu sáng', 'HT-03', 55, 'var(--bd-2)'],
]

export const HT_KHOANG_TRONG: ThanhNgangXp[] = [
  { label: 'Chiếu sáng hẻm/ngõ', value: 45, color: 'var(--bd-chua-dat)', display: '45,0' },
  { label: 'Nước sạch hợp vệ sinh', value: 19.1, color: 'var(--bd-4)', display: '19,1' },
  { label: 'Thu gom, xử lý rác thải', value: 10, color: 'var(--bd-1)', display: '10,0' },
  { label: 'Cứng hóa đường', value: 0, color: 'var(--bd-dat)', nhanDat: true },
]

/** [mã, nội dung, trạng thái, giá trị] */
export const GIS: [string, string, 'ok' | 'wa' | 'na', string][] = [
  ['GIS-01', 'Bản đồ số ranh giới hành chính', 'ok', 'Có'],
  ['GIS-02', 'Dữ liệu số hóa di tích, địa chỉ đỏ, điểm du lịch', 'ok', 'Có'],
  ['GIS-03', 'Dữ liệu GIS quy hoạch, đất đai đã số hóa', 'ok', 'Có'],
  ['GIS-04', 'Định dạng file bản đồ hiện có', 'wa', 'PDF – chưa phải định dạng GIS'],
  ['GIS-05', 'Đơn vị cấp/quản lý dữ liệu bản đồ', 'na', 'Sở Nông nghiệp và Môi trường'],
]

/* ── Y tế – Giáo dục ──────────────────────────────────────────────────────── */

export const YT_XU_HUONG: XuHuongXp = {
  code: 'YTGD-02',
  name: 'Lượt khám chữa bệnh',
  value: 2341,
  sim: { vol: 0.1 },
  color: 'var(--bd-1)',
}

export const YT_GAUGE: ChiSoVong[] = [
  { v: 94.95, label: 'Bao phủ BHYT', sub: 'DC-09', dec: 2 },
  { v: 154, label: 'Tiêm chủng đầy đủ', sub: 'YTGD-03 · ghi 154%', invalid: true, dec: 0 },
]

export const GD_VONG: ChiSoVong = {
  v: 100,
  label: 'Trường đạt chuẩn quốc gia',
  sub: '3 / 3 trường',
  color: 'var(--bd-7)',
}

export const YT_NHOM_UU_TIEN: PhanDonut[] = [
  { label: 'Trẻ em 0–14 tuổi', value: 4770, color: 'var(--bd-3)' },
  { label: 'Người cao tuổi 60+', value: 4022, color: 'var(--bd-7)' },
  { label: 'Nhóm dân số khác', value: DAN_SO - 4770 - 4022, color: 'var(--bd-khac)' },
]

export const YT_TAI_KHAM: DongKv[] = [
  { k: 'Dân số / trạm y tế', v: '9.505 người' },
  { k: 'Lượt khám / trạm / tháng', v: '780' },
  { k: 'Lượt khám / 1.000 dân / tháng', v: '82,1' },
  { k: 'Lượt khám / trạm / ngày làm việc (22 ngày)', v: '≈ 35,5' },
]

export const GD_QUY_MO: ThanhNgangXp[] = [
  { label: 'Trẻ em 0–14 tuổi', value: 4770, color: 'var(--bd-3)' },
  { label: 'Học sinh (MN/TH/THCS)', value: 2728 },
]

export const GHI_CHU_YT: GhiChu[] = [
  {
    dam: 'YTGD-03 = 154%',
    con: ' – tỷ lệ tiêm chủng không thể vượt 100%. Có thể đã nhập số trẻ được tiêm thay vì tỷ lệ; cần xác minh với Trạm y tế.',
  },
  {
    dam: 'Kỳ số liệu T8/2026',
    con: ' khác với TTHC/PAKN (T9/2026) – lưu ý độ lệch 1 tháng khi so sánh liên lĩnh vực.',
  },
]

/* ── Phản ánh – Kiến nghị ─────────────────────────────────────────────────── */

export const PAKN_GAUGE: ChiSoVong = {
  v: 100,
  label: 'Phản hồi/xử lý trong 3 ngày',
  target: 90,
  sub: 'PAKN-05',
  dec: 0,
}

export const PAKN_COT: CotBieuDo[] = [
  { label: 'Tiếp nhận', value: 42, color: 'var(--bd-7)' },
  { label: 'Đã xử lý xong', value: 42, color: 'var(--bd-1)' },
  { label: 'Đang xử lý (trong hạn)', value: 42, color: 'var(--bd-4)' },
  { label: 'Quá hạn chưa xử lý', value: 0, color: 'var(--bd-chua-dat)' },
]

export const GHI_CHU_PAKN: GhiChu[] = [
  {
    dam: 'Số liệu chưa khớp:',
    con: ' Đã xử lý (42) + Đang xử lý (42) = 84, lớn hơn tổng tiếp nhận (42). PAKN-03 nhiều khả năng phải là 0.',
  },
  { dam: 'PAKN-04', con: ' khai "Không có dữ liệu" nhưng điền 0 – chỉ mang tính tham khảo.' },
]

/** [nhãn, giá trị] — khối "Quy trình & nguồn dữ liệu". */
export const PAKN_QUY_TRINH: [string, string][] = [
  ['Nguồn dữ liệu', 'Sổ tiếp công dân'],
  ['Tần suất cập nhật', 'Theo ngày'],
  ['Phòng ban đầu mối', 'Văn phòng HĐND-UBND'],
  ['Cán bộ phụ trách', 'Chuyên viên Văn phòng'],
]
