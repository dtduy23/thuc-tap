import type { ThongTinToi } from '@gdos/shared'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { goiApi } from './http'

export const KHOA_TOI = ['xac-thuc', 'toi'] as const

/** Người đang đăng nhập. Hết phiên thì lớp http tự làm mới; làm mới hỏng → 401. */
export const truyVanToi = queryOptions({
  queryKey: KHOA_TOI,
  queryFn: () => goiApi<ThongTinToi>('/xac-thuc/toi'),
  staleTime: 60_000,
  retry: false,
})

export async function dangNhap(qc: QueryClient, tenDangNhap: string, matKhau: string) {
  const toi = await goiApi<ThongTinToi>('/xac-thuc/dang-nhap', {
    method: 'POST',
    body: { tenDangNhap, matKhau },
  })
  qc.setQueryData(KHOA_TOI, toi)
  return toi
}

/** Đăng xuất: báo máy chủ thu hồi phiên, rồi xóa sạch dữ liệu đã tải của người cũ. */
export async function dangXuat(qc: QueryClient) {
  await goiApi('/xac-thuc/dang-xuat', { method: 'POST' }).catch(() => undefined)
  qc.clear()
}

/** Đổi mật khẩu; API trả vé mới (bỏ cờ phải đổi mật khẩu) kèm thông tin mới. */
export async function doiMatKhau(qc: QueryClient, matKhauCu: string, matKhauMoi: string) {
  const toi = await goiApi<ThongTinToi>('/xac-thuc/doi-mat-khau', {
    method: 'POST',
    body: { matKhauCu, matKhauMoi },
  })
  qc.setQueryData(KHOA_TOI, toi)
  return toi
}
