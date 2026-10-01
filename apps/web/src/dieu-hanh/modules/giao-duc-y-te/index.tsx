import { useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { Tabs } from '@/dieu-hanh/components/ui/Tabs'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { useDieuHuong } from '@/dieu-hanh/hooks/use-dieu-huong'
import { D } from '@/dieu-hanh/mocks/data'
import { ChiTietTruong } from './components/ChiTietTruong'
import { TabGiaoDuc } from './components/TabGiaoDuc'
import { TabYTe } from './components/TabYTe'

/** Màn Giáo dục & Y tế — port từ `V.gdyt`. */
export default function GiaoDucYTe() {
  const di = useDieuHuong()
  const [tab, datTab] = useState(0)
  const drill = useDrill()
  const [chiTieu, datChiTieu] = useState<ChiTieuDrill | null>(null)

  const chiTietTruong = useOverlayState()
  const [truongChon, datTruongChon] = useState(0)

  const moDrill = (ct: ChiTieuDrill) => {
    datChiTieu(ct)
    drill.open()
  }

  const moTruong = (i: number) => {
    datTruongChon(i)
    chiTietTruong.open()
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Giáo dục & Y tế"
        tieuDe="Giáo dục & Y tế trên địa bàn"
        moTa="Bấm từng trường / trạm / chỉ tiêu để xem chi tiết — dữ liệu tự động vào chỉ tiêu KT-XH và báo cáo định kỳ"
        gocKey="gdyt"
        mau="#D93843"
        hanhDong={<NutChinh onPress={() => di('ai-bao-cao')}>✦ AI tạo báo cáo GD-YT</NutChinh>}
      />

      <Tabs
        nhanDong="Phân hệ giáo dục và y tế"
        dangMo={tab}
        doiTab={datTab}
        muc={[
          { nhan: 'Giáo dục', noiDung: <TabGiaoDuc moDrill={moDrill} moTruong={moTruong} /> },
          { nhan: 'Y tế', noiDung: <TabYTe moDrill={moDrill} /> },
        ]}
      />

      <ChiTietTruong state={chiTietTruong} truong={D.truong[truongChon] ?? null} chiSo={truongChon} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
