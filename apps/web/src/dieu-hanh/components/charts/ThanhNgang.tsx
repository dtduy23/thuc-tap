import type { ThanhNgangXp } from '@/dieu-hanh/mocks/xa-phuong'
import { soCoDinh } from '@/dieu-hanh/lib/format'
import { goiY } from '@/dieu-hanh/components/overlay/TooltipChuot'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

interface Props {
  rows: ReadonlyArray<ThanhNgangXp>
  max?: number
  /** Có rãnh nền và bo cả hai đầu (thang %). */
  pct?: boolean
  suffix?: string
}

/** Port từ hbars() của Dashboard Xã/Phường. */
export function ThanhNgang({ rows, max, pct = false, suffix = '' }: Props) {
  const m = max ?? Math.max(...rows.map((r) => r.value))
  return (
    <div className="grid grid-cols-[minmax(110px,38%)_1fr_auto] items-center gap-x-2.5 gap-y-3">
      {rows.map((r) => {
        const w = Math.max(0, Math.min(100, (r.value / m) * 100))
        const disp = r.display ?? soCoDinh(r.value, pct && r.value % 1 ? 1 : 0) + suffix
        return (
          <div key={r.label} className="contents">
            <div className="truncate text-[13px] text-body" title={r.label}>
              {r.label}
            </div>
            <div className={`relative h-3.5 ${pct ? 'rounded bg-bd-ray' : ''}`}>
              <div
                className={`h-full min-w-[2px] hover:brightness-110 ${pct ? 'rounded' : 'rounded-r'}`}
                style={{ width: `${w}%`, background: r.color ?? 'var(--bd-1)' }}
                {...goiY({ tieuDe: r.label, than: r.nhanDat ? 'Đã đạt' : disp })}
              />
            </div>
            <div className="tnum min-w-[52px] text-right text-[13px] text-ink">
              {r.nhanDat ? <NhanDanhGia loai="ok">Đã đạt</NhanDanhGia> : disp}
            </div>
          </div>
        )
      })}
    </div>
  )
}
