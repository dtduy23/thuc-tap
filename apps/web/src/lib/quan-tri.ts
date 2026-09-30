/**
 * Gọi API Tầng 2 (tài khoản, đơn vị) và nhật ký. Kiểu dữ liệu lấy từ
 * `@gdos/shared` — cùng kiểu API trả, không khai lại.
 */
import type { CapDonVi, DonViDong, KetQuaCapMatKhau, PhanCong, TaiKhoanDong, TrangNhatKy } from '@gdos/shared'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { goiApi } from './http'

export const KHOA_TAI_KHOAN = ['tai-khoan'] as const
export const KHOA_DON_VI = ['don-vi'] as const
export const KHOA_NHAT_KY = ['nhat-ky'] as const

export const truyVanTaiKhoan = queryOptions({
  queryKey: KHOA_TAI_KHOAN,
  queryFn: () => goiApi<TaiKhoanDong[]>('/tai-khoan'),
})

export const truyVanDonVi = queryOptions({
  queryKey: KHOA_DON_VI,
  queryFn: () => goiApi<DonViDong[]>('/don-vi'),
})

export interface TaoTaiKhoan {
  tenDangNhap: string
  hoTen: string
  donViId: string
  laQuanTri: boolean
  nativeUserId: string
  phanCong: PhanCong[]
}

export const taoTaiKhoan = (dl: TaoTaiKhoan) =>
  goiApi<KetQuaCapMatKhau>('/tai-khoan', { method: 'POST', body: dl })

export const suaTaiKhoan = (id: string, dl: { hoTen?: string; laQuanTri?: boolean; nativeUserId?: string }) =>
  goiApi<TaiKhoanDong>(`/tai-khoan/${id}`, { method: 'PATCH', body: dl })

export const datPhanCong = (id: string, phanCong: PhanCong[]) =>
  goiApi<TaiKhoanDong>(`/tai-khoan/${id}/phan-cong`, { method: 'PUT', body: { phanCong } })

export const datGiamSat = (id: string, linhVucIds: string[]) =>
  goiApi<TaiKhoanDong>(`/tai-khoan/${id}/giam-sat`, { method: 'PUT', body: { linhVucIds } })

export const khoaTaiKhoan = (id: string, khoa: boolean) =>
  goiApi<TaiKhoanDong>(`/tai-khoan/${id}/${khoa ? 'khoa' : 'mo-khoa'}`, { method: 'POST' })

export const datLaiMatKhau = (id: string) =>
  goiApi<KetQuaCapMatKhau>(`/tai-khoan/${id}/dat-lai-mat-khau`, { method: 'POST' })

export const taoDonVi = (dl: { ma: string; ten: string; chaId: string; cap: CapDonVi }) =>
  goiApi<{ id: string }>('/don-vi', { method: 'POST', body: dl })

export const suaDonVi = (id: string, dl: { ma?: string; ten?: string }) =>
  goiApi<DonViDong>(`/don-vi/${id}`, { method: 'PATCH', body: dl })

export interface LocNhatKy {
  /** Chỉ thao tác trên một dự án — thẻ Nhật ký trong hồ sơ. */
  duAnId?: string
  bang?: string
  hanhDong?: string
  tu?: string
  den?: string
}

export const truyVanNhatKy = (loc: LocNhatKy) =>
  infiniteQueryOptions({
    queryKey: [...KHOA_NHAT_KY, loc],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams()
      for (const [k, v] of Object.entries(loc) as [string, string | undefined][]) if (v) q.set(k, v)
      if (pageParam) q.set('truoc', String(pageParam))
      return goiApi<TrangNhatKy>(`/nhat-ky?${q.toString()}`)
    },
    getNextPageParam: (trang) => trang.tiep,
  })
