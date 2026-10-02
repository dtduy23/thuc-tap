import type { VongMucTieu } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

const S = 230
const C = S / 2
const SW = 13
const GAP = 5
/** Cung 3/4 vòng, mở ở góc dưới bên phải. */
const ARC = 0.75

/** Port từ radialBars(): vòng đồng tâm, vạch đen trên mỗi vòng là mục tiêu KPI. */
export function VongDongTam({ items }: { items: ReadonlyArray<VongMucTieu> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-[18px]">
      <svg
        width={S}
        height={S}
        viewBox={`0 0 ${S} ${S}`}
        className="flex-none"
        role="img"
        aria-label={items.map((it) => `${it.label}: ${it.v}%`).join(', ')}
      >
        {items.map((it, i) => {
          const r = C - 10 - i * (SW + GAP)
          const chuVi = 2 * Math.PI * r
          const f = (Math.min(it.v, 100) / 100) * ARC
          const a = ((135 + (270 * it.t) / 100) * Math.PI) / 180
          return (
            <g key={it.code}>
              <circle
                cx={C}
                cy={C}
                r={r}
                fill="none"
                stroke="var(--bd-ray)"
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={`${chuVi * ARC} ${chuVi}`}
                transform={`rotate(135 ${C} ${C})`}
              />
              <circle
                cx={C}
                cy={C}
                r={r}
                fill="none"
                stroke={it.color}
                strokeWidth={SW}
                strokeLinecap="round"
                strokeDasharray={`${chuVi * f} ${chuVi}`}
                transform={`rotate(135 ${C} ${C})`}
                {...goiY({ tieuDe: it.label, than: `${soCoDinh(it.v, it.dec ?? 2)}% · mục tiêu ≥ ${it.t}%` })}
              />
              <line
                x1={C + (r - SW / 2 - 2) * Math.cos(a)}
                y1={C + (r - SW / 2 - 2) * Math.sin(a)}
                x2={C + (r + SW / 2 + 2) * Math.cos(a)}
                y2={C + (r + SW / 2 + 2) * Math.sin(a)}
                stroke="var(--ink)"
                strokeWidth={2}
              />
            </g>
          )
        })}
      </svg>
      <div className="grid min-w-[220px] flex-1 gap-2">
        {items.map((it) => (
          <div key={it.code} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[13px]">
            <i className="size-2.5 rounded-[3px]" style={{ background: it.color }} />
            <span className="text-body">
              {it.label}
              <br />
              <small className="text-faint">
                {it.code} · mục tiêu ≥ {it.t}%
              </small>
            </span>
            <b className="tnum font-semibold">
              {soCoDinh(it.v, it.dec ?? 2)}%
              <br />
              <NhanDanhGia loai="ok" coIcon className="mt-[3px]">
                Đạt
              </NhanDanhGia>
            </b>
          </div>
        ))}
      </div>
    </div>
  )
}
