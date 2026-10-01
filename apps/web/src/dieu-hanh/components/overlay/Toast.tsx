import { Toast as HeroToast } from '@heroui/react'

/**
 * Vùng hiển thị toast của HeroUI v3. Đặt `placement="bottom"` để trùng vị trí
 * giữa-dưới của bản gốc (.toast{left:50%;bottom:30px}).
 */
export function ToastRegion() {
  return <HeroToast.Provider placement="bottom" maxVisibleToasts={3} />
}
