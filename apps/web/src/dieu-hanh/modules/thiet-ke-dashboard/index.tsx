import { useState } from 'react'
import { useOverlayState } from '@heroui/react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { NutChinh, NutPhu } from '@/dieu-hanh/components/ui/Nut'
import { toast } from '@/dieu-hanh/store/toast'
import { BangDuLieu } from './components/BangDuLieu'
import { BangWidget } from './components/BangWidget'
import { KhungWidget } from './components/KhungWidget'
import { ModalCauHinhWidget } from './components/ModalCauHinhWidget'
import { ModalDanCsv } from './components/ModalDanCsv'
import { ModalSuaBo } from './components/ModalSuaBo'
import { TEN_DASHBOARD_MAC_DINH } from './du-lieu'
import { useDashboard } from './use-dashboard'

/** Màn Thiết kế Dashboard kéo - thả — port từ `V.dashboard`. */
export default function ThietKeDashboard() {
  const db = useDashboard()
  const [ten, datTen] = useState(TEN_DASHBOARD_MAC_DINH)

  const danCsv = useOverlayState()
  const cauHinh = useOverlayState()
  const suaBo = useOverlayState()
  const [widgetChon, datWidgetChon] = useState<number | null>(null)
  const [boChon, datBoChon] = useState(0)

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Thiết kế Dashboard"
        tieuDe="Thiết kế Dashboard kéo - thả"
        moTa="Kéo widget từ bảng bên trái thả vào khung · nhập dữ liệu Excel/CSV riêng cho từng dashboard · bấm ⚙ trên widget để chọn cột"
        gocKey="dashboard"
        mau="#C2410C"
        hanhDong={
          <div className="flex flex-wrap gap-2">
            <NutPhu onPress={db.xoaBoCuc}>Xóa bố cục</NutPhu>
            <NutChinh
              onPress={() =>
                toast(
                  `Đã lưu "${ten.trim()}" (${db.widget.length} widget · bộ dữ liệu #${db.dangDung + 1}) — phát hành cho nhóm lãnh đạo`,
                )
              }
            >
              Lưu &amp; phát hành
            </NutChinh>
          </div>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[290px_1fr]">
        <div className="grid gap-4">
          <BangWidget them={db.themWidget} />
          <BangDuLieu
            boDl={db.boDl}
            dangDung={db.dangDung}
            bo={db.bo}
            chonBo={db.chonBo}
            xoaBo={db.xoaBo}
            suaBo={(i) => {
              datBoChon(i)
              suaBo.open()
            }}
            napCsv={db.napCsv}
            napBoMau={db.napBoMau}
            moDanCsv={() => danCsv.open()}
          />
        </div>

        <SectionCard
          tieuDe={
            <input
              value={ten}
              onChange={(e) => datTen(e.target.value)}
              spellCheck={false}
              aria-label="Tên dashboard"
              title="Bấm để đổi tên dashboard"
              className="w-full min-w-0 border-0 border-b-[1.5px] border-dashed border-vien-keo bg-transparent pb-0.5 text-[0.9rem] font-bold text-ink outline-none"
            />
          }
          phu={<span className="flex-none text-[0.7rem] text-faint">bấm tên để sửa</span>}
        >
          <KhungWidget
            widget={db.widget}
            bo={db.bo}
            them={db.themWidget}
            xoa={db.xoaWidget}
            chuyen={db.chuyenWidget}
            cauHinh={(id) => {
              datWidgetChon(id)
              cauHinh.open()
            }}
          />
        </SectionCard>
      </div>

      <ModalDanCsv state={danCsv} nap={db.napCsv} />
      <ModalCauHinhWidget
        state={cauHinh}
        widget={db.widget.find((w) => w.id === widgetChon) ?? null}
        bo={db.bo}
        luu={db.luuWidget}
      />
      <ModalSuaBo state={suaBo} bo={db.boDl[boChon] ?? null} chiSo={boChon} luu={db.luuBo} />
    </>
  )
}
