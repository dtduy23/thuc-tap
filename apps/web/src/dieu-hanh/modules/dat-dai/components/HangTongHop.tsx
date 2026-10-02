import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import {
  CO_CAU_DAT,
  DRILL_HO_SO,
  HO_SO_6_THANG,
  HO_SO_THEO_LOAI,
  KY_6_THANG,
  MAU_HO_SO,
  TONG_DIEN_TICH,
} from '../du-lieu'

/** Hàng 3 thẻ đầu tab "Bản đồ địa chính". */
export function HangTongHop({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-3">
      <SectionCard tieuDe="Cơ cấu sử dụng đất (ha)">
        <div className="flex items-center gap-3.5">
          <Donut items={CO_CAU_DAT} size={142} thick={24} center={TONG_DIEN_TICH} />
          <div className="flex-1">
            <DonutLegend items={CO_CAU_DAT} />
          </div>
        </div>
      </SectionCard>

      <SectionCard tieuDe="Hồ sơ đất đai tháng này theo loại">
        <Bar items={HO_SO_THEO_LOAI} h={176} />
      </SectionCard>

      <SectionCard tieuDe="Hồ sơ đất đai 6 tháng" onClick={() => moDrill(DRILL_HO_SO)}>
        <Line vals={HO_SO_6_THANG} labels={KY_6_THANG} h={176} color={MAU_HO_SO} />
      </SectionCard>
    </div>
  )
}
