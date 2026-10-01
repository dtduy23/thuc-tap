import { useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { D } from '@/dieu-hanh/mocks/data'
import type { PhanAnh } from '@/dieu-hanh/mocks/types'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { AiBox } from '@/dieu-hanh/components/ai/AiBlock'
import { Donut, DonutLegend } from '@/dieu-hanh/components/charts/Donut'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { Line } from '@/dieu-hanh/components/charts/Line'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { THANG, THEO_LINH_VUC, TRANG_THAI_XU_LY, XU_HUONG } from './du-lieu'
import { BangPhanAnh } from './components/BangPhanAnh'
import { ChiTietPhanAnh } from './components/ChiTietPhanAnh'

/** Màn Phản ánh kiến nghị — port từ `V.phananh` + `openPa()` + `giaiQuyetPa()`. */
export default function PhanAnhKienNghi() {
  const [danhSach, setDanhSach] = useState<ReadonlyArray<PhanAnh>>(D.phananh)
  const [maDangXem, setMaDangXem] = useState<string | null>(null)
  const [chiTieu, setChiTieu] = useState<ChiTieuDrill | null>(null)
  const chiTietState = useOverlayState()
  const drill = useDrill()

  const dangXem = danhSach.find((p) => p.id === maDangXem) ?? null

  const moChiTiet = (id: string) => {
    setMaDangXem(id)
    chiTietState.open()
  }

  /** Port từ giaiQuyetPa(): đóng phản ánh và báo cho công dân. */
  const giaiQuyet = (id: string) => {
    setDanhSach((ds) => ds.map((p) => (p.id === id ? { ...p, st: ['Đã giải quyết', 'green'] as const } : p)))
    chiTietState.close()
    toast(`Đã đóng ${id} — kết quả + ảnh nghiệm thu gửi công dân, mời đánh giá hài lòng`)
  }

  const moDrill = (ct: ChiTieuDrill) => {
    setChiTieu(ct)
    drill.open()
  }

  const haiLong = D.chiso[5]!

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Phản ánh kiến nghị"
        tieuDe="Phản ánh kiến nghị"
        moTa="Tiếp nhận từ Mobile App công dân — bấm từng dòng để xem nội dung, ảnh đính kèm, phân công và trả lời"
        gocKey="phananh"
        mau="var(--warn)"
      />

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard
          tieuDe="Trạng thái xử lý"
          onClick={() =>
            moDrill({
              ten: 'Phản ánh phản hồi trong 3 ngày',
              val: 84,
              sub: '% · mục tiêu ≥ 90%',
              pct: 84,
              mod: 'phananh',
              dv: 'Văn phòng UBND',
            })
          }
        >
          <div className="flex flex-wrap items-center gap-3.5">
            <Donut items={TRANG_THAI_XU_LY} size={142} thick={24} center="30" />
            <div className="min-w-[150px] flex-1">
              <DonutLegend items={TRANG_THAI_XU_LY} />
            </div>
          </div>
        </SectionCard>

        <SectionCard tieuDe="Theo lĩnh vực · 30 ngày">
          <Bar items={THEO_LINH_VUC} h={176} />
        </SectionCard>

        <SectionCard tieuDe="Xu hướng 6 tháng">
          <Line vals={XU_HUONG} labels={THANG} h={176} color="#D97E06" />
        </SectionCard>

        <SectionCard
          tieuDe="Hài lòng của người dân"
          onClick={() =>
            moDrill({
              ten: haiLong[0],
              val: haiLong[1],
              sub: `% · mục tiêu ${haiLong[2]}`,
              pct: haiLong[1],
              mod: haiLong[4],
              dv: haiLong[5],
            })
          }
        >
          <div className="grid place-items-center">
            <Gauge val={93} sub="khảo sát sau xử lý · MT ≥ 90%" color="#12A150" />
          </div>
        </SectionCard>
      </div>

      <SectionCard khongDem>
        <BangPhanAnh danhSach={danhSach} moChiTiet={moChiTiet} />
      </SectionCard>

      <div className="mt-3.5">
        <AiBox>
          <b>✦ AI nhận định:</b> Phản ánh về hạ tầng chiếm 42% trong 30 ngày — tập trung tại Tổ 9 và tuyến vào
          KCN. Đề xuất đưa hạng mục chiếu sáng Tổ 9 vào kế hoạch chi thường xuyên tháng 5.
        </AiBox>
      </div>

      <ChiTietPhanAnh phanAnh={dangXem} state={chiTietState} giaiQuyet={giaiQuyet} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
