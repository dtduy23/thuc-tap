import type { ReactNode } from 'react'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

interface Props {
  value: number
  label: string
  target?: number | null
  sub?: string
  max?: number
  /** Số liệu vô lý (tiêm chủng 154%) — tô xám và gắn nhãn bất thường. */
  invalid?: boolean
  dec?: number
}

/** Port từ gauge() của Dashboard Xã/Phường — bán nguyệt r=52 kèm vạch mục tiêu. */
export function GaugeMucTieu({
  value,
  label,
  target = null,
  sub = '',
  max = 100,
  invalid = false,
  dec = 1,
}: Props) {
  const v = Math.max(0, Math.min(max, value))
  const r = 52
  const cx = 65
  const cy = 64
  const pt = (f: number) => {
    const a = Math.PI * (1 - f)
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const
  }
  const [ex, ey] = pt(v / max)
  const met = target == null ? true : value >= target
  const col = invalid ? 'var(--bd-khac)' : met ? 'var(--bd-1)' : 'var(--bd-chua-dat)'
  const a = target != null ? Math.PI * (1 - target / max) : 0

  return (
    <div className="text-center">
      <svg
        viewBox="0 0 130 78"
        role="img"
        aria-label={`${label}: ${value}%`}
        className="mx-auto block h-auto w-full max-w-[170px]"
      >
        <path
          d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--bd-ray)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {v > 0 && (
          <path
            d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
            fill="none"
            stroke={col}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
        {target != null && (
          <line
            x1={cx + (r - 8) * Math.cos(a)}
            y1={cy - (r - 8) * Math.sin(a)}
            x2={cx + (r + 8) * Math.cos(a)}
            y2={cy - (r + 8) * Math.sin(a)}
            stroke="var(--ink)"
            strokeWidth={2}
          />
        )}
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--ink)">
          {soCoDinh(value, dec)}%
        </text>
      </svg>
      <div className="mt-0.5 text-[12.5px] text-body">{label}</div>
      {sub && <div className="text-[11px] text-faint">{sub}</div>}
      <div className="mt-1.5">
        {invalid ? (
          <NhanDanhGia loai="wa" coIcon>
            Số liệu bất thường
          </NhanDanhGia>
        ) : target == null ? null : met ? (
          <NhanDanhGia loai="ok" coIcon>
            Đạt ≥ {target}%
          </NhanDanhGia>
        ) : (
          <NhanDanhGia loai="no" coIcon>
            Chưa đạt ≥ {target}%
          </NhanDanhGia>
        )}
      </div>
    </div>
  )
}

/** .gauges */
export function LuoiGauge({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">{children}</div>
}
