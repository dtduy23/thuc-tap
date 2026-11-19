/** Báo cáo qua điểm gom /api/bao-cao (ADR-0007) — không biết nghiệp vụ cụ thể nào. */
import type { CheDoSoLieu, KetQuaBaoCao } from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi, taiVeTep } from './http'

/** Tham số trên URL màn báo cáo — vắng thì API điền mặc định. */
export interface ThamSoUrl {
  nam?: number
  tuNam?: number
  denNam?: number
  denNgay?: string
  linhVucId?: string
  /** Trục phân nhóm, cách nhau dấu phẩy. */
  nhom?: string
  ky?: string
  nguon?: CheDoSoLieu
}

export const chuoiThamSo = (ts: ThamSoUrl): string =>
  new URLSearchParams(
    Object.entries(ts)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString()

export const truyVanBaoCao = (ma: string, ts: ThamSoUrl) =>
  queryOptions({
    queryKey: ['bao-cao', ma, ts],
    queryFn: () => goiApi<KetQuaBaoCao>(`/bao-cao/${ma}?${chuoiThamSo(ts)}`),
  })

export const taiExcelBaoCao = (ma: string, ts: ThamSoUrl) =>
  taiVeTep(`/bao-cao/${ma}/excel?${chuoiThamSo(ts)}`, `${ma}.xlsx`)

export const taiExcelChecklist = (duAnId: string) =>
  taiVeTep(`/du-an/${duAnId}/checklist/excel`, 'checklist.xlsx')
