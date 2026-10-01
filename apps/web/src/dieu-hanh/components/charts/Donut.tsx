import { nice, phanTram } from '@/dieu-hanh/lib/format'
import { CH_COLORS, mauMuc, type MucChart } from './palette'

interface Props {
  items: ReadonlyArray<MucChart>
  size?: number
  thick?: number
  /** Chữ giữa vòng; bỏ trống thì bản gốc hiện tổng. */
  center?: string
}

/** Port từ donutSVG() — giữ nguyên công thức dasharray/dashoffset và khe 3px. */
export function Donut({ items, size = 150, thick = 26, center }: Props) {
  const tot = items.reduce((a, b) => a + Number(b[1]), 0) || 1
  const r = (size - thick) / 2
  const C = 2 * Math.PI * r
  const gap = items.length > 1 ? 3 : 0

  const segs = items.map((it, i) => {
    const f = Number(it[1]) / tot
    const len = Math.max(0.5, f * C - gap)
    // Tổng tỷ lệ các cung đứng trước — bản gốc cộng dồn vào biến `off`
    const off = items.slice(0, i).reduce((a, b) => a + Number(b[1]) / tot, 0)
    return (
      <circle
        key={it[0]}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={mauMuc(it, i)}
        strokeWidth={thick}
        strokeDasharray={`${len.toFixed(1)} ${(C - len).toFixed(1)}`}
        strokeDashoffset={(-off * C + -gap / 2).toFixed(1)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    )
  })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size, flex: 'none' }}
      role="img"
      aria-label={items.map((i) => `${i[0]}: ${nice(i[1])}`).join(', ')}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thick} />
      {segs}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="7"
        fontSize={size >= 120 ? 19 : 16}
        fontWeight={800}
        fill="var(--ink)"
      >
        {center !== undefined ? center : nice(tot)}
      </text>
    </svg>
  )
}

/** Port từ donutLegend(). */
export function DonutLegend({ items }: { items: ReadonlyArray<MucChart> }) {
  const tot = items.reduce((a, b) => a + Number(b[1]), 0) || 1
  return (
    <>
      {items.map((it, i) => (
        <div key={it[0]} className="my-1 flex items-center gap-[7px] text-[0.72rem]">
          <i
            className="size-2.5 flex-none rounded-[3px]"
            style={{ background: it[2] ?? CH_COLORS[i % CH_COLORS.length] }}
          />
          <span className="flex-1">{it[0]}</span>
          <b className="tnum text-ink">
            {nice(it[1])} · {phanTram(it[1], tot)}%
          </b>
        </div>
      ))}
    </>
  )
}
