import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import type { ChiSo } from '@/dieu-hanh/mocks/types'
import { mauKpi } from '../du-lieu'

interface Props {
  chiSo: ChiSo
  onPress: () => void
}

/** Một thẻ KPI trong lưới 6 thẻ — port khối `.card.stat.click` của bản gốc. */
export function TheKpi({ chiSo, onPress }: Props) {
  const [ten, val, mucTieu, mau, , donVi] = chiSo
  const datMucTieu = mau === 'green'

  return (
    <button
      type="button"
      onClick={onPress}
      className="rounded-card bg-nen p-[22px] text-center shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="text-[0.72rem] font-bold tracking-[0.08em] text-faint">{ten.toUpperCase()}</div>
      <div className="mb-0.5 mt-2.5">
        <Gauge val={val} sub={`Mục tiêu ${mucTieu}`} color={mauKpi(mau)} />
      </div>
      <div className="text-[0.72rem] text-chu-phu">{donVi}</div>
      <div className="mt-2.5">
        <StatusChip trangThai={datMucTieu ? ['✓ Đạt mục tiêu', 'green'] : ['⚠ Cần đẩy nhanh', 'yel']} />
      </div>
    </button>
  )
}
