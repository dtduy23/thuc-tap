import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { Gauge } from '@/dieu-hanh/components/charts/Gauge'
import { Bar } from '@/dieu-hanh/components/charts/Bar'
import { nice } from '@/dieu-hanh/lib/format'
import type { MucChart } from '@/dieu-hanh/components/charts/palette'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { ChiTieuKtxh, NhomKtxh } from '@/dieu-hanh/mocks/types'
import { donViChiTieu, mauTheoPct } from '../du-lieu'

/** Đổi một dòng chỉ tiêu của `D.ktxh` thành tham số drillCt() bản gốc. */
const sangDrill = (it: ChiTieuKtxh): ChiTieuDrill => ({
  ten: it[0],
  val: it[1],
  sub: it[2],
  pct: it[3],
  mod: it[4],
  dv: it[5],
})

interface Props {
  nhom: NhomKtxh
  /** Bản gốc: nhóm 0 và 2 vẽ gauge, nhóm 1 và 3 vẽ bar. */
  dungGauge: boolean
  moDrill: (ct: ChiTieuDrill) => void
}

export function TheNhom({ nhom, dungGauge, moDrill }: Props) {
  // drillKtxhWorst(): bấm tiêu đề thẻ → mở chỉ tiêu có % đạt thấp nhất trong nhóm
  const kem = nhom.items.reduce((a, b) => (b[3] < a[3] ? b : a))

  return (
    <SectionCard
      tieuDe={nhom.nhom}
      phu={
        <button
          type="button"
          onClick={() => moDrill(sangDrill(kem))}
          className="text-[0.7rem] font-semibold text-brand hover:underline"
        >
          Chi tiết →
        </button>
      }
    >
      {dungGauge ? (
        <>
          <div className="grid grid-cols-3 gap-1 text-center">
            {nhom.items.map((it) => (
              <button
                key={it[0]}
                type="button"
                onClick={() => moDrill(sangDrill(it))}
                className="rounded-lg p-1 hover:bg-row-hover"
              >
                <Gauge
                  val={Math.min(it[3], 100)}
                  sub={`${nice(it[1])} ${donViChiTieu(it[2])}`}
                  color={mauTheoPct(it[3])}
                />
                <div className="-mt-1 text-[0.64rem] leading-[1.25] text-chu-phu">{it[0]}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-center text-[0.68rem] text-faint">
            Vòng cung = % đạt kế hoạch · số dưới vòng = giá trị thực
          </div>
        </>
      ) : (
        <>
          <Bar items={nhom.items.map(sangCot)} h={176} />
          <div className="mt-[7px] text-[0.68rem] text-faint">
            Chiều cao cột = % đạt kế hoạch · số trên cột = giá trị thực
          </div>
        </>
      )}
    </SectionCard>
  )
}

/**
 * Bản gốc: chiều cao cột là % đạt kế hoạch (chặn 110), chữ trên cột là giá trị thực —
 * thêm '%' khi đơn vị chỉ tiêu bắt đầu bằng '%'.
 */
function sangCot(it: ChiTieuKtxh): MucChart {
  const donVi = donViChiTieu(it[2])
  const nhanGiaTri = nice(it[1]) + (donVi[0] === '%' ? '%' : '')
  return [it[0], Math.min(it[3], 110), mauTheoPct(it[3]), nhanGiaTri]
}
