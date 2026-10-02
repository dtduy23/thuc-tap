import { KpiCard } from '@/dieu-hanh/components/metrics/KpiCard'
import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import { StatusChip } from '@/dieu-hanh/components/ui/StatusChip'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import { MAU_RANH_MOI, THE_DIA_GIOI, TOA_DO_MOC } from '../du-lieu'
import { BanDoDiaGioi } from './BanDoDiaGioi'

interface Props {
  moDrill: (ct: ChiTieuDrill) => void
  hienRanhCu: boolean
  datHienRanhCu: (v: boolean) => void
  mocDangXem: number | null
  xemMoc: (i: number) => void
}

/** Tab 1 — "Địa giới hành chính". */
export function TabDiaGioi({ moDrill, hienRanhCu, datHienRanhCu, mocDangXem, xemMoc }: Props) {
  return (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {THE_DIA_GIOI.map((t) => (
          <KpiCard
            key={t.nhan}
            nhan={t.nhan}
            giaTri={t.giaTri}
            phu={t.phu}
            mauSo={t.mau}
            onClick={() => moDrill(t.drill)}
          />
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <SectionCard>
          <BanDoDiaGioi chieuCao={480} hienRanhCu={hienRanhCu} mocDangXem={mocDangXem} />

          <div className="mt-2.5 flex flex-wrap items-center gap-3.5 text-[0.72rem] text-body">
            <span style={{ color: MAU_RANH_MOI }}>▬ Ranh giới mới (2025)</span>
            <span className="text-tim">- - - Ranh đơn vị cũ</span>
            <span style={{ color: MAU_RANH_MOI }}>▲ Mốc địa giới (bấm để xem)</span>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={hienRanhCu} onChange={(e) => datHienRanhCu(e.target.checked)} />
              Hiện ranh cũ
            </label>
          </div>
        </SectionCard>

        <SectionCard tieuDe="Hồ sơ mốc địa giới · 513/CP" khongDem>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="rounded-l-lg bg-row-head px-2.5 py-2 text-[0.68rem] font-bold tracking-[0.04em] text-chu-phu">
                  Mốc
                </th>
                <th className="bg-row-head px-2.5 py-2 text-[0.68rem] font-bold tracking-[0.04em] text-chu-phu">
                  Tọa độ VN-2000
                </th>
                <th className="rounded-r-lg bg-row-head px-2.5 py-2 text-[0.68rem] font-bold tracking-[0.04em] text-chu-phu">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {TOA_DO_MOC.map((c, i) => (
                <tr
                  key={i}
                  onClick={() => xemMoc(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Xem mốc địa giới M${i + 1} trên bản đồ`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      xemMoc(i)
                    }
                  }}
                  className={`cursor-pointer border-b border-line-2 hover:bg-row-hover ${
                    mocDangXem === i ? 'bg-brand-soft' : ''
                  }`}
                >
                  <td className="px-2.5 py-2 text-[0.78rem]">
                    <b className="text-ink">M{i + 1}</b>
                  </td>
                  <td className="tnum px-2.5 py-2 text-[0.78rem] text-body">{c}</td>
                  <td className="px-2.5 py-2">
                    <StatusChip trangThai={['Đã số hóa', 'green']} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mx-1 mb-0.5 mt-2.5 text-[0.76rem] leading-[2] text-ok-tx">
            ✓ Bản đồ địa giới 1:10.000 &nbsp; ✓ Bảng tọa độ mốc &nbsp; ✓ Biên bản bàn giao
          </div>
        </SectionCard>
      </div>
    </>
  )
}
