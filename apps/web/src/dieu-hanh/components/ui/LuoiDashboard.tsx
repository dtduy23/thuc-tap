import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { chucNangCua } from '@/dieu-hanh/app/modules'
import type { DongKv } from '@/dieu-hanh/mocks/xa-phuong'
import { NhanDanhGia } from '@/dieu-hanh/components/ui/NhanDanhGia'

/**
 * Khối nguyên thủy của Dashboard Xã/Phường: lưới 12 cột (.grid + .c3…c12),
 * thẻ (.card h3 .sub), tiêu đề mục, thẻ "mô phỏng", bảng khóa–giá trị (.kv).
 * Mốc đổi cột 1200px/760px lấy đúng @media của bản gốc.
 */

export type Nhip = 3 | 4 | 5 | 6 | 7 | 8 | 12

export const LOP_NHIP: Record<Nhip, string> = {
  3: 'col-span-12 min-[761px]:col-span-6 min-[1201px]:col-span-3',
  4: 'col-span-12 min-[1201px]:col-span-4',
  5: 'col-span-12 min-[1201px]:col-span-5',
  6: 'col-span-12 min-[1201px]:col-span-6',
  7: 'col-span-12 min-[1201px]:col-span-7',
  8: 'col-span-12 min-[1201px]:col-span-8',
  12: 'col-span-12',
}

export const LOP_THE = 'min-w-0 rounded-[14px] border border-line bg-nen text-ink shadow-card'

export function LuoiDashboard({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-12 gap-2.5 min-[761px]:gap-[14px]">{children}</div>
}

export function TieuDeMuc({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-12 -mb-1 mt-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">
      {children}
    </div>
  )
}

export function ChuMoPhong() {
  return (
    <span className="ml-1 inline-block rounded bg-bd-nen-phu px-1.5 py-px align-[1px] text-[10.5px] font-medium text-faint">
      mô phỏng
    </span>
  )
}

interface TheProps {
  nhip: Nhip
  tieuDe: ReactNode
  /** Dòng phụ dưới tiêu đề; bản gốc để &nbsp; ở vài thẻ nên chuỗi rỗng vẫn giữ chỗ. */
  phu?: ReactNode
  moPhong?: boolean
  /** Nút bên phải tiêu đề (.card-head + .linkbtn). */
  hanhDong?: ReactNode
  children: ReactNode
}

export function TheDashboard({ nhip, tieuDe, phu, moPhong, hanhDong, children }: TheProps) {
  const dau = (
    <div>
      <h3 className="m-0 mb-0.5 text-[14px] font-semibold text-ink">
        {tieuDe}
        {moPhong && <ChuMoPhong />}
      </h3>
      {phu !== undefined && <p className="m-0 mb-3 min-h-[17px] text-[12px] text-faint">{phu}</p>}
    </div>
  )
  return (
    <section className={`${LOP_THE} ${LOP_NHIP[nhip]} px-[18px] py-4`}>
      {hanhDong ? (
        <div className="flex items-start justify-between gap-3">
          {dau}
          {hanhDong}
        </div>
      ) : (
        dau
      )}
      {children}
    </section>
  )
}

export function ChuChanThe({ children }: { children: ReactNode }) {
  return <p className="m-0 mt-3 text-[12px] text-faint">{children}</p>
}

/** .linkbtn[data-go] — chuyển sang dashboard lĩnh vực khác. */
export function LienKetTrang({ module, children }: { module: string; children: ReactNode }) {
  return (
    <Link
      to="/$chucNang"
      params={{ chucNang: chucNangCua(module) }}
      className="whitespace-nowrap text-[12.5px] font-semibold text-bd-chu-xanh hover:underline"
    >
      {children}
    </Link>
  )
}

export function BangKv({ ds, className = '' }: { ds: ReadonlyArray<DongKv>; className?: string }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-[9px] text-[13px] ${className}`}>
      {ds.map((d) => (
        <KvDong key={d.k} d={d} />
      ))}
    </div>
  )
}

function KvDong({ d }: { d: DongKv }) {
  return (
    <>
      <span className="text-body">{d.k}</span>
      <span className={`tnum text-right text-ink ${d.nhe ? 'font-medium' : 'font-semibold'}`}>
        {d.nhan ? <NhanDanhGia loai={d.nhan}>{d.v}</NhanDanhGia> : d.v}
      </span>
    </>
  )
}

/** Bảng số liệu (.card table) — tiêu đề cột mờ, dòng kẻ lưới. */
export const LOP_BANG =
  'w-full border-collapse text-[13px] [&_td]:border-b [&_td]:border-bd-luoi [&_td]:p-2 [&_td]:text-left [&_td]:align-top [&_th]:border-b [&_th]:border-bd-luoi [&_th]:p-2 [&_th]:text-left [&_th]:align-top [&_th]:text-[12px] [&_th]:font-semibold [&_th]:text-faint'
