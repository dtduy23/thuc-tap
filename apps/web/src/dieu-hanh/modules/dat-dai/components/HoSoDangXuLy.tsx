import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { HO_SO_DANG_XU_LY } from '../du-lieu'

/** Danh sách "Hồ sơ đất đai đang xử lý" — bấm một dòng thì định vị thửa. */
export function HoSoDangXuLy({ dinhVi }: { dinhVi: (id: string) => void }) {
  return (
    <SectionCard tieuDe="Hồ sơ đất đai đang xử lý">
      <div className="pt-0.5">
        {HO_SO_DANG_XU_LY.map((h) => (
          <button
            key={h.ma}
            type="button"
            onClick={() => dinhVi(h.thua)}
            className="flex w-full items-center gap-3 border-b border-line-2 py-2.5 text-left last:border-0 hover:bg-row-hover"
          >
            <div className="min-w-0 flex-1">
              <b className="text-[0.78rem] text-ink">{h.ma}</b>
              <small className="block text-[0.7rem] text-faint">{h.moTa} — bấm để định vị</small>
            </div>
            <StatusChip trangThai={[h.nhan, h.mau]} />
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
