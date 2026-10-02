import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'

export function HangKpi({ moDrill }: { moDrill: (ct: ChiTieuDrill) => void }) {
  return (
    <div className="mb-[18px] grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        nhan="TIẾP NHẬN HÔM NAY"
        giaTri={42}
        mauSo="var(--brand)"
        phu="hồ sơ mới"
        onClick={() =>
          moDrill({
            ten: 'Hồ sơ tiếp nhận hôm nay',
            val: 39,
            sub: 'hồ sơ · TB 34/ngày',
            pct: 96,
            mod: 'tthc',
            dv: 'Văn phòng - Một cửa',
          })
        }
      />
      <KpiCard
        nhan="ĐANG XỬ LÝ"
        giaTri={98}
        mauSo="var(--brand)"
        phu="trong hạn"
        onClick={() =>
          moDrill({
            ten: 'Hồ sơ đang xử lý',
            val: 98,
            sub: 'hồ sơ trong hạn',
            pct: 93,
            mod: 'tthc',
            dv: 'Văn phòng - Một cửa',
          })
        }
      />
      <KpiCard
        nhan="SẮP / ĐÃ QUÁ HẠN"
        giaTri={9}
        mauSo="var(--gdos-danger)"
        phu="cần xử lý ngay"
        onClick={() =>
          moDrill({
            ten: 'Hồ sơ sắp / quá hạn',
            val: 9,
            sub: 'hồ sơ cần xử lý ngay',
            pct: 40,
            mod: 'tthc',
            dv: 'Các bộ phận chuyên môn',
          })
        }
      />
    </div>
  )
}
