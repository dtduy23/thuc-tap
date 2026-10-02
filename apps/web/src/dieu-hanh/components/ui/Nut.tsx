import type { ReactNode } from 'react'
import { Button } from '@heroui/react'

interface Props {
  onPress?: () => void
  children: ReactNode
  isDisabled?: boolean
  className?: string
}

/**
 * Nút hành động chính. Dùng Button HeroUI nguyên bản (dáng pill, cao 40px)
 * theo quyết định của chủ dự án — khác .btn-pri 9px của bản gốc.
 */
export function NutChinh({ onPress, children, isDisabled, className }: Props) {
  return (
    <Button variant="primary" onPress={onPress} isDisabled={isDisabled} className={className}>
      {children}
    </Button>
  )
}

/** Nút phụ — Button HeroUI variant outline. */
export function NutPhu({ onPress, children, isDisabled, className }: Props) {
  return (
    <Button variant="outline" onPress={onPress} isDisabled={isDisabled} className={className}>
      {children}
    </Button>
  )
}

/** Nút chữ — Button HeroUI variant ghost, dùng cho "Xem tất cả →". */
export function NutChu({ onPress, children, className }: Props) {
  return (
    <Button variant="ghost" onPress={onPress} className={className}>
      {children}
    </Button>
  )
}
