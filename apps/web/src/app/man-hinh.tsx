import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Chức năng cấp 4 → màn hình. Tách bundle theo màn (lazy): người không có quyền
 * Tầng 2 không bao giờ tải mã màn quản trị.
 *
 * Mọi chức năng trong registry phải có màn ở đây — test man-hinh.test.ts chặn.
 */
export const MAN_HINH: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {}
