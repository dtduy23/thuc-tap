import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Chức năng cấp 4 → màn hình. Tách bundle theo màn (lazy): người không có quyền
 * Tầng 2 không bao giờ tải mã màn quản trị.
 *
 * Mọi chức năng trong registry phải có màn ở đây — test man-hinh.test.ts chặn.
 */
export const MAN_HINH: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  'nk-tat-ca': lazy(() => import('@/man/nhat-ky-ds')),
  'tk-ds': lazy(() => import('@/man/tai-khoan-ds')),
  'tk-tao': lazy(() => import('@/man/tai-khoan-tao')),
  'dv-ds': lazy(() => import('@/man/don-vi-ds')),
  'vt-ma-tran': lazy(() => import('@/man/vai-tro-ma-tran')),
  'ch-bao-mat': lazy(() => import('@/man/cau-hinh-bao-mat')),
  'ch-nhan-dien': lazy(() => import('@/man/cau-hinh-nhan-dien')),
}
