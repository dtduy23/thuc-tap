/**
 * Gọi API Dự án. Mọi thao tác ghi trả về HỒ SƠ mới — ghi thẳng vào bộ nhớ đệm,
 * màn vẽ lại một lần, không phải tải lại.
 */
import type {
  DuAnDong,
  GiaTriDanhMuc,
  HoSoDuAn,
  LocDuAn,
  QuyTrinhMauDong,
  TaiKhoanDanhBa,
  VaiTroThanhVien,
} from '@gdos/shared'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { goiApi, taiLenTep } from './http'

export const KHOA_DU_AN = ['du-an'] as const

export const truyVanDanhSachDuAn = (loc: LocDuAn) =>
  queryOptions({
    queryKey: [...KHOA_DU_AN, 'ds', loc],
    queryFn: () => goiApi<DuAnDong[]>(`/du-an?loc=${loc}`),
  })

export const truyVanHoSo = (id: string) =>
  queryOptions({
    queryKey: [...KHOA_DU_AN, 'ho-so', id],
    queryFn: () => goiApi<HoSoDuAn>(`/du-an/${id}`),
  })

export const truyVanChuDauTu = queryOptions({
  queryKey: [...KHOA_DU_AN, 'chu-dau-tu'],
  queryFn: () => goiApi<{ id: string; ten: string; cap: string }[]>('/du-an/chu-dau-tu'),
  staleTime: 5 * 60_000,
})

export const truyVanQuyTrinhMau = queryOptions({
  queryKey: ['quy-trinh-mau'],
  queryFn: () => goiApi<QuyTrinhMauDong[]>('/quy-trinh-mau'),
  staleTime: 5 * 60_000,
})

export const truyVanDanhMuc = (loai: GiaTriDanhMuc['loai']) =>
  queryOptions({
    queryKey: ['danh-muc', loai],
    queryFn: () => goiApi<GiaTriDanhMuc[]>(`/danh-muc?loai=${loai}`),
    staleTime: 5 * 60_000,
  })

export const timDanhBa = (tim: string, cap?: string) =>
  goiApi<TaiKhoanDanhBa[]>(`/danh-ba?tim=${encodeURIComponent(tim)}${cap ? `&cap=${cap}` : ''}`)

export interface TaoDuAn {
  ma?: string
  ten: string
  donViId: string
  quyTrinhMa: string
  loaiChi: string
  nhomDuAn?: string
  linhVucId?: string
  tongMuc: number
  ngayBatDau: string
  canCu?: string
}

export const taoDuAn = (dl: TaoDuAn) => goiApi<HoSoDuAn>('/du-an', { method: 'POST', body: dl })

/** Ghi hồ sơ mới vào bộ nhớ đệm; danh sách thì đánh dấu cũ để lần sau tải lại. */
export function capNhatHoSo(qc: QueryClient, hs: HoSoDuAn) {
  qc.setQueryData(truyVanHoSo(hs.id).queryKey, hs)
  void qc.invalidateQueries({ queryKey: [...KHOA_DU_AN, 'ds'] })
}

export const suaDuAn = (id: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}`, { method: 'PATCH', body: dl })

export type ThaoTacBuoc = 'hoan-thanh' | 'bo-hoan-thanh' | 'bo-qua' | 'khoi-phuc' | 'gui' | 'xac-nhan'

export const thaoTacBuoc = (id: string, buocId: string, tt: ThaoTacBuoc, body?: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/buoc/${buocId}/${tt}`, { method: 'POST', body: body ?? {} })

export const suaBuoc = (id: string, buocId: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/buoc/${buocId}`, { method: 'PATCH', body: dl })

export const themThanhVien = (id: string, taiKhoanId: string, vaiTro: VaiTroThanhVien) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/thanh-vien`, { method: 'POST', body: { taiKhoanId, vaiTro } })

export const boThanhVien = (id: string, tvId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/thanh-vien/${tvId}/bo`, { method: 'POST' })

export const themBuoc = (id: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/buoc`, { method: 'POST', body: dl })

export const xoaBuoc = (id: string, buocId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/buoc/${buocId}/xoa`, { method: 'POST' })

export const chotKeHoach = (id: string, lyDo: string, canCu: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/chot-ke-hoach`, { method: 'POST', body: { lyDo, canCu: canCu || null } })

// ── Văn bản, vốn, giải ngân, vướng mắc ────────────────────────────────────

export const taiLenVanBan = (id: string, du: FormData) => taiLenTep<HoSoDuAn>(`/du-an/${id}/van-ban`, du)
export const duongDanTaiVe = (id: string, vbId: string) => `/api/du-an/${id}/van-ban/${vbId}/tai`
export const xoaVanBan = (id: string, vbId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/van-ban/${vbId}/xoa`, { method: 'POST' })

export const themVon = (id: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/von`, { method: 'POST', body: dl })
export const suaVon = (id: string, vonId: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/von/${vonId}`, { method: 'PATCH', body: dl })
export const xoaVon = (id: string, vonId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/von/${vonId}/xoa`, { method: 'POST' })

export const themGiaiNgan = (id: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/giai-ngan`, { method: 'POST', body: dl })
export const xoaGiaiNgan = (id: string, gnId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/giai-ngan/${gnId}/xoa`, { method: 'POST' })

export const neuVuongMac = (id: string, dl: Record<string, unknown>) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/vuong-mac`, { method: 'POST', body: dl })
export const giaiQuyetVuongMac = (id: string, vmId: string, ngay: string, ketQua: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/vuong-mac/${vmId}/giai-quyet`, { method: 'POST', body: { ngay, ketQua } })
export const moLaiVuongMac = (id: string, vmId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/vuong-mac/${vmId}/mo-lai`, { method: 'POST' })
export const xoaVuongMac = (id: string, vmId: string) =>
  goiApi<HoSoDuAn>(`/du-an/${id}/vuong-mac/${vmId}/xoa`, { method: 'POST' })
