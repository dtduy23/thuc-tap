import { D } from '@/dieu-hanh/mocks/data'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { HBar } from '@/dieu-hanh/components/charts/HBar'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { BAY_NGAY, CO_CAU, THANG, THEO_NHOM, XU_HUONG_6_THANG } from '../du-lieu'

/** Chuyển một dòng của `D.chiso` thành tham số modal drill. */
const tuChiSo = (i: number): ChiTieuDrill => {
  const c = D.chiso[i]!
  return { ten: c[0], val: c[1], sub: `% · mục tiêu ${c[2]}`, pct: c[1], mod: c[4], dv: c[5] }
}

export function HangBieuDo({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  return (
    <>
      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          tieuDe="Cơ cấu theo trạng thái"
          onClick={() =>
            moDrill({
              ten: 'TTHC giải quyết đúng hạn',
              val: 92,
              sub: '% · 118/128 hồ sơ tháng này',
              pct: 92,
              mod: 'tthc',
              dv: 'Văn phòng - Một cửa',
            })
          }
        >
          <div className="flex flex-wrap items-center gap-3.5">
            <Donut items={CO_CAU} size={142} thick={24} center="119" />
            <div className="min-w-[150px] flex-1">
              <DonutLegend items={CO_CAU} />
            </div>
          </div>
        </SectionCard>

        <SectionCard tieuDe="Tiếp nhận 7 ngày gần nhất">
          <Bar items={BAY_NGAY} h={176} />
        </SectionCard>

        <SectionCard
          tieuDe="Xu hướng 6 tháng"
          onClick={() =>
            moDrill({
              ten: 'Hồ sơ TTHC tiếp nhận theo tháng',
              val: 182,
              sub: 'hồ sơ · tháng 4',
              pct: 96,
              mod: 'tthc',
              dv: 'Văn phòng - Một cửa',
            })
          }
        >
          <Line vals={XU_HUONG_6_THANG} labels={THANG} h={176} />
        </SectionCard>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr]">
        <SectionCard tieuDe="Hồ sơ theo nhóm thủ tục · tháng 4">
          <HBar items={THEO_NHOM} labW={98} />
        </SectionCard>

        <SectionCard tieuDe="Số hóa kết quả" onClick={() => moDrill(tuChiSo(4))}>
          <div className="grid place-items-center">
            <Gauge val={91} sub="mục tiêu ≥ 95% · cần đẩy" color="#D97E06" />
          </div>
        </SectionCard>

        <SectionCard tieuDe="DVC toàn trình" onClick={() => moDrill(tuChiSo(1))}>
          <div className="grid place-items-center">
            <Gauge val={67} sub="mục tiêu ≥ 80% · cần đẩy" color="#D97E06" />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
