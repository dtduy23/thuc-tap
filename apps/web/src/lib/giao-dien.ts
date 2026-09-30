import { docTam, ghiTam } from './luu-tam'

const KHOA = 'gdos-giao-dien'
type GiaoDien = 'sang' | 'toi'

const dat = (g: GiaoDien | null) => {
  if (g) document.documentElement.setAttribute('data-theme', g === 'toi' ? 'dark' : 'light')
  else document.documentElement.removeAttribute('data-theme')
}

/** Gọi trước khi vẽ — không nháy trắng rồi mới chuyển tối. Chưa chọn thì theo hệ điều hành. */
export function apDungGiaoDien() {
  dat(docTam<GiaoDien | null>(KHOA, null))
}

export function doiGiaoDien() {
  const hienTai =
    document.documentElement.getAttribute('data-theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const moi: GiaoDien = hienTai === 'dark' ? 'sang' : 'toi'
  dat(moi)
  ghiTam(KHOA, moi)
}
