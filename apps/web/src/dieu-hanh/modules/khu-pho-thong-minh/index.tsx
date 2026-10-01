import { useState } from 'react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { Tabs } from '@/dieu-hanh/components/ui/Tabs'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import { TabBangDiem } from './components/TabBangDiem'
import { TabChiTiet } from './components/TabChiTiet'

/** Port từ exportAp() — dùng cho cả nút đầu trang và nút trong tab chi tiết. */
const xuatHoSo = (ten?: string) =>
  toast(
    `Đang tổng hợp minh chứng 5 tiêu chí${ten ? ` của ${ten}` : ''}… Đã xuất bộ hồ sơ đề nghị công nhận (PDF) — demo`,
  )

/** Màn Khu phố thông minh — port từ `V.apthongminh`. */
export default function KhuPhoThongMinh() {
  const [tab, datTab] = useState(0)
  const drill = useDrill()
  const [chiTieu, datChiTieu] = useState<ChiTieuDrill | null>(null)
  // Bản gốc initView('apthongminh') gọi openApDetail(3, true) — dựng sẵn tab
  // chi tiết cho khu phố thứ tư, nhãn tab lấy theo tên khu phố đó
  const [khuPho, datKhuPho] = useState(3)

  const moDrill = (ct: ChiTieuDrill) => {
    datChiTieu(ct)
    drill.open()
  }

  /** Bấm một dòng trong bảng → chuyển sang tab chi tiết của khu phố đó. */
  const moChiTiet = (i: number) => {
    datKhuPho(i)
    datTab(1)
  }

  const r = D.apscore[khuPho]!

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Khu phố thông minh"
        tieuDe="Khu phố thông minh phường Bình Minh — 5 tiêu chí UBND tỉnh"
        moTa="Bấm từng thôn/ấp trong bảng để xem chi tiết chấm điểm, minh chứng và việc cần hoàn thiện"
        gocKey="apthongminh"
        mau="#0E9488"
        hanhDong={<NutChinh onPress={() => xuatHoSo()}>Xuất hồ sơ công nhận</NutChinh>}
      />

      <Tabs
        nhanDong="Chế độ xem khu phố thông minh"
        dangMo={tab}
        doiTab={datTab}
        muc={[
          {
            nhan: 'Bảng chấm điểm',
            noiDung: <TabBangDiem moDrill={moDrill} moChiTiet={moChiTiet} />,
          },
          {
            nhan: `Chi tiết · ${r[0]}`,
            noiDung: <TabChiTiet khuPho={r} moDrill={moDrill} xuatHoSo={xuatHoSo} />,
          },
        ]}
      />

      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
