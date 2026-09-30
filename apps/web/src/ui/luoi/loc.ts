/**
 * Lõi của LƯỚI DANH SÁCH — hàm thuần: lọc theo cột (toán tử), tìm tổng, sắp xếp,
 * thứ tự cột. Theo "Chuẩn lưới danh sách" của PRM (docs/tieu-chuan-luoi.md).
 */
import type { ReactNode } from 'react'

export type KieuCot = 'chu' | 'so' | 'ngay' | 'danh-muc'

export interface CotLuoi<T> {
  id: string
  nhan: string
  kieu: KieuCot
  /** Giá trị THÔ để lọc, sắp, xuất Excel. Ngày: YYYY-MM-DD. Danh mục: mã. */
  giaTri: (d: T) => string | number | null
  /** Cách vẽ ô — vắng thì in giá trị (danh mục in nhãn). */
  hien?: (d: T) => ReactNode
  /** Danh mục: các lựa chọn (vắng thì lấy từ dữ liệu). */
  luaChon?: readonly { giaTri: string; nhan: string }[]
  /** Bề rộng mặc định (px). */
  rong?: number
  /** Không ẩn được (lưới hỏng nếu thiếu). */
  batBuoc?: boolean
  /** Ẩn khi chưa chỉnh gì. */
  an?: boolean
  /** Cột số: cộng ở dòng tổng. */
  cong?: boolean
  /** Cột thao tác (nút): không lọc, không sắp, không xuất Excel. */
  khongLoc?: boolean
}

export type ToanTuChu = 'chua' | 'khong-chua' | 'bang' | 'khong-bang' | 'bat-dau' | 'ket-thuc'
export type ToanTuSo = 'bang' | 'lon-hon' | 'lon-hon-bang' | 'nho-hon' | 'nho-hon-bang'

export const TOAN_TU_CHU: readonly { gt: ToanTuChu; nhan: string }[] = [
  { gt: 'chua', nhan: 'Chứa' },
  { gt: 'khong-chua', nhan: 'Không chứa' },
  { gt: 'bang', nhan: 'Bằng' },
  { gt: 'khong-bang', nhan: 'Không bằng' },
  { gt: 'bat-dau', nhan: 'Bắt đầu bằng' },
  { gt: 'ket-thuc', nhan: 'Kết thúc bằng' },
]
export const TOAN_TU_SO: readonly { gt: ToanTuSo; nhan: string }[] = [
  { gt: 'bang', nhan: '= Bằng' },
  { gt: 'lon-hon', nhan: '> Lớn hơn' },
  { gt: 'lon-hon-bang', nhan: '≥ Lớn hơn hoặc bằng' },
  { gt: 'nho-hon', nhan: '< Nhỏ hơn' },
  { gt: 'nho-hon-bang', nhan: '≤ Nhỏ hơn hoặc bằng' },
]

export type LocCot =
  | { kieu: 'chu'; tt: ToanTuChu; gt: string }
  | { kieu: 'so'; tt: ToanTuSo; gt: string }
  | { kieu: 'ngay'; tu: string; den: string }
  | { kieu: 'danh-muc'; chon: string[] }

export function locRong(kieu: KieuCot): LocCot {
  if (kieu === 'chu') return { kieu, tt: 'chua', gt: '' }
  if (kieu === 'so') return { kieu, tt: 'bang', gt: '' }
  if (kieu === 'ngay') return { kieu, tu: '', den: '' }
  return { kieu, chon: [] }
}

export const dangBat = (l: LocCot | undefined): boolean =>
  !!l &&
  (l.kieu === 'ngay' ? !!(l.tu || l.den) : l.kieu === 'danh-muc' ? l.chon.length > 0 : l.gt.trim() !== '')

/** So khớp không dấu, không hoa thường: "hoa" tìm ra "Hòa". */
export const khongDau = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** "1.234,5" hoặc "1234.5" → số; không hiểu → null. */
export function docSo(s: string): number | null {
  const t = s.trim().replace(/\s/g, '')
  if (!t) return null
  const chuan = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  const n = Number(chuan)
  return Number.isFinite(n) ? n : null
}

export function khop(v: string | number | null, l: LocCot, nhanDanhMuc?: (gt: string) => string): boolean {
  if (!dangBat(l)) return true
  switch (l.kieu) {
    case 'chu': {
      const a = khongDau(String(v ?? ''))
      const b = khongDau(l.gt.trim())
      return {
        chua: a.includes(b),
        'khong-chua': !a.includes(b),
        bang: a === b,
        'khong-bang': a !== b,
        'bat-dau': a.startsWith(b),
        'ket-thuc': a.endsWith(b),
      }[l.tt]
    }
    case 'so': {
      const b = docSo(l.gt)
      if (b === null) return true
      if (v === null || v === '') return false
      const a = Number(v)
      return {
        bang: a === b,
        'lon-hon': a > b,
        'lon-hon-bang': a >= b,
        'nho-hon': a < b,
        'nho-hon-bang': a <= b,
      }[l.tt]
    }
    case 'ngay': {
      if (!v) return false
      const a = String(v).slice(0, 10)
      return (!l.tu || a >= l.tu) && (!l.den || a <= l.den)
    }
    case 'danh-muc':
      return (
        l.chon.includes(String(v ?? '')) || (!!nhanDanhMuc && l.chon.includes(nhanDanhMuc(String(v ?? ''))))
      )
  }
}

/** Chữ hiện của một ô (danh mục → nhãn) — dùng cho tìm tổng và xuất Excel. */
export function chuCua<T>(c: CotLuoi<T>, d: T): string {
  const v = c.giaTri(d)
  if (v === null) return ''
  if (c.kieu === 'danh-muc') return c.luaChon?.find((x) => x.giaTri === String(v))?.nhan ?? String(v)
  return String(v)
}

export interface SapXep {
  id: string
  tang: boolean
}

/** Lọc theo từng cột + tìm tổng (quét mọi cột đang hiện) + sắp xếp. */
export function locVaSap<T>(
  dong: readonly T[],
  cot: readonly CotLuoi<T>[],
  loc: Readonly<Record<string, LocCot>>,
  tim: string,
  sap: SapXep | null,
): T[] {
  const q = khongDau(tim.trim())
  const kq = dong.filter(
    (d) =>
      cot.every((c) => khop(c.giaTri(d), loc[c.id] ?? locRong(c.kieu))) &&
      (!q || cot.some((c) => khongDau(chuCua(c, d)).includes(q))),
  )
  const c = sap && cot.find((x) => x.id === sap.id)
  if (!c || !sap) return kq
  const huong = sap.tang ? 1 : -1
  return [...kq].sort((a, b) => {
    const x = c.giaTri(a)
    const y = c.giaTri(b)
    if (x === y) return 0
    if (x === null || x === '') return 1
    if (y === null || y === '') return -1
    return (
      (typeof x === 'number' && typeof y === 'number'
        ? x - y
        : chuCua(c, a).localeCompare(chuCua(c, b), 'vi')) * huong
    )
  })
}

/**
 * Áp thứ tự người dùng đã chọn lên bộ cột hiện có: id lạ (cột mới thêm) xếp cuối,
 * id không còn thì bỏ — thiết lập cũ KHÔNG BAO GIỜ làm mất cột mới.
 */
export function apThuTu(ids: readonly string[], thuTu: readonly string[]): string[] {
  const co = new Set(ids)
  const truoc = thuTu.filter((id) => co.has(id))
  return [...new Set([...truoc, ...ids])]
}

/** Kéo cột `tu` thả vào vị trí của `den`. */
export function keoTha(ids: readonly string[], tu: string, den: string): string[] {
  const kq = ids.filter((x) => x !== tu)
  const i = kq.indexOf(den)
  if (i < 0 || tu === den) return [...ids]
  kq.splice(ids.indexOf(tu) < ids.indexOf(den) ? i + 1 : i, 0, tu)
  return kq
}
