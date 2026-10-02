import { D } from '@/dieu-hanh/mocks/data'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Line2 } from '@/dieu-hanh/components/charts/Line2'
import { LegendChips } from '@/dieu-hanh/components/charts/LegendChips'
import { Trend } from '@/dieu-hanh/components/metrics/Trend'
import { MapPanel } from '@/dieu-hanh/components/map/MapPanel'
import { CHI_NGAN_SACH, DAN_CU, THANG, THU_NGAN_SACH } from '../du-lieu'

export function HangDiaBan({ di }: { di: (moduleId: string) => void }) {
  return (
    <div className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_1.2fr_1fr]">
      <SectionCard
        tieuDe="Kinh tế - Xã hội"
        phu={<span className="text-[0.7rem] text-faint">Thu - Chi ngân sách 6 tháng</span>}
      >
        <div className="mb-1">
          <LegendChips
            items={[
              { name: 'Thu NS (tỷ)', c: '#1B66E0' },
              { name: 'Chi NS (tỷ)', c: '#D97E06' },
            ]}
          />
        </div>
        <Line2
          series={[
            { name: 'Thu', c: '#1B66E0', vals: THU_NGAN_SACH },
            { name: 'Chi', c: '#D97E06', vals: CHI_NGAN_SACH },
          ]}
          labels={THANG}
          h={168}
        />
        <button
          type="button"
          onClick={() => di('chi-tieu-ktxh')}
          className="mt-[7px] text-left text-[0.7rem] text-chu-phu"
        >
          Lũy kế thu <b className="text-ink">43,5 tỷ</b> (74% KH) · Hộ KD mới <b className="text-ink">748</b>{' '}
          <Trend d={5} /> · Cây ăn quả <b className="text-ink">150 ha</b> <Trend d={2} /> — mở chi tiết →
        </button>
      </SectionCard>

      <SectionCard
        tieuDe="Cơ cấu dân cư"
        phu={<span className="text-[0.7rem] text-faint">Tổng: 55.010 người</span>}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Donut items={DAN_CU} size={158} thick={26} center="55.010" />
          <div className="min-w-[180px] flex-1">
            <DonutLegend items={DAN_CU} />
            <div className="mt-[7px] border-t border-divider-soft pt-[7px] text-[0.72rem] text-chu-phu">
              Nam <b className="text-ink">27.104</b> (49,3%) · Nữ <b className="text-ink">27.906</b> (50,7%)
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        tieuDe="Bản đồ số phường Mẫu"
        phu={
          <button
            type="button"
            onClick={() => di('dat-dai')}
            className="text-[0.72rem] font-semibold text-brand"
          >
            Mở GIS đầy đủ →
          </button>
        }
      >
        <MapPanel diTich={D.dt} chieuCao={190} />
        <div className="mt-1.5 text-[0.66rem] text-faint">
          Nền OpenStreetMap · ranh giới + ghim di tích — kéo/zoom, bấm ghim mở hồ sơ
        </div>
      </SectionCard>
    </div>
  )
}
