import { toast as heroToast } from '@heroui/react'

/**
 * Port từ toast() của bản gốc, chạy trên hàng đợi Toast của HeroUI v3.
 * Bản gốc hiện 3 giây nên giữ nguyên timeout đó thay vì mặc định 4 giây.
 */
const THOI_GIAN = 3000

export const toast = (m: string) => heroToast(m, { timeout: THOI_GIAN })

/** Các biến thể dùng khi thông báo mang sắc thái rõ ràng. */
toast.thanhCong = (m: string) => heroToast.success(m, { timeout: THOI_GIAN })
toast.loi = (m: string) => heroToast.danger(m, { timeout: THOI_GIAN })
