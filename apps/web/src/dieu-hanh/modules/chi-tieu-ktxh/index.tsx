import { useState } from 'react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import { HangTongHop } from './components/HangTongHop'
import { TheNhom } from './components/TheNhom'

/** Màn Chỉ tiêu Kinh tế - Xã hội — port từ `V.ktxh`. */
export default function ChiTieuKtxh() {
  const drill = useDrill()
  const [chiTieu, setChiTieu] = useState<ChiTieuDrill | null>(null)

  const moDrill = (ct: ChiTieuDrill) => {
    setChiTieu(ct)
    drill.open()
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Chỉ tiêu Kinh tế - Xã hội"
        tieuDe="Chỉ tiêu Kinh tế - Xã hội"
        moTa="84 chỉ tiêu cấp phường — bấm từng chỉ tiêu để xem diễn biến, nguồn dữ liệu và điều hướng phân hệ"
        gocKey="ktxh"
        mau="#1B66E0"
        hanhDong={
          <NutPhu onPress={() => toast('Đã đẩy dữ liệu lên IOC Tỉnh/TP qua trục LGSP — 15:20')}>
            ↑ Đẩy IOC Tỉnh
          </NutPhu>
        }
      />

      <HangTongHop moDrill={moDrill} />

      <div className="grid gap-4 xl:grid-cols-2">
        {D.ktxh.map((nhom, i) => (
          <TheNhom key={nhom.nhom} nhom={nhom} dungGauge={i === 0 || i === 2} moDrill={moDrill} />
        ))}
      </div>

      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
