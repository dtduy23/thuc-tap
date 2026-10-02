import type { ReactNode } from 'react'

interface Props {
  /** Đường dẫn hiển thị của bản gốc — khung hệ thống mới đã có, không vẽ lại. */
  crumb: string
  tieuDe: string
  moTa?: string
  /** Khóa icon module trong bản gốc. */
  gocKey: string
  mau: string
  hanhDong?: ReactNode
}

/**
 * Đầu trang của các màn chép từ GDOS cũ. Đường dẫn và TIÊU ĐỀ đã do khung của hệ thống mới
 * vẽ (lấy từ registry), nên ở đây chỉ còn dòng mô tả và cụm nút hành động của bản gốc —
 * tránh hai tiêu đề chồng nhau.
 */
export function PageHeader({ moTa, hanhDong }: Props) {
  if (!moTa && !hanhDong) return null
  return (
    <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 text-[0.8rem] text-chu-phu">{moTa}</div>
      {hanhDong}
    </div>
  )
}
