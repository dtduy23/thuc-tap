import { nice } from '@/dieu-hanh/lib/format'
import { mauMuc, type MucChart } from './palette'

interface Props {
  items: ReadonlyArray<MucChart>
  W?: number
  labW?: number
  valW?: number
  max?: number
}

/** Port từ hbarSVG() — rowH=33, thanh cao 19, bo tròn 9.5. */
export function HBar({ items, W = 460, labW = 118, valW = 52, max }: Props) {
  const rowH = 33
  const h = items.length * rowH + 8
  const mx = max || Math.max(...items.map((i) => Number(i[1]))) || 1
  const trackW = W - labW - valW - 18
  const catNhan = Math.max(17, Math.floor(labW / 7.4))

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      className="block h-auto w-full"
      role="img"
      aria-label={items.map((i) => `${i[0]}: ${nice(i[1])}`).join(', ')}
    >
      {items.map((it, i) => {
        const y = i * rowH + 7
        const bw = Math.max(4, (Number(it[1]) / mx) * trackW)
        return (
          <g key={it[0]}>
            <text x={labW} y={y + 13.5} textAnchor="end" fontSize={11.4} fontWeight={600} fill="var(--body)">
              {String(it[0]).slice(0, catNhan)}
            </text>
            <rect x={labW + 9} y={y} width={trackW} height={19} rx={9.5} fill="var(--track)" />
            <rect x={labW + 9} y={y} width={bw.toFixed(1)} height={19} rx={9.5} fill={mauMuc(it, i)} />
            <text x={W - 4} y={y + 13.5} textAnchor="end" fontSize={11.8} fontWeight={800} fill="var(--ink)">
              {nice(it[1])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
