/** Quản lý danh mục, quy trình mẫu (thêm, sửa, xóa mềm). Tra cứu để chọn nằm ở lib/du-an. */
import type { BuocMau, DanhMucQuanLy, GiaTriDanhMuc, HinhThuc, QuyTrinhMauChiTiet } from '@gdos/shared'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { goiApi } from './http'

export const truyVanQuanLyDanhMuc = (loai: GiaTriDanhMuc['loai']) =>
  queryOptions({
    queryKey: ['quan-ly-danh-muc', loai],
    queryFn: () => goiApi<DanhMucQuanLy>(`/quan-ly-danh-muc?loai=${loai}`),
  })

/** Sau khi sửa: ghi bản mới vào bộ nhớ đệm, đánh dấu cũ các ô chọn đang dùng danh mục đó. */
export async function capNhatDanhMuc(qc: QueryClient, loai: GiaTriDanhMuc['loai'], moi: DanhMucQuanLy) {
  qc.setQueryData(truyVanQuanLyDanhMuc(loai).queryKey, moi)
  await qc.invalidateQueries({ queryKey: ['danh-muc', loai] })
}

export const themGiaTri = (loai: GiaTriDanhMuc['loai'], ma: string, ten: string) =>
  goiApi<DanhMucQuanLy>('/quan-ly-danh-muc', { method: 'POST', body: { loai, ma, ten } })
export const suaGiaTri = (id: string, dl: { ten?: string; thuTu?: number }) =>
  goiApi<DanhMucQuanLy>(`/quan-ly-danh-muc/${id}`, { method: 'PATCH', body: dl })
export const xoaGiaTri = (id: string) =>
  goiApi<DanhMucQuanLy>(`/quan-ly-danh-muc/${id}/xoa`, { method: 'POST' })

export const truyVanChiTietQuyTrinh = (ma: string) =>
  queryOptions({
    queryKey: ['quy-trinh-mau', ma],
    queryFn: () => goiApi<QuyTrinhMauChiTiet>(`/quy-trinh-mau/${ma}`),
  })

export const nhanBanQuyTrinh = (ma: string, maMoi: string, ten: string) =>
  goiApi<QuyTrinhMauChiTiet>(`/quy-trinh-mau/${ma}/nhan-ban`, { method: 'POST', body: { ma: maMoi, ten } })
export const suaQuyTrinh = (
  ma: string,
  dl: { ten?: string; canCu?: string; hinhThuc?: HinhThuc; buoc?: BuocMau[] },
) => goiApi<QuyTrinhMauChiTiet>(`/quy-trinh-mau/${ma}`, { method: 'PUT', body: dl })
export const xoaQuyTrinh = (ma: string) =>
  goiApi<{ ok: true }>(`/quy-trinh-mau/${ma}/xoa`, { method: 'POST' })
