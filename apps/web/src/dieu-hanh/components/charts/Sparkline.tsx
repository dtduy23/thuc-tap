/**
 * Port từ sparkMini() + decorateStats(): bản gốc sinh 8 điểm giả lập từ
 * giá trị thẻ bằng PRNG gieo theo nội dung chữ, nên mỗi thẻ có đường riêng
 * nhưng ổn định giữa các lần render. Giữ nguyên thuật toán để hình trùng bản gốc.
 */
export function sinhDiem(giaTri: number, hat: string): number[] {
  let sd = 7
  for (const ch of hat) sd = (sd * 31 + ch.charCodeAt(0)) % 99991
  const rnd = () => {
    sd = (sd * 9301 + 49297) % 233280
    return sd / 233280
  }
  const vals: number[] = []
  let cur = giaTri * (0.84 + rnd() * 0.1)
  for (let k = 0; k < 7; k++) {
    vals.push(cur)
    cur += giaTri * (rnd() * 0.1 - 0.034)
  }
  vals.push(giaTri)
  return vals
}

interface Props {
  vals: ReadonlyArray<number>
  color: string
  w?: number
  h?: number
}

export function Sparkline({ vals, color, w = 118, h = 30 }: Props) {
  const mx = Math.max(...vals),
    mn = Math.min(...vals)
  const rg = mx - mn || 1
  const xs = (i: number) => 4 + i * ((w - 8) / (vals.length - 1))
  const ys = (v: number) => 5 + (1 - (v - mn) / rg) * (h - 11)
  const pts = vals.map((v, i) => [xs(i), ys(v)] as const)
  const cuoi = pts[pts.length - 1]!

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: w, height: h }}
      className="mx-auto mt-[7px] block"
      aria-hidden="true"
    >
      <polyline
        points={pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".8"
      />
      <circle cx={cuoi[0].toFixed(1)} cy={cuoi[1].toFixed(1)} r={3} fill={color} />
    </svg>
  )
}
