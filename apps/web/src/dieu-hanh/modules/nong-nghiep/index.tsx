import { useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { Tabs } from '@/dieu-hanh/components/ui/Tabs'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { toast } from '@/dieu-hanh/store/toast'
import { D } from '@/dieu-hanh/mocks/data'
import type { VungTrong } from '@/dieu-hanh/mocks/types'
import { ModalCapMa } from './components/ModalCapMa'
import { TabThoiTiet } from './components/TabThoiTiet'
import { TabThuyLoi } from './components/TabThuyLoi'
import { TabTruyXuat } from './components/TabTruyXuat'
import { THE_TRUY_XUAT } from './du-lieu'

/** Số thứ tự mã vùng trồng kế tiếp — bản gốc khởi tạo vtSeq = 13. */
const VT_SEQ_DAU = 13

/** Màn Nông nghiệp số — port từ `V.nongnghiep`. */
export default function NongNghiep() {
  const [tab, datTab] = useState(0)
  const drill = useDrill()
  const [chiTieu, datChiTieu] = useState<ChiTieuDrill | null>(null)
  const capMa = useOverlayState()

  // Vùng trồng giữ trong state vì bản gốc cho cấp thêm mã mới lúc chạy
  const [vung, datVung] = useState<[string, VungTrong][]>(() => Object.entries(D.vt))
  const [dangChon, datDangChon] = useState(() => Object.keys(D.vt)[0]!)
  const [seq, datSeq] = useState(VT_SEQ_DAU)

  const moDrill = (ct: ChiTieuDrill) => {
    datChiTieu(ct)
    drill.open()
  }

  /** Port saveVt() — chèn vùng mới lên đầu bảng, tăng thẻ số, chọn luôn vùng đó. */
  const luuVung = (v: VungTrong) => {
    const id = `VT-${String(seq).padStart(3, '0')}`
    datSeq(seq + 1)
    datVung([[id, v], ...vung])
    datDangChon(id)
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Nông nghiệp số"
        tieuDe="Nông nghiệp số"
        moTa="Bấm từng vùng trồng để xem mã QR & nhật ký canh tác — thời tiết, sâu bệnh, thủy lợi cảnh báo qua Zalo/App"
        gocKey="nongnghiep"
        mau="#12A150"
        hanhDong={
          <div className="flex flex-wrap gap-2">
            <NutPhu onPress={() => capMa.open()}>+ Cấp mã vùng trồng</NutPhu>
            <NutChinh onPress={() => toast('Đã gửi bản tin nông vụ tới 1.860 hộ qua Zalo — 06:30')}>
              Gửi bản tin Zalo
            </NutChinh>
          </div>
        }
      />

      <Tabs
        nhanDong="Phân hệ nông nghiệp số"
        dangMo={tab}
        doiTab={datTab}
        muc={[
          {
            nhan: 'Truy xuất nguồn gốc',
            noiDung: (
              <TabTruyXuat
                moDrill={moDrill}
                vung={vung}
                dangChon={dangChon}
                chon={datDangChon}
                soMaVung={Number(THE_TRUY_XUAT[0]!.giaTri) + (seq - VT_SEQ_DAU)}
              />
            ),
          },
          { nhan: 'Thời tiết & Sâu bệnh', noiDung: <TabThoiTiet /> },
          { nhan: 'Thủy lợi', noiDung: <TabThuyLoi moDrill={moDrill} /> },
        ]}
      />

      <ModalCapMa state={capMa} luu={luuVung} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
