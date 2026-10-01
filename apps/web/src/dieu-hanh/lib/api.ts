import { D } from '@/dieu-hanh/mocks/data'
import type { HoSoTthc, NhiemVu } from '@/dieu-hanh/mocks/types'

/**
 * Lớp đọc dữ liệu của các màn chép từ GDOS cũ. Hiện trả về DỮ LIỆU MẪU (`mocks/`) — chưa có
 * phân hệ nguồn. Khi có nguồn thật, chỉ thay phần thân các hàm ở đây — component không đổi.
 */

export const layHoSoTthc = (): Promise<HoSoTthc[]> => Promise.resolve(D.tthc)

export const layHoSoTheoId = (id: string): Promise<HoSoTthc | undefined> =>
  Promise.resolve(D.tthc.find((h) => h.id === id))

export const layNhiemVu = (): Promise<ReadonlyArray<NhiemVu>> => Promise.resolve(D.nhiemvu)

/** Khóa query dùng chung để invalidate sau khi ghi. */
export const KHOA = {
  hoSoTthc: ['ho-so-tthc'] as const,
  nhiemVu: ['nhiem-vu'] as const,
}

/** Dashboard Xã/Phường — dữ liệu mẫu tĩnh của 8 màn. */
export const layDashboardXaPhuong = () => import('@/dieu-hanh/mocks/xa-phuong')

export const KHOA_XA_PHUONG = ['dashboard-xa-phuong'] as const
