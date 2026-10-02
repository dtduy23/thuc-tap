import { nice } from '@/dieu-hanh/lib/format'

export interface ChuoiSo {
  name: string
  c: string
  vals: ReadonlyArray<number>
}

interface Props {
  series: ReadonlyArray<ChuoiSo>
  labels: ReadonlyArray<string>
  h?: number
}

/** Port từ line2SVG() — nhiều chuỗi chung một thang, chỉ ghi số ở điểm cuối. */
export function Line2({ series, labels, h = 200 }: Props) {
  const W = 460,
    padL = 38,
    padR = 16,
    padT = 26,
    padB = 24
  const all = series.flatMap((x) => x.vals)
  const mx = Math.max(...all),
    mn = Math.min(...all)
  const rg = mx - mn || 1
  const xs = (i: number) => padL + i * ((W - padL - padR) / Math.max(1, labels.length - 1))
  const ys = (v: number) => padT + (1 - (v - mn) / rg) * (h - padT - padB)

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      className="block h-auto w-full"
      role="img"
      aria-label={series.map((s) => `${s.name}: ${nice(s.vals[s.vals.length - 1]!)}`).join(', ')}
    >
      {[0, 0.5, 1].map((f) => {
        const v = mn + f * rg
        const y = ys(v)
        return (
          <g key={f}>
            <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke="var(--grid-line)" />
            <text
              x={padL - 7}
              y={(y + 3.5).toFixed(1)}
              textAnchor="end"
              fontSize={10}
              fill="var(--chart-axis)"
            >
              {nice(v)}
            </text>
          </g>
        )
      })}
      {series.map((sr) => {
        const pts = sr.vals.map((v, i) => [xs(i), ys(v)] as const)
        const li = sr.vals.length - 1
        return (
          <g key={sr.name}>
            <polyline
              points={pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}
              fill="none"
              stroke={sr.c}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle
                key={labels[i] ?? i}
                cx={p[0].toFixed(1)}
                cy={p[1].toFixed(1)}
                r={i === li ? 4.6 : 3.2}
                fill="var(--gdos-surface)"
                stroke={sr.c}
                strokeWidth={2.2}
              />
            ))}
            <text
              x={pts[li]![0].toFixed(1)}
              y={(pts[li]![1] - 9).toFixed(1)}
              textAnchor="middle"
              fontSize={11}
              fontWeight={800}
              fill={sr.c}
            >
              {nice(sr.vals[li]!)}
            </text>
          </g>
        )
      })}
      {labels.map((l, i) => (
        <text key={l} x={xs(i).toFixed(1)} y={h - 7} textAnchor="middle" fontSize={10} fill="var(--faint)">
          {l}
        </text>
      ))}
    </svg>
  )
}
