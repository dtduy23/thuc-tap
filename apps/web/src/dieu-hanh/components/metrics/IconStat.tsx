import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  nen: string
  mau: string
  nhan: string
  giaTri: string
  xuHuong?: ReactNode
}

/** Port từ icost() — dòng chỉ số có ô icon vuông, dùng ở các card tổng hợp. */
export function IconStat({ icon, nen, mau, nhan, giaTri, xuHuong }: Props) {
  return (
    <div className="flex items-center gap-2.5 border-b border-divider-soft py-[9.5px] last:border-b-0">
      <span
        className="grid size-8 flex-none place-items-center rounded-[9px] [&_svg]:size-4"
        style={{ background: nen, color: mau }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex-1 text-[0.76rem]">{nhan}</span>
      <b className="tnum text-[0.92rem] text-ink">{giaTri}</b>
      {xuHuong}
    </div>
  )
}
