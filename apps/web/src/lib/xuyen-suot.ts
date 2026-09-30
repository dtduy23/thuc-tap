/** Gọi các điểm GOM của nhóm xuyên suốt (ADR-0007) — không biết nghiệp vụ cụ thể nào. */
import type { CanhBaoDef, DongCanhBao, MucViec } from '@gdos/shared'
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
