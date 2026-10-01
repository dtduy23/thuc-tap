import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'
import type { KpiDayDu } from '../use-kpi'

const MIN = 70
const MAX = 100
const pos = (v: number) => Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100))

/** Port từ bullet(): thang 70–100%, vùng đỏ nhạt dưới mục tiêu, vạch đen là mục tiêu. */
export function BulletKpi({ kpis }: { kpis: ReadonlyArray<KpiDayDu> }) {
  return (
    <div className="grid grid-cols-[minmax(150px,32%)_1fr_150px] items-center gap-[14px]">
      {kpis.map((k) => {
        const nhan = (
          <div className="text-[13px] leading-[1.3] text-body">
            {k.name}
            <small className="block text-[11px] text-faint">
              {k.code} · mục tiêu ≥ {k.t}%
            </small>
          </div>
        )
        const vung = (
          <>
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${pos(k.t)}%`,
                background: 'color-mix(in srgb, var(--bd-chua-dat) 13%, transparent)',
              }}
            />
            {k.v != null && (
              <div
                className="absolute left-0 top-2 h-2.5 rounded-r"
                style={{ width: `${pos(k.v)}%`, background: k.met ? 'var(--bd-1)' : 'var(--bd-chua-dat)' }}
              />
            )}
            <div
              className="absolute inset-y-[3px] -ml-[1.5px] w-[3px] rounded-sm bg-ink"
              style={{ left: `${pos(k.t)}%` }}
            />
          </>
        )
        const lop = 'relative h-[26px] overflow-hidden rounded-[5px] bg-bd-ray'

        if (k.v == null) {
          return (
            <div key={k.code} className="contents">
              {nhan}
              <div className={lop}>{vung}</div>
              <div className="whitespace-nowrap text-right text-[13px]">
                <NhanDanhGia loai="na" coIcon>
                  Chưa có dữ liệu
                </NhanDanhGia>
              </div>
            </div>
          )
        }
        const gap = k.v - k.t
        return (
          <div key={k.code} className="contents">
            {nhan}
            <div
              className={lop}
              {...goiY({
                tieuDe: `${k.code} · ${k.name}`,
                than: (
                  <>
                    Hiện trạng {soCoDinh(k.v, 2)}% · Mục tiêu ≥ {k.t}%
                    <br />
                    Chênh lệch {gap >= 0 ? '+' : ''}
                    {soCoDinh(gap, 2)} điểm %
                  </>
                ),
              })}
            >
              {vung}
            </div>
            <div className="tnum whitespace-nowrap text-right text-[13px]">
              <b className="text-[15px] text-ink">{soCoDinh(k.v, k.v % 1 ? 2 : 0)}%</b>{' '}
              <span className={k.met ? 'text-bd-dat-chu' : 'text-bd-chua-dat'}>
                {gap >= 0 ? '+' : ''}
                {soCoDinh(gap, 1)}
              </span>
            </div>
          </div>
        )
      })}
      <div />
      <div className="-mt-2 flex justify-between text-[11px] text-faint">
        {[70, 75, 80, 85, 90, 95, 100].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <div />
    </div>
  )
}
