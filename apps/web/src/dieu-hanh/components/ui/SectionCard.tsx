import type { ReactNode } from 'react'

interface Props {
  tieuDe?: ReactNode
  /** Khối bên phải tiêu đề: chú giải, nút "Xem tất cả →", ô lọc… */
  phu?: ReactNode
  children: ReactNode
  className?: string
  /** Bỏ padding mặc định của .card-b — dùng cho bảng. */
  khongDem?: boolean
  onClick?: () => void
}

/** Bản gốc: .card + .card-h + .card-b */
export function SectionCard({ tieuDe, phu, children, className = '', khongDem, onClick }: Props) {
  const noiDung = (
    <>
      {(tieuDe || phu) && (
        <div className="flex items-center justify-between gap-2.5 border-b border-line-2 px-[18px] py-3.5">
          {typeof tieuDe === 'string' ? <b className="text-[0.9rem] text-ink">{tieuDe}</b> : tieuDe}
          {phu}
        </div>
      )}
      <div className={khongDem ? 'px-3 py-2' : 'px-[18px] py-3.5'}>{children}</div>
    </>
  )

  const lop = `rounded-card bg-nen shadow-card ${className}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${lop} w-full text-left`}>
        {noiDung}
      </button>
    )
  }
  return <section className={lop}>{noiDung}</section>
}
