import type { CotBieuDo } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { niceStep } from '@/dieu-hanh/lib/chuoi-mo-phong'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'

interface Props {
  rows: ReadonlyArray<CotBieuDo>
  height?: number
  suffix?: string
  max?: number
}

/** Port từ columns(): cột đứng, đường lưới theo bước "đẹp", nhãn số trên đỉnh cột. */
export function CotDoc({ rows, height = 210, suffix = '', max }: Props) {
  const mx = max ?? Math.max(...rows.map((r) => r.value))
  const step = niceStep(mx / 4)
  const top = Math.max(step, Math.ceil(mx / step) * step) || 1
  const luoi: number[] = []
  for (let v = step; v <= top + 1e-9; v += step) luoi.push(v)

  return (
    <>
      <div
        className="relative mt-[22px] flex items-end gap-[14px] border-b border-bd-truc px-1"
        style={{ height }}
      >
        {luoi.map((v) => (
          <div
            key={v}
            className="pointer-events-none absolute inset-x-0 border-t border-bd-luoi"
            style={{ bottom: `${(v / top) * 100}%` }}
          />
        ))}
        {rows.map((r) => {
          const pc = (r.value / top) * 100
          return (
            <div
              key={r.label}
              className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              <div
                className="tnum absolute text-[12.5px] font-semibold text-ink"
                style={{ bottom: `calc(${pc}% + 4px)` }}
              >
                {r.display ?? soCoDinh(r.value)}
              </div>
              <div
                className="min-h-[2px] w-[min(56px,70%)] rounded-t hover:brightness-110"
                style={{ height: `${pc}%`, background: r.color ?? 'var(--bd-1)' }}
                {...goiY({ tieuDe: r.label, than: r.tip ?? `${soCoDinh(r.value)}${suffix}` })}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-[14px] px-1 pt-1.5">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0 flex-1 text-center text-[12px] leading-[1.3] text-body">
            {r.label}
          </div>
        ))}
      </div>
    </>
  )
}
