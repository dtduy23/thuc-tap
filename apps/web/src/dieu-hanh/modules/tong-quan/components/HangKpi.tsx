import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { Trend } from '@/dieu-hanh/components/metrics/Trend'
import { MINI } from '@/dieu-hanh/components/ui/icons'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

interface Props {
  di: (moduleId: string) => void
  moDrill: (ct: ChiTieuDrill) => void
}

/** Hàng 5 thẻ KPI đầu màn — thứ tự và câu chữ giữ nguyên bản gốc. */
export function HangKpi({ di, moDrill }: Props) {
  return (
    <div className="mb-[18px] grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      <KpiCard
        nhan="TTHC TIẾP NHẬN"
        giaTri={42}
        dem
        mauSo="var(--brand)"
        icon={MINI.doc}
        iconNen="var(--tint-brand)"
        iconMau="var(--brand)"
        phu={
          <>
            <Trend d={9} /> so tuần trước
          </>
        }
        onClick={() => di('ho-so-tthc')}
      />
      <KpiCard
        nhan="ĐÃ GIẢI QUYẾT"
        giaTri={32}
        dem
        mauSo="var(--ok)"
        icon={MINI.check}
        iconNen="var(--tint-ok)"
        iconMau="var(--ok)"
        phu={
          <>
            <Trend d={12} /> · đúng hạn 96%
          </>
        }
        onClick={() =>
          moDrill({
            ten: 'TTHC giải quyết đúng hạn',
            val: 96,
            sub: '% · 176/182 hồ sơ',
            pct: 96,
            mod: 'tthc',
            dv: 'Văn phòng - Một cửa',
          })
        }
      />
      <KpiCard
        nhan="ĐANG XỬ LÝ"
        giaTri={14}
        dem
        mauSo="var(--warn)"
        icon={MINI.clock}
        iconNen="var(--tint-warn)"
        iconMau="var(--warn)"
        phu={
          <>
            <Trend d={-11} /> trong hạn
          </>
        }
        onClick={() => di('ho-so-tthc')}
      />
      <KpiCard
        nhan="QUÁ HẠN"
        giaTri={7}
        dem
        mauSo="var(--gdos-danger)"
        icon={MINI.warn}
        iconNen="var(--tint-danger)"
        iconMau="var(--gdos-danger)"
        phu={
          <>
            <Trend d={0} /> cần xử lý ngay
          </>
        }
        onClick={() => di('ho-so-tthc')}
      />
      <KpiCard
        nhan="DÂN SỐ"
        giaTri="55.010"
        mauSo="var(--gdos-accent)"
        icon={MINI.people}
        iconNen="var(--tint-accent)"
        iconMau="var(--gdos-accent)"
        phu={
          <>
            <Trend d={1.1} /> · 14.480 hộ
          </>
        }
        onClick={() =>
          moDrill({
            ten: 'Dân số thường trú',
            val: 55010,
            sub: 'người · 14.480 hộ dân',
            pct: 100,
            mod: 'gdyt',
            dv: 'Công an + Hộ tịch',
          })
        }
      />
    </div>
  )
}
