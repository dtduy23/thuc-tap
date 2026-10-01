import { nice } from '@/dieu-hanh/lib/format'

/** Port từ gaugeSVG() — cung 180×116, pathLength=100 nên dasharray là % thẳng. */
export function Gauge({ val, sub, color }: { val: number; sub?: string; color: string }) {
  const d = 'M24 82 A66 66 0 0 1 156 82'
  return (
    <svg
      viewBox="0 0 180 116"
      className="mx-auto block h-auto w-full max-w-[240px]"
      role="img"
      aria-label={`${nice(val)}%${sub ? ` — ${sub}` : ''}`}
    >
      <path d={d} fill="none" stroke="var(--track)" strokeWidth={16} strokeLinecap="round" />
      <path
        d={d}
        pathLength={100}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={`${Math.min(100, Math.max(2, val))} 100`}
      />
      <text x={90} y={72} textAnchor="middle" fontSize={27} fontWeight={800} fill="var(--ink)">
        {nice(val)}%
      </text>
      <text x={90} y={108} textAnchor="middle" fontSize={10.5} fill="var(--faint)">
        {sub}
      </text>
    </svg>
  )
}
