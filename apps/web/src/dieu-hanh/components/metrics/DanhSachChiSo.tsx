import { IconStat } from './IconStat'
import { Trend } from './Trend'
import { MINI } from '@/dieu-hanh/components/ui/icons'

export interface DongChiSo {
  /** Khóa icon trong bảng MINI. */
  readonly icon: string
  readonly nen: string
  readonly mau: string
  readonly nhan: string
  readonly giaTri: string
  /** Phần trăm thay đổi so với kỳ trước. */
  readonly d: number
  /** true khi giảm mới là tốt. */
  readonly inv?: boolean
}

/** Bốn card tổng hợp của bản gốc đều là danh sách icost() — dùng chung một khối. */
export function DanhSachChiSo({ dong }: { dong: ReadonlyArray<DongChiSo> }) {
  return (
    <>
      {dong.map((d) => (
        <IconStat
          key={d.nhan}
          icon={MINI[d.icon]}
          nen={d.nen}
          mau={d.mau}
          nhan={d.nhan}
          giaTri={d.giaTri}
          xuHuong={<Trend d={d.d} inv={d.inv} />}
        />
      ))}
    </>
  )
}
