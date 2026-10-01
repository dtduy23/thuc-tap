import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { ProgressMetric } from '@/dieu-hanh/components/metrics/ProgressMetric'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { LICH_TUOI, TRAM_NUOC } from '../du-lieu'

/** Tab 2 — "Thủy lợi". */
export function TabThuyLoi({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  return (
    <>
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {TRAM_NUOC.map((s) => {
          const mau = s.mau === 'red' ? 'var(--gdos-danger)' : 'var(--teal)'
          return (
            <SectionCard
              key={s.ten}
              onClick={() =>
                moDrill({
                  ten: `Mực nước ${s.ten}`,
                  val: s.pct,
                  sub: '% dung tích / BĐ1',
                  pct: s.pct,
                  mod: 'nongnghiep',
                  dv: 'Thủy nông + Đô thị',
                })
              }
            >
              <b className="text-[0.82rem] text-ink">{s.ten}</b>
              <div className="tnum my-1 text-[2rem] font-extrabold" style={{ color: mau }}>
                {s.pct}% <span className="text-[0.68rem] font-normal text-faint">dung tích / BĐ1</span>
              </div>
              <ProgressMetric pct={s.pct} mau={mau} />
              <div className="mt-2.5">
                <StatusChip trangThai={[s.nhan, s.mau]} />
              </div>
            </SectionCard>
          )
        })}
      </div>

      <SectionCard
        tieuDe="Lịch vận hành tưới tiêu tuần này"
        phu={
          <NutPhu onPress={() => toast('Đã gửi lịch bơm điều chỉnh tới 2 trạm + thông báo Zalo nông dân')}>
            Duyệt lịch điều chỉnh
          </NutPhu>
        }
        khongDem
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {['Thời gian', 'Nội dung', 'Trạng thái'].map((c) => (
                <th
                  key={c}
                  className="whitespace-nowrap bg-row-head px-3.5 py-[11px] text-[0.62rem] font-bold tracking-[0.1em] text-faint first:rounded-l-lg last:rounded-r-lg"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LICH_TUOI.map(([gio, noiDung, st]) => (
              <tr key={gio} className="border-b border-line-2 last:border-0">
                <td className="tnum whitespace-nowrap px-3.5 py-3 text-[0.8rem]">
                  <b className="text-ink">{gio}</b>
                </td>
                <td className="px-3.5 py-3 text-[0.8rem] text-body">{noiDung}</td>
                <td className="px-3.5 py-3">
                  <StatusChip trangThai={st} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  )
}
