/** Xử lý văn bản (ADR-0009) — gọi API GDOS; GDOS gọi FOXAI Native. */
import type {
  KetNoiDong,
  KetQuaKiemTraKetNoi,
  TrangThaiXuLyVanBan,
  VanBanChiTiet,
  VanBanDong,
} from '@gdos/shared'
import { queryOptions } from '@tanstack/react-query'
import { goiApi, taiLenTep } from './http'

export const KHOA_VAN_BAN = ['van-ban'] as const

/** Văn bản còn đang chạy → hỏi lại mỗi 3 giây cho tới khi xong. */
const dangChay = (t: string) => t === 'cho' || t === 'dang-xu-ly'

export const truyVanVanBan = queryOptions({
  queryKey: [...KHOA_VAN_BAN, 'ds'],
  queryFn: () => goiApi<VanBanDong[]>('/van-ban'),
  refetchInterval: (q) => (q.state.data?.some((d) => dangChay(d.trangThai)) ? 3000 : false),
})

export const truyVanChiTietVanBan = (id: string) =>
  queryOptions({
    queryKey: [...KHOA_VAN_BAN, id],
    queryFn: () => goiApi<VanBanChiTiet>(`/van-ban/${id}`),
    refetchInterval: (q) => (q.state.data && dangChay(q.state.data.trangThai) ? 3000 : false),
  })

export const truyVanTrangThaiVanBan = queryOptions({
  queryKey: [...KHOA_VAN_BAN, 'trang-thai'],
  queryFn: () => goiApi<TrangThaiXuLyVanBan>('/van-ban/trang-thai'),
})

export const taiLenVanBan = (du: FormData) => taiLenTep<VanBanChiTiet>('/van-ban', du)
export const chayLaiVanBan = (id: string) =>
  goiApi<VanBanChiTiet>(`/van-ban/${id}/chay-lai`, { method: 'POST' })
export const suaTomTat = (id: string, tomTat: string) =>
  goiApi<VanBanChiTiet>(`/van-ban/${id}/tom-tat`, { method: 'PATCH', body: { tomTat } })

export const truyVanKetNoi = queryOptions({
  queryKey: ['ket-noi'],
  queryFn: () => goiApi<KetNoiDong[]>('/ket-noi'),
})
export const kiemTraKetNoi = (ma: string) =>
  goiApi<KetQuaKiemTraKetNoi>(`/ket-noi/${ma}/kiem-tra`, { method: 'POST' })
