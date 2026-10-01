import type { PhanDonut } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'

interface Props {
  parts: ReadonlyArray<PhanDonut>
  center?: string
  centerSub?: string
  size?: number
  dec?: number
}

/**
 * Port từ donut() của Dashboard Xã/Phường: vòng pathLength=100, khe giữa các
 * cung tối đa 0,8 và kèm danh sách giá trị + tỷ lệ bên phải.
 */
export function DonutPhanRa({ parts, center, centerSub, size = 172, dec = 1 }: Props) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const r = 62
  const sw = 22
  const nz = parts.filter((p) => p.value > 0).length
  // Tỷ lệ dưới 1% mới hiện 2 số lẻ, để cung 1 hồ sơ trên 10.045 không thành "0,0%".
  const pct = (v: number) => soCoDinh((v / total) * 100, v && v / total < 0.01 ? 2 : dec)

  const segs = parts.map((p, i) => {
    if (!p.value) return null
    const len = (p.value / total) * 100
    const gap = nz > 1 ? Math.min(0.8, len * 0.3) : 0
    const dai = Math.max(len - gap, 0.15)
    // Tổng độ dài các cung đứng trước — bản gốc cộng dồn vào biến `acc`
    const acc = parts.slice(0, i).reduce((s, q) => s + (q.value / total) * 100, 0)
    return (
      <circle
        key={p.label}
        cx={90}
        cy={90}
        r={r}
        fill="none"
        stroke={p.color}
        strokeWidth={sw}
        pathLength={100}
        strokeDasharray={`${dai} ${100 - dai}`}
        strokeDashoffset={-acc}
        transform="rotate(-90 90 90)"
        className="transition-[stroke-width] duration-150 hover:[stroke-width:26px]"
        {...goiY({ tieuDe: p.label, than: `${soCoDinh(p.value)} · ${pct(p.value)}%` })}
      />
    )
  })

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 180 180"
        role="img"
        className="flex-none"
        aria-label={parts.map((p) => `${p.label}: ${soCoDinh(p.value)}`).join(', ')}
      >
        <circle cx={90} cy={90} r={r} fill="none" stroke="var(--bd-ray)" strokeWidth={sw} />
        {segs}
        <text
          x={90}
          y={centerSub ? 88 : 96}
          textAnchor="middle"
          fontSize={24}
          fontWeight={700}
          fill="var(--ink)"
        >
          {center ?? soCoDinh(total)}
        </text>
        {centerSub && (
          <text x={90} y={108} textAnchor="middle" fontSize={11.5} fill="var(--faint)">
            {centerSub}
          </text>
        )}
      </svg>
      <DanhSachGiaTri
        ds={parts.map((p) => ({
          label: p.label,
          color: p.color,
          so: soCoDinh(p.value),
          phu: `${pct(p.value)}%`,
        }))}
      />
    </div>
  )
}

/** .dlist — dùng chung cho donut, waffle. */
export function DanhSachGiaTri({
  ds,
  className = 'min-w-[160px] flex-1',
}: {
  ds: ReadonlyArray<{ label: string; color: string; so: string; phu: string }>
  className?: string
}) {
  return (
    <div className={`grid gap-2 ${className}`}>
      {ds.map((d) => (
        <div key={d.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[13px]">
          <i className="size-2.5 rounded-[3px]" style={{ background: d.color }} />
          <span className="text-body">{d.label}</span>
          <b className="tnum font-semibold text-ink">
            {d.so}
            <em className="ml-1.5 text-[12px] font-normal not-italic text-faint">{d.phu}</em>
          </b>
        </div>
      ))}
    </div>
  )
}
