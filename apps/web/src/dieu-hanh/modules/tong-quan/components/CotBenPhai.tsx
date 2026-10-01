import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { AiBox, AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import { BAN_TIN_AI, HOAT_DONG, LIEN_THONG } from '../du-lieu'

/** Cột phải hàng cuối (340px): bản tin AI, liên thông hệ thống, hoạt động gần đây. */
export function CotBenPhai({ di }: { di: (moduleId: string) => void }) {
  return (
    <div className="grid gap-4">
      <SectionCard
        tieuDe={<AiChip>✦ Bản tin AI · 07:30</AiChip>}
        phu={
          <button
            type="button"
            onClick={() => di('ai-tro-ly')}
            className="text-[0.72rem] font-semibold text-brand"
          >
            Hỏi thêm →
          </button>
        }
      >
        <AiBox>
          {BAN_TIN_AI.map(([dam, nd]) => (
            <div key={dam}>
              • <b>{dam}</b> {nd}
            </div>
          ))}
        </AiBox>
      </SectionCard>

      <SectionCard tieuDe="Liên thông hệ thống">
        <div className="text-[0.78rem] leading-[2.1]">
          {LIEN_THONG.map(([ten, tt]) => (
            <div key={ten}>
              {ten}
              <b className="text-ok">{tt}</b>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard tieuDe="Hoạt động gần đây">
        {HOAT_DONG.map(([gio, nd]) => (
          <div
            key={gio}
            className="flex items-start gap-[11px] border-b border-line-2 py-[11px] last:border-b-0"
          >
            <small className="tnum mt-0.5 min-w-[44px] text-[0.68rem] text-faint">{gio}</small>
            <span className="text-[0.76rem]">{nd}</span>
          </div>
        ))}
      </SectionCard>
    </div>
  )
}
