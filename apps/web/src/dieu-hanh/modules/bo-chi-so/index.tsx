import { useState } from 'react'
import { PageHeader } from '@/dieu-hanh/components/layout/PageHeader'
import { DrillModal, useDrill, type ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { D } from '@/dieu-hanh/mocks/data'
import { HangTongHop } from './components/HangTongHop'
import { TheKpi } from './components/TheKpi'

/** Màn Bộ chỉ số điều hành — port từ `V.chiso`. */
export default function BoChiSo() {
  const drill = useDrill()
  const [chiTieu, setChiTieu] = useState<ChiTieuDrill | null>(null)

  const moDrill = (ct: ChiTieuDrill) => {
    setChiTieu(ct)
    drill.open()
  }

  /** drillKpi() của bản gốc: val và pct đều lấy c[1], sub ghép '% · mục tiêu '. */
  const moKpi = (i: number) => {
    const c = D.chiso[i]!
    moDrill({ ten: c[0], val: c[1], sub: `% · mục tiêu ${c[2]}`, pct: c[1], mod: c[4], dv: c[5] })
  }

  return (
    <>
      <PageHeader
        crumb="Trang chủ · Bộ chỉ số điều hành"
        tieuDe="Bộ chỉ số điều hành (KPI)"
        moTa="KPI chỉ đạo từ cấp trên — bấm từng thẻ để xem diễn biến 6 kỳ và điều hướng phân hệ nguồn"
        gocKey="chiso"
        mau="#0E9488"
      />

      <HangTongHop moDrill={moDrill} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {D.chiso.map((c, i) => (
          <TheKpi key={c[0]} chiSo={c} onPress={() => moKpi(i)} />
        ))}
      </div>

      <DrillModal chiTieu={chiTieu} state={drill} />
    </>
  )
}
