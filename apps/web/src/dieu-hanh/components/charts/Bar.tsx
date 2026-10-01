import { nice } from '@/dieu-hanh/lib/format'
import { mauMuc, type MucChart } from './palette'

/** Port từ barSVG() — W=460, padL=36, padR=10, padT=22, padB=26. */
export function Bar({ items, h = 150 }: { items: ReadonlyArray<MucChart>; h?: number }) {
  const W = 460,
    padL = 36,
    padR = 10,
    padT = 22,
    padB = 26
  const iw = (W - padL - padR) / items.length
  const bw = Math.min(52, iw * 0.6)
  const mx = Math.max(...items.map((i) => Number(i[1]))) || 1

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      className="block h-auto w-full"
      role="img"
      aria-label={items.map((i) => `${i[0]}: ${nice(i[1])}`).join(', ')}
    >
      {[0, 0.5, 1].map((f) => {
        const y = padT + (1 - f) * (h - padT - padB)
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
              {nice(mx * f)}
            </text>
          </g>
        )
      })}
      {items.map((it, i) => {
        const bh = Math.max(2, (Number(it[1]) / mx) * (h - padT - padB))
        const x = padL + i * iw + (iw - bw) / 2
        const y = h - padB - bh
        return (
          <g key={it[0]}>
            <rect
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              width={bw.toFixed(1)}
              height={bh.toFixed(1)}
              rx={Math.min(6, bw / 4).toFixed(1)}
              fill={mauMuc(it, i)}
            />
            <text
              x={(x + bw / 2).toFixed(1)}
              y={(y - 6).toFixed(1)}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--body)"
            >
              {typeof it[3] === 'string' ? it[3] : nice(it[1])}
            </text>
            <text
              x={(x + bw / 2).toFixed(1)}
              y={h - 9}
              textAnchor="middle"
              fontSize={10.8}
              fill="var(--faint)"
            >
              {String(it[0]).slice(0, 9)}
            </text>
          </g>
        )
      })}
      <line
        x1={padL}
        y1={h - padB}
        x2={W - padR}
        y2={h - padB}
        stroke="var(--border-strong)"
        strokeWidth={1.2}
      />
    </svg>
  )
}
