import type { ReactNode } from 'react'
import { soVN } from '@/dieu-hanh/lib/format'
import { Sparkline, sinhDiem } from '@/dieu-hanh/components/charts/Sparkline'
import { useDemSo } from '@/dieu-hanh/hooks/use-dem-so'

interface Props {
  /** Nhãn viết hoa phía trên, ví dụ "TTHC TIẾP NHẬN". */
  nhan: string
  /** Số đã định dạng sẵn (ví dụ "55.010") hoặc số thô để chạy hiệu ứng đếm. */
  giaTri: number | string
  /** Dòng chú thích dưới số. */
  phu?: ReactNode
  /** Màu chữ của số — dùng biến token. */
  mauSo: string
  /** Icon tròn bên trái (biến thể .stat.s2 của bản gốc). */
  icon?: ReactNode
  iconNen?: string
  iconMau?: string
  onClick?: () => void
  /** Bật hiệu ứng đếm — bản gốc chỉ bật ở thẻ có data-count. */
  dem?: boolean
}

/** Port từ .stat / .stat.s2 — gồm cả sparkline mà decorateStats() gắn thêm. */
export function KpiCard({ nhan, giaTri, phu, mauSo, icon, iconNen, iconMau, onClick, dem }: Props) {
  const soThô =
    typeof giaTri === 'number' ? giaTri : Number(giaTri.replace(/\./g, '').replace(',', '.')) || 60
  const demSo = useDemSo(typeof giaTri === 'number' ? giaTri : 0, dem === true && typeof giaTri === 'number')
  const hienThi = typeof giaTri === 'number' ? soVN(dem ? demSo : giaTri) : giaTri
  const diem = sinhDiem(soThô, `${nhan}${giaTri}`)

  const than = (
    <>
      <div className="text-[0.62rem] font-bold tracking-[0.12em] text-faint">{nhan}</div>
      <div
        className="tnum mt-1 mb-0.5 text-[1.9rem] font-extrabold leading-tight"
        style={{ color: mauSo, fontSize: icon ? '1.62rem' : undefined }}
      >
        {hienThi}
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5 text-[0.7rem] text-chu-phu">{phu}</div>
      <Sparkline vals={diem} color={mauSo} />
    </>
  )

  const noiDung = icon ? (
    <div className="flex items-center gap-3 text-left">
      <span
        className="grid size-[46px] flex-none place-items-center rounded-full [&_svg]:size-[22px]"
        style={{ background: iconNen, color: iconMau }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">{than}</div>
    </div>
  ) : (
    <div className="text-center">{than}</div>
  )

  const lop = 'rounded-card bg-nen px-[18px] py-4 shadow-card transition-transform'

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${lop} w-full cursor-pointer hover:-translate-y-0.5`}
      >
        {noiDung}
      </button>
    )
  }
  return <div className={lop}>{noiDung}</div>
}
