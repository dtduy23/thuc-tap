/**
 * VÉ ĐĂNG NHẬP (access token) — khối JSON có chữ ký HMAC-SHA256, sống 15 phút.
 *
 * Không dùng JWT đầy đủ: JWT cho người gửi TỰ KHAI thuật toán (`alg`) trong vé —
 * gốc của cả họ lỗ hổng "alg: none" / nhầm thuật toán. Chỉ API của GDOS đọc vé
 * này, nên một thuật toán cố định là đủ và không có gì để khai sai.
 *
 * Vé mang sẵn phân công, nên mỗi request không phải hỏi database để tính quyền.
 * Đánh đổi: đổi phân công / khóa tài khoản có hiệu lực chậm tối đa bằng hạn vé
 * (lúc vé được làm mới). Hạn vé do quản trị đặt ở Cấu hình hệ thống.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { MA_VAI, type MaVai, type PhanCong } from '@gdos/shared'

export interface NoiDungVe {
  /** Mã tài khoản. */
  tk: string
  /** Các đơn vị trong phạm vi dữ liệu (đơn vị của tài khoản + cấp dưới). */
  dv: string[]
  /** Cờ quản trị. */
  qt: boolean
  /** Phân công: vai + phạm vi (null = tất cả). */
  pc: { v: MaVai; p: string[] | null }[]
  /** Phải đổi mật khẩu trước khi làm việc (mật khẩu do quản trị cấp). Vắng = không. */
  dmk?: boolean
  /** Hết hạn — giây kể từ 1970. */
  het: number
}

const ky = (than: string, khoa: string) => createHmac('sha256', khoa).update(than).digest()

export function kyVe(nd: NoiDungVe, khoa: string): string {
  const than = Buffer.from(JSON.stringify(nd)).toString('base64url')
  return `${than}.${ky(than, khoa).toString('base64url')}`
}

const laChuoi = (x: unknown): x is string => typeof x === 'string'

/** Vé hỏng, bị sửa, sai khóa hay hết hạn → null. Không bao giờ ném lỗi. */
export function docVe(ve: string, khoa: string, bayGioMs = Date.now()): NoiDungVe | null {
  const [than, chuKy, thua] = ve.split('.')
  if (!than || !chuKy || thua !== undefined) return null

  const mongDoi = ky(than, khoa)
  const nhan = Buffer.from(chuKy, 'base64url')
  if (nhan.length !== mongDoi.length || !timingSafeEqual(nhan, mongDoi)) return null

  let nd: unknown
  try {
    nd = JSON.parse(Buffer.from(than, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  // Chữ ký đúng thì nội dung do chính ta tạo — vẫn kiểm hình dạng, phòng khi đổi
  // định dạng vé mà còn vé cũ đang lưu hành.
  const v = nd as Partial<NoiDungVe>
  const hopLe =
    laChuoi(v.tk) &&
    Array.isArray(v.dv) &&
    v.dv.every(laChuoi) &&
    typeof v.qt === 'boolean' &&
    Array.isArray(v.pc) &&
    v.pc.every((p) => MA_VAI.includes(p.v) && (p.p === null || (Array.isArray(p.p) && p.p.every(laChuoi)))) &&
    typeof v.het === 'number' &&
    (v.dmk === undefined || typeof v.dmk === 'boolean')
  if (!hopLe) return null
  if (v.het! * 1000 <= bayGioMs) return null
  return v as NoiDungVe
}

/** Phân công trong vé → dạng `tinhQuyen()` cần. */
export const phanCongTuVe = (nd: NoiDungVe): PhanCong[] =>
  nd.pc.map((p) => ({ vai: p.v, phamVi: p.p ?? 'tat-ca' }))
