import type { ReactNode } from 'react'
import type { LoaiNhan } from '@/dieu-hanh/mocks/xa-phuong'

/** Icon 16px của Dashboard Xã/Phường — port từ ICON {warn, ok, no, na}. */
export const ICON_XP = {
  warn: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path d="M8 1.8 15 14H1z" />
      <path d="M8 6v4M8 11.8v.4" />
    </svg>
  ),
  ok: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="m3 8.5 3 3 7-7" />
    </svg>
  ),
  no: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  ),
  na: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M5 8h6" />
    </svg>
  ),
}

const MAU: Record<LoaiNhan, string> = {
  ok: 'text-bd-dat-chu',
  no: 'text-bd-chua-dat',
  na: 'text-faint',
  wa: 'text-bd-canh-bao-chu',
}

const ICON_THEO_LOAI = { ok: ICON_XP.ok, no: ICON_XP.no, na: ICON_XP.na, wa: ICON_XP.warn }

/** Port từ .badge ok/no/na/wa. Một số chỗ trong bản gốc có icon, một số không. */
export function NhanDanhGia({
  loai,
  coIcon,
  className = '',
  children,
}: {
  loai: LoaiNhan
  coIcon?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-[12px] font-medium [&_svg]:size-3 ${MAU[loai]} ${className}`}
    >
      {coIcon && ICON_THEO_LOAI[loai]}
      {children}
    </span>
  )
}
