/**
 * Nhận dạng chứng từ (OCR) — kết quả GDOS đã lấy về từ FOXAI Native.
 * Trang nào cần dữ liệu OCR thì dùng `truyVanChungTuOcr(<mã loại>)` (dữ liệu thô) hoặc
 * thành phần `<BangChungTuOcr loai="…" />` (bảng dựng sẵn theo định nghĩa của loại).
 */
import type { ChungTuOcr, KetQuaDongBoLoaiOcr, KetQuaLayVeOcr, LoaiChungTuOcr } from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi } from './http'

export const KHOA_OCR = ['ocr'] as const

/** Mọi loại chứng từ đã chụp từ Native (kèm định nghĩa trường, bảng). */
export const truyVanLoaiOcr = queryOptions({
  queryKey: [...KHOA_OCR, 'loai'],
  queryFn: () => goiApi<LoaiChungTuOcr[]>('/ocr/loai'),
})

/** Chứng từ đã lấy về của một loại; bỏ trống mã = mọi loại. */
export const truyVanChungTuOcr = (loai?: string) =>
  queryOptions({
    queryKey: [...KHOA_OCR, 'chung-tu', loai ?? ''],
    queryFn: () => goiApi<ChungTuOcr[]>(`/ocr/chung-tu${loai ? `?loai=${encodeURIComponent(loai)}` : ''}`),
  })

export const dongBoLoaiOcr = () => goiApi<KetQuaDongBoLoaiOcr>('/ocr/loai/dong-bo', { method: 'POST' })
export const batLoaiOcr = (ma: string, bat: boolean) =>
  goiApi<LoaiChungTuOcr[]>(`/ocr/loai/${encodeURIComponent(ma)}`, { method: 'PATCH', body: { bat } })
export const layVeOcr = () => goiApi<KetQuaLayVeOcr>('/ocr/lay-ve', { method: 'POST' })
