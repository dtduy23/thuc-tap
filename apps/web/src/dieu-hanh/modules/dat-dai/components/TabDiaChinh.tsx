import { SectionCard } from '@/dieu-hanh/components/ui/SectionCard'
import type { ChiTieuDrill } from '@/dieu-hanh/components/overlay/DrillModal'
import type { ThuaDat } from '@/dieu-hanh/mocks/types'
import { CHU_GIAI_THUA } from '../du-lieu'
import { BanDoDiaChinh } from './BanDoDiaChinh'
import { HangTongHop } from './HangTongHop'
import { HopLop } from './HopLop'
import { HoSoDangXuLy } from './HoSoDangXuLy'
import { ThongTinThua } from './ThongTinThua'

interface Props {
  moDrill: (ct: ChiTieuDrill) => void
  thua: ThuaDat
  cid: string
  dienTich: string
  thuaChon: number
  chonThua: (i: number) => void
  dinhVi: (id: string) => void
  hienQh: boolean
  datHienQh: (v: boolean) => void
  anhVeTinh: boolean
  datAnhVeTinh: (v: boolean) => void
  moQh: number
  datMoQh: (v: number) => void
  hoiAi: () => void
  moLichSu: () => void
  moQuyHoach: () => void
}

/** Tab 0 — "Bản đồ địa chính". */
export function TabDiaChinh({
  moDrill,
  thua,
  cid,
  dienTich,
  thuaChon,
  chonThua,
  dinhVi,
  hienQh,
  datHienQh,
  anhVeTinh,
  datAnhVeTinh,
  moQh,
  datMoQh,
  hoiAi,
  moLichSu,
  moQuyHoach,
}: Props) {
  return (
    <>
      <HangTongHop moDrill={moDrill} />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <SectionCard>
          {/* isolate: giữ z-index của HopLop trong khung, không đè TopBar */}
          <div className="relative isolate">
            <BanDoDiaChinh
              chieuCao={520}
              thuaChon={thuaChon}
              chonThua={chonThua}
              hienQh={hienQh}
              moQh={moQh}
              anhVeTinh={anhVeTinh}
              moThongTinQh={moQuyHoach}
            />
            <HopLop
              hienQh={hienQh}
              datHienQh={datHienQh}
              anhVeTinh={anhVeTinh}
              datAnhVeTinh={datAnhVeTinh}
              moQh={moQh}
              datMoQh={datMoQh}
              moThongTinQh={moQuyHoach}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-3.5 text-[0.72rem] text-body">
            <span className="flex items-center gap-1.5">
              <i
                className="inline-block size-3"
                style={{
                  background: CHU_GIAI_THUA.thua.nen,
                  border: CHU_GIAI_THUA.thua.vien,
                }}
                aria-hidden="true"
              />
              Thửa đất (địa chính)
            </span>
            <span className="flex items-center gap-1.5">
              <i
                className="inline-block size-3"
                style={{
                  background: CHU_GIAI_THUA.dangChon.nen,
                  border: CHU_GIAI_THUA.dangChon.vien,
                }}
                aria-hidden="true"
              />
              Thửa đang chọn (đo cạnh m)
            </span>
            <span className="text-tim">▨ Lớp quy hoạch</span>
            <span className="text-faint">Nền: OpenStreetMap / Esri — kéo &amp; cuộn để zoom</span>
          </div>
        </SectionCard>

        <div className="grid gap-4">
          <ThongTinThua
            thua={thua}
            cid={cid}
            dienTich={dienTich}
            hoiAi={hoiAi}
            moLichSu={moLichSu}
            moQuyHoach={moQuyHoach}
          />
          <HoSoDangXuLy dinhVi={dinhVi} />
        </div>
      </div>
    </>
  )
}
