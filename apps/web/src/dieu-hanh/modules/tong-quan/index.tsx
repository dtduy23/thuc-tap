import { useState } from 'react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { useDieuHuong } from '@/dieu-hanh/hooks/use-dieu-huong'
import { Hero } from './components/Hero'
import { HangKpi } from './components/HangKpi'
import { HangGiaiQuyet } from './components/HangGiaiQuyet'
import { HangDiaBan } from './components/HangDiaBan'
import { HangChuyenNganh } from './components/HangChuyenNganh'
import { CotUuTien } from './components/CotUuTien'
import { CotBenPhai } from './components/CotBenPhai'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'

/** Màn Tổng quan — port từ `V.tongquan`. File này chỉ lắp ghép, nội dung nằm ở components/. */
export default function TongQuan() {
  const di = useDieuHuong()
  const drill = useDrill()
  const [chiTieu, setChiTieu] = useState<ChiTieuDrill | null>(null)

  const moDrill = (ct: ChiTieuDrill) => {
    setChiTieu(ct)
    drill.open()
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Tổng quan"
        tieuDe="Tổng quan điều hành"
        moTa="Một màn hình duy nhất — KPI, ưu tiên hôm nay, cảnh báo quá hạn, cập nhật realtime"
        gocKey="tongquan"
        mau="var(--brand)"
        hanhDong={<NutChinh onPress={() => di('ai-bao-cao')}>✦ AI tạo báo cáo</NutChinh>}
      />

      <Hero />
      <HangKpi di={di} moDrill={moDrill} />
      <HangGiaiQuyet di={di} moDrill={moDrill} />
      <HangDiaBan di={di} />
      <HangChuyenNganh di={di} />

      {/* Hàng cuối: cột trái rộng + cột phải 340px (.cols của bản gốc) */}
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <CotUuTien di={di} moDrill={moDrill} />
        <CotBenPhai di={di} />
      </div>

      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
