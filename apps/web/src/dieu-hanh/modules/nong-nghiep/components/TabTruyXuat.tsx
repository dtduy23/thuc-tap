import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { MaQr } from '@/dieu-hanh/components/ui/MaQr'
import { Timeline } from '@/dieu-hanh/components/ui/Timeline'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import type { VungTrong } from '@/dieu-hanh/mocks/types'
import {
  CO_CAU_CAY,
  DIEN_TICH_VUNG,
  DRILL_QUET_QR,
  KY_6_THANG,
  QUET_QR_6_THANG,
  THE_TRUY_XUAT,
  TONG_DIEN_TICH,
} from '../du-lieu'
import { BangVungTrong } from './BangVungTrong'

interface Props {
  moDrill: (ct: ChiTieuDrill) => void
  vung: ReadonlyArray<[string, VungTrong]>
  dangChon: string
  chon: (id: string) => void
  /** Số thẻ "MÃ VÙNG TRỒNG" — tăng khi cấp mã mới, bản gốc cập nhật #stVt. */
  soMaVung: number
}

/** Tab 0 — "Truy xuất nguồn gốc". */
export function TabTruyXuat({ moDrill, vung, dangChon, chon, soMaVung }: Props) {
  const v = vung.find(([id]) => id === dangChon)?.[1] ?? vung[0]![1]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THE_TRUY_XUAT.map((t, i) => (
          <KpiCard
            key={t.nhan}
            nhan={t.nhan}
            giaTri={i === 0 ? String(soMaVung) : t.giaTri}
            phu={t.phu}
            mauSo={t.mau}
            onClick={() => moDrill(t.drill)}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard tieuDe="Diện tích theo vùng trồng (ha)">
          <Bar items={DIEN_TICH_VUNG} h={176} />
        </SectionCard>

        <SectionCard tieuDe="Lượt quét QR 6 tháng" onClick={() => moDrill(DRILL_QUET_QR)}>
          <Line vals={QUET_QR_6_THANG} labels={KY_6_THANG} h={176} color="#12A150" />
        </SectionCard>

        <SectionCard tieuDe="Cơ cấu nhóm cây (ha)">
          <div className="flex items-center gap-3">
            <Donut items={CO_CAU_CAY} size={142} thick={24} center={TONG_DIEN_TICH} />
            <div className="flex-1">
              <DonutLegend items={CO_CAU_CAY} />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <SectionCard tieuDe="Vùng trồng · bấm để xem QR & nhật ký" khongDem>
          <BangVungTrong vung={vung} dangChon={dangChon} chon={chon} />
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard tieuDe={`Mã QR truy xuất · ${dangChon}`}>
            <MaQr hat={v.seed} nhanDong={`Mã QR truy xuất vùng trồng ${dangChon}`} />
            <div className="mt-2.5 text-center">
              <b className="text-[0.8rem] text-ink">{v.sp}</b>
              <div className="text-[0.7rem] text-faint">
                foxai.vn/txng/{dangChon} · {v.quet} lượt quét
              </div>
            </div>
            <NutPhu
              onPress={() => toast('Đã tải mã QR in tem/bảng vùng trồng')}
              className="mt-2.5 w-full justify-center"
            >
              Tải QR in tem
            </NutPhu>
          </SectionCard>

          <SectionCard tieuDe="Nhật ký canh tác gần nhất">
            <Timeline
              moc={v.logs.map((l) => ({
                tieuDe: l[1],
                phu: `${l[0]}/2026 · hộ SX ghi qua Mobile App`,
                xong: true,
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </>
  )
}
