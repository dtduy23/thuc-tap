/** Xử lý văn bản (ADR-0009) — gọi API GDOS; GDOS gọi FOXAI Native. */
import type {
  KetNoiDong,
  KetQuaKiemTraKetNoi,
  LienKetNativeDong,
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

// ── Liên kết tài khoản FOXAI Native của chính mình (ADR-0009) ────────────────

export const truyVanLienKetNative = queryOptions({
  queryKey: ['native', 'lien-ket'],
  queryFn: () => goiApi<LienKetNativeDong>('/native/lien-ket'),
})
export const lienKetNative = (tenDangNhap: string, matKhau: string) =>
  goiApi<LienKetNativeDong>('/native/lien-ket', { method: 'POST', body: { tenDangNhap, matKhau } })
export const huyLienKetNative = () => goiApi<LienKetNativeDong>('/native/lien-ket/huy', { method: 'POST' })

export const xoaVanBan = (id: string) => goiApi<{ ok: true }>(`/van-ban/${id}/xoa`, { method: 'POST' })

const thoatHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Tải bản tóm tắt ra tệp .doc (Word mở được) — như màn của GDOS cũ. */
export async function taiTomTatDoc(id: string): Promise<'ok' | 'chua-co'> {
  const vb = await goiApi<VanBanChiTiet>(`/van-ban/${id}`)
  if (!vb.tomTat) return 'chua-co'
  const html =
    `<html><head><meta charset="utf-8"><title>${thoatHtml(vb.ten)}</title></head>` +
    `<body style="font-family:'Times New Roman';font-size:13pt">` +
    `<h2 style="text-align:center">BẢN TÓM TẮT VĂN BẢN</h2>` +
    `<p><b>Tên văn bản:</b> ${thoatHtml(vb.ten)}<br><b>Loại văn bản:</b> ${thoatHtml(vb.loai)}` +
    ` &nbsp;|&nbsp; <b>Người tạo:</b> ${thoatHtml(vb.nguoiTao ?? '')}</p><hr>` +
    `<p>${thoatHtml(vb.tomTat).replace(/\n/g, '<br>')}</p></body></html>`
  const url = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${vb.ten.slice(0, 60).replace(/[\\/:*?"<>|]/g, '')} - Tom tat.doc`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'ok'
}
