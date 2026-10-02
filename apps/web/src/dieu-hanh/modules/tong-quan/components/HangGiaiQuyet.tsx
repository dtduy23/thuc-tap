import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Line2 } from '@/dieu-hanh/components/charts/Line2'
import { LegendChips } from '@/dieu-hanh/components/charts/LegendChips'
import { DanhSachChiSo } from '@/dieu-hanh/components/metrics/DanhSachChiSo'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { NGAY, PHAN_ANH_HIEN_TRUONG, TTHC_DA_GIAI_QUYET, TTHC_TIEP_NHAN, TY_LE_TTHC } from '../du-lieu'

interface Props {
  di: (moduleId: string) => void
  moDrill: (ct: ChiTieuDrill) => void
}

export function HangGiaiQuyet({ di, moDrill }: Props) {
  return (
    <div className="mb-4 grid gap-4 xl:grid-cols-[1.5fr_1.1fr_1fr]">
      <SectionCard
        tieuDe="Tình hình giải quyết thủ tục hành chính"
        phu={
          <LegendChips
            items={[
              { name: 'Tiếp nhận', c: '#1B66E0' },
              { name: 'Đã giải quyết', c: '#12A150' },
            ]}
          />
        }
      >
        <Line2
          series={[
            { name: 'Tiếp nhận', c: '#1B66E0', vals: TTHC_TIEP_NHAN },
            { name: 'Đã giải quyết', c: '#12A150', vals: TTHC_DA_GIAI_QUYET },
          ]}
          labels={NGAY}
          h={208}
        />
      </SectionCard>

      <SectionCard
        tieuDe="Tỷ lệ giải quyết TTHC"
        onClick={() =>
          moDrill({
            ten: 'TTHC giải quyết đúng hạn',
            val: 96.6,
            sub: '% hồ sơ toàn kỳ',
            pct: 96,
            mod: 'tthc',
            dv: 'Văn phòng - Một cửa',
          })
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <Donut items={TY_LE_TTHC} size={164} thick={27} center="96,6%" />
          <div className="min-w-[180px] flex-1">
            <DonutLegend items={TY_LE_TTHC} />
            <div className="mt-1.5 text-[0.68rem] text-faint">Lũy kế từ đầu năm · nguồn Một cửa</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        tieuDe="Phản ánh hiện trường"
        phu={
          <button
            type="button"
            onClick={() => di('phan-anh')}
            className="text-[0.72rem] font-semibold text-brand"
          >
            Xem tất cả →
          </button>
        }
      >
        <DanhSachChiSo dong={PHAN_ANH_HIEN_TRUONG} />
      </SectionCard>
    </div>
  )
}
