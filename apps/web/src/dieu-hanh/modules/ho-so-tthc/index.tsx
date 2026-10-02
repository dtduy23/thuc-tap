import { useState } from 'react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { FilterBar } from '@/dieu-hanh/components/ui/FilterBar'
import { NutChinh } from '@/dieu-hanh/components/ui/Nut'
import { toast } from '@/dieu-hanh/store/toast'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { HangKpi } from './components/HangKpi'
import { HangBieuDo } from './components/HangBieuDo'
import { BangHoSo } from './components/BangHoSo'
import { ChiTietHoSo } from './components/ChiTietHoSo'
import { useHoSo } from './use-ho-so'

/** Màn Hồ sơ TTHC — port từ `V.tthc`. File này chỉ lắp ghép. */
export default function HoSoTthc() {
  const { loc, setLoc, hoSoLoc, dangXem, chiTietState, moChiTiet, pheDuyet } = useHoSo()
  const drill = useDrill()
  const [chiTieu, setChiTieu] = useState<ChiTieuDrill | null>(null)

  const moDrill = (ct: ChiTieuDrill) => {
    setChiTieu(ct)
    drill.open()
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Hồ sơ TTHC"
        tieuDe="Hồ sơ Thủ tục Hành chính"
        moTa="Vòng đời hồ sơ từ tiếp nhận đến trả kết quả — tích hợp Một cửa, DVC Quốc gia & DVC tỉnh/TP"
        gocKey="tthc"
        mau="var(--brand)"
        hanhDong={
          <NutChinh onPress={() => toast('Mở biểu mẫu tiếp nhận hồ sơ (demo)')}>+ Tiếp nhận mới</NutChinh>
        }
      />

      <HangKpi moDrill={moDrill} />
      <HangBieuDo moDrill={moDrill} />

      <SectionCard
        tieuDe="Danh sách hồ sơ"
        phu={
          <FilterBar
            giaTri={loc}
            doiGiaTri={setLoc}
            goiY="Lọc theo tên, mã, loại thủ tục…"
            nhan="Lọc danh sách hồ sơ"
          />
        }
        khongDem
      >
        <BangHoSo hoSo={hoSoLoc} moChiTiet={moChiTiet} />
      </SectionCard>

      <ChiTietHoSo hoSo={dangXem} state={chiTietState} pheDuyet={pheDuyet} />
      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
