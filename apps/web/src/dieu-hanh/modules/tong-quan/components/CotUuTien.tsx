import { D } from '@/dieu-hanh/mocks/data'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import { AiChip } from '@/dieu-hanh/components/ai/AiBlock'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

interface Props {
  di: (moduleId: string) => void
  moDrill: (ct: ChiTieuDrill) => void
}

/** Cột trái hàng cuối: "Ưu tiên hôm nay" + lưới 6 gauge bộ chỉ số. */
export function CotUuTien({ di, moDrill }: Props) {
  return (
    <div className="grid gap-4">
      <SectionCard tieuDe="Ưu tiên hôm nay" phu={<AiChip>✦ AI xếp hạng</AiChip>}>
        {D.tthc.slice(0, 3).map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => di('ho-so-tthc')}
            className="flex w-full items-start gap-[11px] border-b border-line-2 py-[11px] text-left last:border-b-0"
          >
            <span
              className="mt-[5px] size-[9px] flex-none rounded-full"
              style={{ background: h.st[1] === 'red' ? 'var(--gdos-danger)' : 'var(--warn)' }}
            />
            <div className="min-w-0 flex-1">
              <b className="text-[0.8rem] text-ink">{h.loai}</b>
              <small className="mt-px block text-[0.68rem] text-faint">
                {h.id} · {h.cd} · CV {h.cv}
              </small>
            </div>
            <StatusChip trangThai={h.st} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => di('phan-anh')}
          className="flex w-full items-start gap-[11px] py-[11px] text-left"
        >
          <span className="mt-[5px] size-[9px] flex-none rounded-full bg-canh-bao" />
          <div className="min-w-0 flex-1">
            <b className="text-[0.8rem] text-ink">Phản ánh ANTT khu chợ đêm</b>
            <small className="mt-px block text-[0.68rem] text-faint">
              PA-2026-027 · đang phối hợp Công an phường
            </small>
          </div>
          <StatusChip trangThai={['Nóng', 'red']} />
        </button>
      </SectionCard>

      <SectionCard
        tieuDe="Bộ chỉ số điều hành · bấm để xem chi tiết"
        phu={
          <button
            type="button"
            onClick={() => di('bo-chi-so')}
            className="text-[0.74rem] font-semibold text-brand"
          >
            Xem tất cả →
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 md:grid-cols-3">
          {D.chiso.map((c) => (
            <button
              key={c[0]}
              type="button"
              onClick={() =>
                moDrill({ ten: c[0], val: c[1], sub: `% · mục tiêu ${c[2]}`, pct: c[1], mod: c[4], dv: c[5] })
              }
              className="text-center"
            >
              <Gauge val={c[1]} color={c[3] === 'green' ? '#12A150' : '#D97E06'} />
              <div className="-mt-1.5 text-[0.66rem] leading-[1.25] text-chu-phu">{c[0]}</div>
            </button>
          ))}
        </div>
        <div className="mt-2 text-center text-[0.68rem] text-faint">
          Vòng xanh = đạt mục tiêu · cam = cần đẩy — bấm từng vòng để xem diễn biến
        </div>
      </SectionCard>
    </div>
  )
}
