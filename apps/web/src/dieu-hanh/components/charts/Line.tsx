import { useId } from 'react'
import { nice } from '@/dieu-hanh/lib/format'

interface Props {
  vals: ReadonlyArray<number>
  labels: ReadonlyArray<string>
  h?: number
  color?: string
}

/** Port từ lineSVG() — có vùng gradient dưới đường, nhãn số ở mọi điểm khi ≤ 8 điểm. */
export function Line({ vals, labels, h = 140, color = '#1B66E0' }: Props) {
  const id = useId().replace(/:/g, '')
  if (!vals.length) return null

  const W = 460,
    padL = 36,
    padR = 18,
    padT = 20,
    padB = 24
  const mx = Math.max(...vals),
    mn = Math.min(...vals)
  const rg = mx - mn || 1
  const xs = (i: number) => padL + i * ((W - padL - padR) / Math.max(1, vals.length - 1))
  const ys = (v: number) => padT + (1 - (v - mn) / rg) * (h - padT - padB)
  const pts = vals.map((v, i) => [xs(i), ys(v)] as const)
  const chuoiPts = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')
  const showAll = vals.length <= 8

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      className="block h-auto w-full"
      role="img"
      aria-label={labels.map((l, i) => `${l}: ${nice(vals[i]!)}`).join(', ')}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => {
        const v = mn + f * rg
        const y = ys(v)
        return (
          <g key={f}>
            <line
              x1={padL}
              y1={y.toFixed(1)}
              x2={W - padR}
              y2={y.toFixed(1)}
              stroke="var(--grid-line)"
              strokeWidth={1}
            />
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
      <polygon
        points={`${chuoiPts} ${xs(vals.length - 1).toFixed(1)},${h - padB} ${padL},${h - padB}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={chuoiPts}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => {
        const last = i === vals.length - 1
        return (
          <g key={labels[i] ?? i}>
            <circle
              cx={p[0].toFixed(1)}
              cy={p[1].toFixed(1)}
              r={last ? 5 : 3.4}
              fill="var(--gdos-surface)"
              stroke={color}
              strokeWidth={last ? 2.8 : 2.2}
            />
            {(showAll || last || i === 0) && (
              <text
                x={p[0].toFixed(1)}
                y={(p[1] - 9).toFixed(1)}
                textAnchor="middle"
                fontSize={last ? 11.5 : 10.2}
                fontWeight={last ? 800 : 600}
                fill={last ? 'var(--ink)' : 'var(--gdos-muted)'}
              >
                {nice(vals[i]!)}
              </text>
            )}
          </g>
        )
      })}
      {labels.map((l, i) => (
        <text key={l} x={xs(i).toFixed(1)} y={h - 8} textAnchor="middle" fontSize={10.8} fill="var(--faint)">
          {l}
        </text>
      ))}
    </svg>
  )
}
