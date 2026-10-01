import type { GhiChu } from '@/dieu-hanh/mocks/xa-phuong'
import { ICON_XP } from '@/dieu-hanh/components/ui/NhanDanhGia'

/** Port từ notes(): danh sách lưu ý, mỗi dòng mở đầu bằng cụm in đậm. */
export function GhiChuCanhBao({ ds, className = '' }: { ds: ReadonlyArray<GhiChu>; className?: string }) {
  return (
    <ul className={`m-0 grid list-none gap-2 p-0 ${className}`}>
      {ds.map((g) => (
        <li
          key={g.dam}
          className="flex gap-2.5 rounded-lg bg-bd-nen-phu px-[11px] py-[9px] text-[13px] text-body [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:flex-none [&_svg]:text-bd-canh-bao-chu"
        >
          {ICON_XP.warn}
          <span>
            <b className="text-ink">{g.dam}</b>
            {g.con}
          </span>
        </li>
      ))}
    </ul>
  )
}
