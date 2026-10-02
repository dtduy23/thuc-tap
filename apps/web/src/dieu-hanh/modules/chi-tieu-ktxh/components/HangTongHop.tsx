import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { HBar } from '@/dieu-hanh/components/charts/HBar'
import { AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { CHAM_NHAT, DRILL_PHAN_LOAI, MUC_DAT_THEO_NHOM, PHAN_LOAI, TONG_CHI_TIEU } from '../du-lieu'

/** Hàng 3 thẻ tổng hợp đầu trang — port nguyên khối grid 3 cột của bản gốc. */
export function HangTongHop({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-3">
      <SectionCard
        tieuDe={`Phân loại ${TONG_CHI_TIEU} chỉ tiêu`}
        phu={<span className="text-[0.72rem] font-semibold text-brand">Chi tiết →</span>}
        onClick={() => moDrill(DRILL_PHAN_LOAI)}
      >
        <div className="flex items-center gap-3.5">
          <Donut items={PHAN_LOAI} size={144} thick={24} center={TONG_CHI_TIEU} />
          <div className="flex-1">
            <DonutLegend items={PHAN_LOAI} />
          </div>
        </div>
      </SectionCard>

      <SectionCard tieuDe="Mức đạt kế hoạch theo nhóm (%)">
        <Bar items={MUC_DAT_THEO_NHOM} h={176} />
      </SectionCard>

      <SectionCard tieuDe="5 chỉ tiêu chậm nhất (% đạt KH)" phu={<AiChip>✦ AI xếp</AiChip>}>
        <HBar items={CHAM_NHAT} max={100} labW={122} />
      </SectionCard>
    </div>
  )
}
