import type { KpiXp } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

const W = 400
const H = 290
const CX = 200
const CY = 150
const R = 100
const MIN = 50

/** Port từ radar(): đa giác hiện trạng đè lên đa giác mục tiêu nét đứt, thang 50–100%. */
export function RadarKpi({ kpis }: { kpis: ReadonlyArray<KpiXp> }) {
  const axes = kpis.filter((k): k is KpiXp & { v: number } => k.v != null)
  const n = axes.length
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const sc = (v: number) => Math.max(0, (v - MIN) / (100 - MIN)) * R
  const P = (i: number, v: number) => [CX + sc(v) * Math.cos(ang(i)), CY + sc(v) * Math.sin(ang(i))] as const
  const diem = (vals: number[]) => vals.map((v, i) => P(i, v).join(',')).join(' ')

  return (
    <div className="flex flex-wrap items-center justify-center gap-[18px]">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        className="flex-none"
        style={{ maxWidth: W }}
        role="img"
        aria-label="Radar hiện trạng so với mục tiêu KPI"
      >
        {[60, 70, 80, 90, 100].map((lv) => (
          <polygon key={lv} points={diem(axes.map(() => lv))} fill="none" stroke="var(--bd-luoi)" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = P(i, 100)
          const cos = Math.cos(ang(i))
          const sin = Math.sin(ang(i))
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'
          return (
            <g key={a.code}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--bd-luoi)" />
              <text
                x={CX + (R + 18) * cos}
                y={CY + (R + 18) * sin + (sin > 0.5 ? 10 : sin < -0.5 ? -4 : 4)}
                textAnchor={anchor}
                fontSize={11.5}
                fill="var(--body)"
              >
                {a.short}
              </text>
            </g>
          )
        })}
        {[60, 80, 100].map((lv) => (
          <text key={lv} x={CX + 3} y={CY - sc(lv) + 10} fontSize={9} fill="var(--faint)">
            {lv}
          </text>
        ))}
        <polygon
          points={diem(axes.map((a) => a.t))}
          fill="none"
          stroke="var(--body)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <polygon
          points={diem(axes.map((a) => a.v))}
          fill="var(--bd-1)"
          fillOpacity={0.16}
          stroke="var(--bd-1)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {axes.map((a, i) => {
          const [x, y] = P(i, a.v)
          return (
            <g key={a.code}>
              <circle cx={x} cy={y} r={5} fill="var(--bd-1)" stroke="var(--gdos-surface)" strokeWidth={2} />
              <circle
                cx={x}
                cy={y}
                r={12}
                fill="transparent"
                {...goiY({ tieuDe: a.name, than: `Hiện trạng ${soCoDinh(a.v, 2)}% · Mục tiêu ≥ ${a.t}%` })}
              />
            </g>
          )
        })}
      </svg>
      <div className="grid min-w-[220px] flex-1 gap-2">
        <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-body">
          <span>
            <i className="mr-1.5 inline-block h-[3px] w-3.5 rounded-sm bg-bd-1 align-[3px]" />
            Hiện trạng
          </span>
          <span>
            <i className="mr-1.5 inline-block h-[3px] w-3.5 rounded-sm bg-body align-[3px]" />
            Mục tiêu
          </span>
        </div>
        {axes.map((a) => (
          <div key={a.code} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[13px]">
            <i className="size-2.5 rounded-[3px] bg-bd-1" />
            <span className="text-body">{a.name}</span>
            <b className="tnum font-semibold text-ink">
              {soCoDinh(a.v, a.v % 1 ? 2 : 0)}%
              <em className="ml-1.5 text-[12px] font-normal not-italic text-faint">≥{a.t}%</em>
            </b>
          </div>
        ))}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[13px]">
          <i className="size-2.5 rounded-[3px] bg-bd-khac" />
          <span className="text-body">Nhiệm vụ cấp trên giao đúng hạn</span>
          <b>
            <NhanDanhGia loai="na" coIcon>
              Chưa có
            </NhanDanhGia>
          </b>
        </div>
      </div>
    </div>
  )
}
