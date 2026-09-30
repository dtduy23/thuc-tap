/** Gọi các điểm GOM của nhóm xuyên suốt (ADR-0007) — không biết nghiệp vụ cụ thể nào. */
import type { CanhBaoDef, DongCanhBao, GocNhinTongQuan, KhoiSoLieu, LoaiChiSo, MucViec } from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi } from './http'

export const truyVanCanhBao = (loai: CanhBaoDef['loai']) =>
  queryOptions({
    queryKey: ['canh-bao', loai],
    queryFn: () => goiApi<DongCanhBao[]>(`/canh-bao?loai=${loai}`),
  })

export const truyVanViecCuaToi = queryOptions({
  queryKey: ['viec-cua-toi'],
  queryFn: () => goiApi<MucViec[]>('/viec-cua-toi'),
})

export const truyVanTongQuan = (theo: GocNhinTongQuan) =>
  queryOptions({
    queryKey: ['tong-quan', theo],
    queryFn: () => goiApi<KhoiSoLieu[]>(`/tong-quan?theo=${theo}`),
  })

export const truyVanChiSo = (loai: LoaiChiSo) =>
  queryOptions({
    queryKey: ['chi-so', loai],
    queryFn: () => goiApi<KhoiSoLieu[]>(`/chi-so?loai=${loai}`),
  })
