import type { CauHinhCongKhai, CauHinhHeThong, ChinhSachBaoMat, NhanDien } from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi } from './http'

export const KHOA_CONG_KHAI = ['cau-hinh', 'cong-khai'] as const
export const KHOA_CAU_HINH = ['cau-hinh', 'day-du'] as const

/** Tên hiển thị + độ dài mật khẩu tối thiểu — màn đăng nhập cũng đọc được. */
export const truyVanCongKhai = queryOptions({
  queryKey: KHOA_CONG_KHAI,
  queryFn: () => goiApi<CauHinhCongKhai>('/cau-hinh/cong-khai'),
  staleTime: 5 * 60_000,
})

export const truyVanCauHinh = queryOptions({
  queryKey: KHOA_CAU_HINH,
  queryFn: () => goiApi<CauHinhHeThong>('/cau-hinh'),
})

export const luuBaoMat = (cs: ChinhSachBaoMat) =>
  goiApi<CauHinhHeThong>('/cau-hinh/bao-mat', { method: 'PUT', body: cs })

export const luuNhanDien = (nd: NhanDien) =>
  goiApi<CauHinhHeThong>('/cau-hinh/nhan-dien', { method: 'PUT', body: nd })
