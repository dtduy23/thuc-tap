import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { DanhSachChiSo } from '@/dieu-hanh/components/metrics/DanhSachChiSo'
import { AN_NINH_TRAT_TU, HA_TANG_DO_THI, Y_TE_GIAO_DUC } from '../du-lieu'

const SO_TUAN_TRUOC = <span className="text-[0.7rem] text-faint">so với tuần trước</span>

export function HangChuyenNganh({ di }: { di: (moduleId: string) => void }) {
  return (
    <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SectionCard tieuDe="An ninh trật tự" phu={SO_TUAN_TRUOC}>
        <DanhSachChiSo dong={AN_NINH_TRAT_TU} />
      </SectionCard>

      <SectionCard tieuDe="Hạ tầng - Đô thị" phu={SO_TUAN_TRUOC}>
        <DanhSachChiSo dong={HA_TANG_DO_THI} />
      </SectionCard>

      <SectionCard
        tieuDe="Y tế - Giáo dục"
        phu={
          <button
            type="button"
            onClick={() => di('giao-duc-y-te')}
            className="text-[0.72rem] font-semibold text-brand"
          >
            Mở →
          </button>
        }
      >
        <DanhSachChiSo dong={Y_TE_GIAO_DUC} />
      </SectionCard>
    </div>
  )
}
