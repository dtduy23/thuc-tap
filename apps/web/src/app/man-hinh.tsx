import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Chức năng cấp 4 → màn hình. Tách bundle theo màn (lazy): người không có quyền
 * Tầng 2 không bao giờ tải mã màn quản trị.
 *
 * Chức năng nào trong registry cũng phải có màn ở đây, TRỪ màn phác (`phac`) —
 * test man-hinh.test.ts chặn cả hai chiều.
 */
export const MAN_HINH: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  'nk-tat-ca': lazy(() => import('@/man/nhat-ky-ds')),
  'da-tat-ca': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.TatCaDuAn }))),
  'da-cua-toi': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.DuAnCuaToi }))),
  'da-cho-xac-nhan': lazy(() => import('@/man/du-an/danh-sach').then((m) => ({ default: m.DuAnChoXacNhan }))),
  'da-tao': lazy(() => import('@/man/du-an/tao')),
  'da-don-doc': lazy(() => import('@/man/du-an/don-doc')),
  'qh-sla': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.DaQuaHan }))),
  'qh-sap': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.SapDenHan }))),
  'qh-lau': lazy(() => import('@/man/canh-bao').then((m) => ({ default: m.LauKhongCapNhat }))),
  'tq-toan': lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanToanCanh }))),
  'tq-don-vi': lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanDonVi }))),
  'tq-lv': lazy(() => import('@/man/tong-quan').then((m) => ({ default: m.TongQuanLinhVuc }))),
  'bcs-tat-ca': lazy(() => import('@/man/chi-so').then((m) => ({ default: m.TatCaChiSo }))),
  'bcs-xep-hang': lazy(() => import('@/man/chi-so').then((m) => ({ default: m.XepHangDonVi }))),
  'tk-ds': lazy(() => import('@/man/tai-khoan-ds')),
  'tk-khoa': lazy(() => import('@/man/tai-khoan-khoa')),
  'tk-tao': lazy(() => import('@/man/tai-khoan-tao')),
  'dv-ds': lazy(() => import('@/man/don-vi-ds')),
  'vt-ma-tran': lazy(() => import('@/man/vai-tro-ma-tran')),
  'ch-bao-mat': lazy(() => import('@/man/cau-hinh-bao-mat')),
  'ch-nhan-dien': lazy(() => import('@/man/cau-hinh-nhan-dien')),
}
