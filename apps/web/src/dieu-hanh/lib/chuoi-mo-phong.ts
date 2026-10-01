/**
 * Chuỗi 10 kỳ mô phỏng của Dashboard Xã/Phường — port nguyên rng(), genSeries(),
 * periodLabels(), niceStep() và bộ nhớ HIST. Phải giữ đúng từng phép Math.imul
 * vì sparkline, đường xu hướng và bản đồ nhiệt đặt cạnh file gốc để đối chiếu:
 * lệch một bit là lệch hình.
 */

export interface TuyChonChuoi {
  flat?: boolean
  small?: boolean
  pct?: boolean
  vol?: number
  drift?: number
  cap?: number
  int?: boolean
}

export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function genSeries(code: string, v: number, o: TuyChonChuoi = {}): number[] {
  const r = rng(code)
  const a = new Array<number>(10)
  a[9] = v
  for (let i = 8; i >= 0; i--) {
    const p = a[i + 1]!
    let x: number
    if (o.flat) x = p
    else if (o.small) x = Math.max(0, Math.round(p + (r() - 0.45) * (o.vol ?? 3)))
    else if (o.pct) x = Math.min(o.cap ?? 100, Math.max(0, p - (o.drift ?? 0.2) + (r() - 0.5) * (o.vol ?? 3)))
    else {
      x = p * (1 - (o.drift ?? 0.01) + (r() - 0.5) * 2 * (o.vol ?? 0.1))
      if (o.int !== false) x = Math.round(x)
    }
    a[i] = x
  }
  return a
}

/** Nhãn 10 kỳ lùi từ tháng cho trước: T12/25 … T9/26. */
export function periodLabels(month: number, year: number): string[] {
  const out: string[] = []
  for (let i = 9; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y--
    }
    out.push(`T${m}/${String(y).slice(2)}`)
  }
  return out
}

export const P9 = periodLabels(9, 2026)
export const P8 = periodLabels(8, 2026)

export function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

export const HIST: Record<string, number[]> = {}

/** Lần gọi đầu theo mã quyết định chuỗi; các lần sau trả lại đúng chuỗi đó. */
export function hist(code: string, v: number, o?: TuyChonChuoi): number[] {
  return (HIST[code] ??= genSeries(code, v, o))
}

/* Các chuỗi phải khớp nhau (đã giải quyết ≤ tiếp nhận…) nên sinh từ chuỗi gốc. */
HIST['TTHC-01'] = genSeries('TTHC-01', 10045, { vol: 0.09, drift: 0.012 })
HIST['TTHC-02'] = HIST['TTHC-01'].map((v, i) =>
  i === 9 ? 9825 : Math.round(v * (0.955 + rng('r' + i)() * 0.03)),
)
HIST['TTHC-04'] = HIST['TTHC-01'].map((v, i) =>
  i === 9 ? 220 : Math.round(v * (0.015 + rng('p' + i)() * 0.02)),
)
HIST['PAKN-01'] = genSeries('PAKN-01', 42, { small: true, vol: 14 })
HIST['PAKN-02'] = HIST['PAKN-01'].map((v, i) =>
  i === 9 ? 42 : Math.max(0, v - Math.round(rng('pk' + i)() * 3)),
)
