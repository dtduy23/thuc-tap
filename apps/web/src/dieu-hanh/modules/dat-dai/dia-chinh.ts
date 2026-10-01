/**
 * Sinh hình học tờ bản đồ địa chính số 32 — port nguyên thuật toán bản gốc
 * (khối `initMapDC`, dòng 2240–2308). Bộ sinh số giả ngẫu nhiên LCG hạt 42 nên
 * hình thửa ra đúng từng toạ độ như bản gốc, không phải hình "đại khái giống".
 */

export type Diem = [number, number]

const LAT0 = 11.3347
const LNG0 = 106.1256

/** LCG của bản gốc: (s*9301+49297)%233280 / 233280. */
function taoRng(hat: number): () => number {
  let s = hat
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

/** Trục đường trong tờ bản đồ — thửa hai bên bám theo đường này. */
const latDuong = (l: number): number => LAT0 + 0.00062 + 0.00014 * Math.sin((l - LNG0) * 2600)

export interface Thua {
  /** Số hiệu thửa hiển thị trên tooltip, ví dụ "125/32". */
  cid: string
  /** Chỉ số vào `D.parcels` — bản gốc: num % 4. */
  pIdx: number
  /** 'cln' = đất trồng cây lâu năm (cây ăn quả), 'ont' = đất ở. */
  loai: 'ont' | 'cln'
  pts: Diem[]
  /** Bản gốc hiện tooltip thường trực khi R() > 0.74. */
  nhanCoDinh: boolean
}

export interface VungQuyHoach {
  pts: Diem[]
  mau: string
  /** Độ đậm nền: bản gốc fillOpacity = f * 0.35. */
  f: number
}

export interface NhanVung {
  ll: Diem
  chu: string
  co: number
  mau: string
  xoay: number
}

export interface ToBanDo {
  thua: Thua[]
  vungQh: VungQuyHoach[]
  nhanVung: NhanVung[]
  /** Khung viền tờ bản đồ 32. */
  khung: Diem[]
  /** Lớp "Quy hoạch SDĐ" bật/tắt được. */
  lopQh: Diem[]
  /** Khung fitBounds ban đầu. */
  gioiHan: [Diem, Diem]
  /** Thửa được chọn sẵn khi mở bản đồ (firstSel của bản gốc). */
  chonDau: number
}

/** Dải nền chạy dọc trục đường, dùng cho các vùng quy hoạch. */
function dai(o1: number, o2: number): Diem[] {
  const tren: Diem[] = []
  const duoi: Diem[] = []
  for (let l0 = LNG0 - 0.0007; l0 <= LNG0 + 0.00335; l0 += 0.0003) {
    tren.push([latDuong(l0) + o2, l0])
    duoi.push([latDuong(l0) + o1, l0])
  }
  return tren.concat(duoi.reverse())
}

/** Chạy một lần, kết quả không đổi — bản gốc cũng sinh một lần khi khởi tạo bản đồ. */
export function sinhToBanDo(): ToBanDo {
  const R = taoRng(42)

  const vungQh: VungQuyHoach[] = [
    { pts: dai(0.00008, 0.00062), mau: '#F0709A', f: 0.85 },
    { pts: dai(-0.00052, -0.00008), mau: '#F0709A', f: 0.85 },
    { pts: dai(0.00062, 0.0019), mau: '#5DBE72', f: 0.85 },
    { pts: dai(-0.00008, 0.00008), mau: '#D9A441', f: 1.0 },
    {
      pts: [
        [latDuong(LNG0 + 0.00236) - 0.00052, LNG0 + 0.00236],
        [latDuong(LNG0 + 0.0033) - 0.00052, LNG0 + 0.0033],
        [latDuong(LNG0 + 0.0033) - 0.00012, LNG0 + 0.0033],
        [latDuong(LNG0 + 0.00236) - 0.00012, LNG0 + 0.00236],
      ],
      mau: '#B07CD8',
      f: 0.9,
    },
  ]

  const nhanVung: NhanVung[] = [
    {
      ll: [latDuong(LNG0 + 0.0008) + 0.00036, LNG0 + 0.0008],
      chu: 'ODT',
      co: 22,
      mau: 'rgba(150,30,70,.55)',
      xoay: 0,
    },
    {
      ll: [latDuong(LNG0 + 0.0002) - 0.00032, LNG0 + 0.0002],
      chu: 'ODT',
      co: 18,
      mau: 'rgba(150,30,70,.5)',
      xoay: 0,
    },
    {
      ll: [latDuong(LNG0 + 0.0015) + 0.00125, LNG0 + 0.0015],
      chu: 'CLN — CÂY ĂN QUẢ',
      co: 20,
      mau: 'rgba(20,90,40,.55)',
      xoay: 0,
    },
    {
      ll: [latDuong(LNG0 + 0.00285) - 0.00033, LNG0 + 0.00285],
      chu: 'DVH',
      co: 15,
      mau: 'rgba(90,40,130,.6)',
      xoay: 0,
    },
    {
      ll: [latDuong(LNG0 + 0.0012) + 0.00001, LNG0 + 0.0012],
      chu: 'ĐG. KHU PHỐ 1',
      co: 13,
      mau: 'rgba(122,80,10,.9)',
      xoay: -3,
    },
  ]

  let num = 86
  const allPts: Diem[] = []
  const thua: Thua[] = []
  let chonDau = -1

  const mk = (pts: Diem[], loai: 'ont' | 'cln'): number => {
    num += 1 + Math.floor(R() * 3)
    const i = thua.length
    thua.push({ cid: `${num}/32`, pIdx: num % 4, loai, pts, nhanCoDinh: R() > 0.74 })
    pts.forEach((p) => allPts.push(p))
    return i
  }

  const J = (a: number): number => a + (R() - 0.5) * 0.00006

  // Dải thửa phía trên trục đường
  let l = LNG0 - 0.0004
  while (l < LNG0 + 0.0031) {
    const w = 0.0003 + R() * 0.00034
    const d = 0.0004 + R() * 0.00016
    const b0 = latDuong(l) + 0.00005
    const b1 = latDuong(l + w) + 0.00005
    const i = mk(
      [
        [b0, l],
        [b1, l + w],
        [J(b1 + d), l + w],
        [J(b0 + d), l],
      ],
      'ont',
    )
    if (chonDau < 0) chonDau = i
    l += w
  }

  // Dải thửa phía dưới trục đường
  l = LNG0 - 0.0002
  while (l < LNG0 + 0.0029) {
    const w = 0.00034 + R() * 0.0004
    const d = 0.00034 + R() * 0.00014
    const t0 = latDuong(l) - 0.00006
    const t1 = latDuong(l + w) - 0.00006
    mk(
      [
        [t0, l],
        [t1, l + w],
        [J(t1 - d), l + w],
        [J(t0 - d), l],
      ],
      'ont',
    )
    l += w
  }

  // Dải vườn cây ăn quả phía bắc
  l = LNG0 - 0.0004
  while (l < LNG0 + 0.003) {
    const w = 0.0008 + R() * 0.0007
    const base = latDuong(l) + 0.00062
    mk(
      [
        [J(base), l],
        [J(base), l + w],
        [J(base + 0.00085 + R() * 0.0003), l + w - 0.00006],
        [J(base + 0.00085), l],
      ],
      'cln',
    )
    l += w + 0.00004
  }

  const las = allPts.map((p) => p[0])
  const lns = allPts.map((p) => p[1])
  const mnA = Math.min(...las) - 0.00008
  const mxA = Math.max(...las) + 0.00008
  const mnN = Math.min(...lns) - 0.0001
  const mxN = Math.max(...lns) + 0.0001

  return {
    thua,
    vungQh,
    nhanVung,
    khung: [
      [mnA, mnN],
      [mxA, mnN],
      [mxA, mxN],
      [mnA, mxN],
    ],
    lopQh: [
      [mnA - 0.00058, mnN + 0.0003],
      [mnA - 0.00012, mnN + 0.0003],
      [mnA - 0.00012, mxN - 0.0003],
      [mnA - 0.00058, mxN - 0.0003],
    ],
    gioiHan: [
      [mnA - 0.0007, mnN - 0.0004],
      [mxA + 0.0003, mxN + 0.0004],
    ],
    chonDau: chonDau < 0 ? 0 : chonDau,
  }
}

/**
 * Đo cạnh và diện tích thửa như bản gốc: quy đổi độ → mét bằng 111320
 * (có hiệu chỉnh cos(lat) cho kinh độ), diện tích theo công thức shoelace.
 */
export const doCanh = (a: Diem, b: Diem): number => {
  const dy = (b[0] - a[0]) * 111320
  const dx = (b[1] - a[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

export const doDienTich = (pts: Diem[]): number => {
  let ar = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!
    const b = pts[(i + 1) % pts.length]!
    ar += a[1] * b[0] - b[1] * a[0]
  }
  return (Math.abs(ar) / 2) * 111320 * 111320 * Math.cos((pts[0]![0] * Math.PI) / 180)
}
