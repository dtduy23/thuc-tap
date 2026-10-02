import { Link } from '@tanstack/react-router'
import { chucNangCua } from '@/dieu-hanh/app/modules'
import type { LinhVucTomTat, TrangXp, IdTrang } from '@/dieu-hanh/mocks/xa-phuong'
import { LOP_NHIP, LOP_THE } from '@/dieu-hanh/components/ui/LuoiDashboard'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

/** Port từ .card.domain — bấm cả thẻ để sang dashboard lĩnh vực. */
export function TheLinhVuc({ d, trang }: { d: LinhVucTomTat; trang: Record<IdTrang, TrangXp> }) {
  return (
    <Link
      to="/$chucNang"
      params={{ chucNang: chucNangCua(trang[d.id].module) }}
      className={`${LOP_THE} ${LOP_NHIP[4]} block cursor-pointer px-[18px] py-4 transition-colors duration-150 hover:border-bd-1`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <b className="text-ink">{d.n}</b>
        <NhanDanhGia loai={d.st[0]} coIcon>
          {d.st[1]}
        </NhanDanhGia>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-[9px] text-[12.5px]">
        {d.kv.map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-body">{k}</span>
            <span className="tnum text-right font-semibold text-ink">{v}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}
