/**
 * Giao diện RIÊNG của từng người: tông màu + sáng/tối. Lưu ở máy (localStorage),
 * theo từng tài khoản — hai người dùng chung một máy vẫn giữ lựa chọn của mình.
 * Không phải dữ liệu nghiệp vụ nên không lưu lên máy chủ.
 */
import { docTam, ghiTam } from './luu-tam'

export const TONG_MAU = [
  {
    ma: 'nha-nuoc',
    ten: 'Xanh nhà nước',
    mo: 'Mặc định — navy và vàng kim, như PMS',
    mau: ['#14366b', '#c9a227'],
  },
  { ma: 'do-co', ten: 'Đỏ cờ', mo: 'Đỏ son và vàng', mau: ['#86171d', '#ffd64d'] },
  { ma: 'xanh-la', ten: 'Xanh lục', mo: 'Dịu mắt khi làm việc lâu', mau: ['#145235', '#5ccb91'] },
  { ma: 'xanh-duong', ten: 'Xanh dương', mo: 'Sáng, hiện đại', mau: ['#173c73', '#5b9bff'] },
  { ma: 'tim-than', ten: 'Tím than', mo: 'Trầm, trang nhã', mau: ['#34276a', '#b3a2f0'] },
] as const

export type MaTongMau = (typeof TONG_MAU)[number]['ma']
export type CheDo = 'theo-may' | 'sang' | 'toi'

export interface GiaoDien {
  tong: MaTongMau
  cheDo: CheDo
}

export const GIAO_DIEN_MAC_DINH: GiaoDien = { tong: 'nha-nuoc', cheDo: 'theo-may' }

/** Lựa chọn gần nhất trên máy này — dùng trước khi biết ai đăng nhập (màn đăng nhập). */
const KHOA_GAN_NHAT = 'gdos-giao-dien'
const khoaCua = (taiKhoanId: string) => `gdos-giao-dien:${taiKhoanId}`

export function hopLe(x: unknown): GiaoDien {
  const o = (x ?? {}) as Partial<Record<keyof GiaoDien, unknown>>
  const tong = TONG_MAU.find((t) => t.ma === o.tong)?.ma ?? GIAO_DIEN_MAC_DINH.tong
  const cheDo: CheDo = o.cheDo === 'sang' || o.cheDo === 'toi' ? o.cheDo : 'theo-may'
  return { tong, cheDo }
}

function ve(g: GiaoDien) {
  const html = document.documentElement
  html.setAttribute('data-tone', g.tong)
  if (g.cheDo === 'theo-may') html.removeAttribute('data-theme')
  else html.setAttribute('data-theme', g.cheDo === 'toi' ? 'dark' : 'light')
}

/** Gọi trước khi vẽ — không nháy màu mặc định rồi mới đổi. */
export function apDungGiaoDien() {
  ve(hopLe(docTam<unknown>(KHOA_GAN_NHAT, null)))
}

export function docGiaoDien(taiKhoanId: string): GiaoDien {
  return hopLe(docTam<unknown>(khoaCua(taiKhoanId), docTam<unknown>(KHOA_GAN_NHAT, null)))
}

/** Người dùng đã biết là ai: dùng lựa chọn của họ (chưa chọn thì giữ cái đang hiện). */
export function apDungChoNguoiDung(taiKhoanId: string) {
  const g = docGiaoDien(taiKhoanId)
  ve(g)
  ghiTam(KHOA_GAN_NHAT, g)
}

export function luuGiaoDien(taiKhoanId: string, g: GiaoDien) {
  ve(g)
  ghiTam(khoaCua(taiKhoanId), g)
  ghiTam(KHOA_GAN_NHAT, g)
}

/** Nút mặt trăng trên thanh trên: đổi nhanh sáng ↔ tối, giữ tông màu. */
export function doiSangToi(taiKhoanId: string) {
  const g = docGiaoDien(taiKhoanId)
  const dangToi =
    g.cheDo === 'toi' || (g.cheDo === 'theo-may' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  luuGiaoDien(taiKhoanId, { ...g, cheDo: dangToi ? 'sang' : 'toi' })
}
