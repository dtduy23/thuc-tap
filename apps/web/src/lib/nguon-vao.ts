/** Tầng 2 › Kết nối › Nguồn dữ liệu vào — nạp số liệu chỉ tiêu qua API và Excel. */
import type { KetQuaKiemNap, KetQuaThuNguon, LanNap, NguonApi, NguonApiGhi, SoLieuDaNap } from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi, taiLenTep } from './http'

export const KHOA_NGUON_VAO = ['nguon-vao'] as const

export const truyVanNguonApi = queryOptions({
  queryKey: [...KHOA_NGUON_VAO, 'api'],
  queryFn: () => goiApi<NguonApi[]>('/nguon-vao/api'),
})
export const truyVanLanNap = queryOptions({
  queryKey: [...KHOA_NGUON_VAO, 'lan-nap'],
  queryFn: () => goiApi<LanNap[]>('/nguon-vao/lan-nap'),
})
export const truyVanSoLieuNap = queryOptions({
  queryKey: [...KHOA_NGUON_VAO, 'so-lieu'],
  queryFn: () => goiApi<SoLieuDaNap[]>('/nguon-vao/so-lieu'),
})

export const taoNguonApi = (n: NguonApiGhi) =>
  goiApi<NguonApi[]>('/nguon-vao/api', { method: 'POST', body: n })
export const suaNguonApi = (id: string, n: NguonApiGhi) =>
  goiApi<NguonApi[]>(`/nguon-vao/api/${id}`, { method: 'PATCH', body: n })
export const xoaNguonApi = (id: string) => goiApi<NguonApi[]>(`/nguon-vao/api/${id}/xoa`, { method: 'POST' })
/** Gọi thử theo cấu hình đang soạn; `id` để dùng khóa đã lưu khi không nhập lại. */
export const thuNguonApi = (n: NguonApiGhi, id?: string) =>
  goiApi<KetQuaThuNguon>('/nguon-vao/api/thu', { method: 'POST', body: { ...n, id } })
export const layTuNguonApi = (id: string) => goiApi<LanNap>(`/nguon-vao/api/${id}/lay`, { method: 'POST' })

const goiTep = (f: File) => {
  const du = new FormData()
  du.append('tep', f)
  return du
}
export const kiemTepSoLieu = (f: File) => taiLenTep<KetQuaKiemNap>('/nguon-vao/excel/kiem-tra', goiTep(f))
export const napTepSoLieu = (f: File) => taiLenTep<LanNap>('/nguon-vao/excel', goiTep(f))
export const xoaSoLieuNap = (id: string) =>
  goiApi<{ ok: true }>(`/nguon-vao/so-lieu/${id}/xoa`, { method: 'POST' })
