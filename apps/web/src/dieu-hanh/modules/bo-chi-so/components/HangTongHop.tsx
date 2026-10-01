import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { HBar } from '@/dieu-hanh/components/charts/HBar'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { D } from '@/dieu-hanh/mocks/data'
import { CON_THIEU, DIEM_DIEU_HANH, DRILL_DIEM, KY_DIEU_HANH, MAU_DIEM, mauKpi } from '../du-lieu'

/** Hàng 3 thẻ tổng hợp đầu trang. */
export function HangTongHop({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  // Bản gốc lấy từ đầu tên KPI làm nhãn cột: c[0].split(' ')[0]
  const cot: MucChart[] = D.chiso.map((c) => [c[0].split(' ')[0]!, c[1], mauKpi(c[3])])

  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-3">
      <SectionCard tieuDe="6 KPI hiện tại (%) — xanh đạt · cam cần đẩy">
        <Bar items={cot} h={108} />
      </SectionCard>

      <SectionCard tieuDe="Điểm điều hành 6 kỳ" onClick={() => moDrill(DRILL_DIEM)}>
        <Line vals={DIEM_DIEU_HANH} labels={KY_DIEU_HANH} h={176} color={MAU_DIEM} />
      </SectionCard>

      <SectionCard tieuDe="Còn thiếu bao nhiêu điểm % tới mục tiêu">
        <HBar items={CON_THIEU} max={15} labW={118} />
        <div className="mt-1.5 text-[0.7rem] text-chu-phu">3 KPI còn lại đã đạt / vượt mục tiêu ✓</div>
      </SectionCard>
    </div>
  )
}
