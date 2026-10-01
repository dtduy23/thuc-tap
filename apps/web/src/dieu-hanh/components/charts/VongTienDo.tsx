import type { ReactNode } from 'react'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'

interface Props {
  v: number
  label: string
  sub?: string
  color?: string
  size?: number
  max?: number
  dec?: number
}

/** Port từ ring(): vòng tiến độ r=42, nét 9, bo đầu. */
export function VongTienDo({
  v,
  label,
  sub = '',
  color = 'var(--bd-1)',
  size = 112,
  max = 100,
  dec = 0,
}: Props) {
  const f = Math.min(v / max, 1) * 100
  return (
    <div className="text-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${label}: ${v}%`}
        className="mx-auto"
      >
        <circle cx={50} cy={50} r={42} fill="none" stroke="var(--bd-ray)" strokeWidth={9} />
        <circle
          cx={50}
          cy={50}
          r={42}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${f} 100`}
          transform="rotate(-90 50 50)"
          {...goiY({ tieuDe: label, than: `${soCoDinh(v, dec)}%` })}
        />
        <text x={50} y={55} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--ink)">
          {soCoDinh(v, dec)}%
        </text>
      </svg>
      <div className="mt-1 text-[12.5px] leading-[1.3] text-body">{label}</div>
      {sub && <div className="text-[11px] text-faint">{sub}</div>}
    </div>
  )
}

/** .rings — lưới tự giãn; `baCot` là biến thể 3 cột cố định của thẻ "Mức độ đầy đủ dữ liệu". */
export function LuoiVong({ children, baCot }: { children: ReactNode; baCot?: boolean }) {
  return (
    <div
      className={`grid gap-x-2.5 gap-y-[14px] ${
        baCot ? 'grid-cols-3' : 'grid-cols-[repeat(auto-fit,minmax(118px,1fr))]'
      }`}
    >
      {children}
    </div>
  )
}
