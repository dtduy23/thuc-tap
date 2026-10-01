import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import type { KpiDayDu } from '../use-kpi'

/** Port từ heatmap(): đậm dần theo mức vượt mục tiêu (trần 12 điểm %), đỏ khi chưa đạt. */
export function BanDoNhiet({
  kpis,
  labels,
}: {
  kpis: ReadonlyArray<KpiDayDu>
  labels: ReadonlyArray<string>
}) {
  return (
    <div className="grid min-w-[720px] grid-cols-[minmax(170px,1.6fr)_repeat(10,minmax(46px,1fr))] gap-[3px]">
      <div />
      {labels.map((l, i) => (
        <div
          key={l}
          className={`pb-0.5 text-center text-[11px] ${i === 9 ? 'font-semibold text-ink' : 'text-faint'}`}
        >
          {l}
        </div>
      ))}
      {kpis.map((k) => (
        <div key={k.code} className="contents">
          <div className="flex items-center pr-2 text-[12.5px] leading-[1.25] text-body">
            {k.code} · {k.short}
          </div>
          {labels.map((l, i) => {
            const lop =
              'tnum grid h-[38px] place-items-center rounded-[5px] text-[11.5px] font-semibold hover:outline-2 hover:-outline-offset-1 hover:outline-ink'
            if (k.v == null || !k.hist) {
              return (
                <div
                  key={l}
                  className={`${lop} bg-bd-nen-phu text-faint`}
                  {...goiY({ tieuDe: `${k.code} · ${l}`, than: 'Chưa có dữ liệu' })}
                >
                  —
                </div>
              )
            }
            const v = k.hist[i]!
            const gap = v - k.t
            const met = gap >= 0
            const pct = met ? Math.round(28 + (Math.min(gap, 12) / 12) * 72) : 72
            return (
              <div
                key={l}
                className={`${lop} ${pct >= 60 ? 'text-white' : 'text-ink'}`}
                style={{
                  background: `color-mix(in srgb, ${met ? 'var(--bd-1)' : 'var(--bd-chua-dat)'} ${pct}%, var(--gdos-surface))`,
                }}
                {...goiY({
                  tieuDe: `${k.code} · ${l} ${i === 9 ? '(thực tế)' : '(mô phỏng)'}`,
                  than: (
                    <>
                      {soCoDinh(v, 1)}% · mục tiêu ≥ {k.t}%
                      <br />
                      {met ? 'Đạt' : 'Chưa đạt'} ({gap >= 0 ? '+' : ''}
                      {soCoDinh(gap, 1)} điểm %)
                    </>
                  ),
                })}
              >
                {soCoDinh(v, v >= 99.95 || v % 1 === 0 ? 0 : 1)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
