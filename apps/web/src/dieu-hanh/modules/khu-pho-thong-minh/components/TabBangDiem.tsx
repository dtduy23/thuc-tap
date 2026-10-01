import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { D } from '@/dieu-hanh/mocks/data'
import { BangChamDiem } from './BangChamDiem'
import { mauCot, PHAN_BO, THE_TONG_HOP, TONG_KHU_PHO } from '../du-lieu'

interface Props {
  moDrill: (ct: ChiTieuDrill) => void
  moChiTiet: (i: number) => void
}

/** Tab 0 — "Bảng chấm điểm". */
export function TabBangDiem({ moDrill, moChiTiet }: Props) {
  // Bản gốc: nhãn cột đổi "Khu phố " thành "KP", điểm tổng đọc từ chuỗi "93,4"
  const cot: MucChart[] = D.apscore.map((r) => [
    r[0].replace(/Khu phố /, 'KP'),
    Number.parseFloat(r[7].replace(',', '.')),
    mauCot(r[8][1]),
  ])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {THE_TONG_HOP.map((t) => (
          <KpiCard
            key={t.nhan}
            nhan={t.nhan}
            giaTri={t.giaTri}
            phu={t.phu}
            mauSo={t.mau}
            onClick={() => moDrill(t.drill)}
          />
        ))}
      </div>

      <div className="my-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard tieuDe="Tổng điểm 5 tiêu chí theo thôn/ấp — chuẩn ≥ 90">
          <Bar items={cot} h={190} />
        </SectionCard>

        <SectionCard tieuDe="Phân bố 6 khu phố đăng ký">
          <div className="flex items-center gap-3">
            <Donut items={PHAN_BO} size={142} thick={24} center={TONG_KHU_PHO} />
            <div className="flex-1">
              <DonutLegend items={PHAN_BO} />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard khongDem>
        <BangChamDiem moChiTiet={moChiTiet} />
      </SectionCard>

      <div className="mt-2.5 text-[0.74rem] text-chu-phu">
        Điểm cập nhật tự động từ dữ liệu GDOS: DVC trực tuyến, thanh toán số, camera ANTT, HSSK điện tử, phản
        ánh trực tuyến… Ngưỡng cấu hình theo Quyết định của UBND tỉnh/TP.
      </div>
    </>
  )
}
