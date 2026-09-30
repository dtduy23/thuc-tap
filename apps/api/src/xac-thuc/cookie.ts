import type { CookieOptions } from 'express'
import { THOI_HAN_VE_GIAY } from './ve.js'

/** Vé đăng nhập — gửi kèm MỌI request tới /api. */
export const COOKIE_VE = 'gdos_ve'
/** Token làm mới — CHỈ gửi tới /api/xac-thuc, các route khác không bao giờ thấy nó. */
export const COOKIE_PHIEN = 'gdos_phien'

export const THOI_HAN_PHIEN_NGAY = 7

/**
 * HttpOnly: JavaScript trên trang không đọc được → XSS không lấy được phiên
 * (GDOS cũ để token 7 ngày trong localStorage). SameSite chặn phần lớn giả mạo
 * request từ trang lạ; phần còn lại do header X-GDOS (xem bao-ve.guard.ts).
 */
export const tuyChonCookieVe = (anToan: boolean): CookieOptions => ({
  httpOnly: true,
  secure: anToan,
  sameSite: 'lax',
  path: '/api',
  maxAge: THOI_HAN_VE_GIAY * 1000,
})

export const tuyChonCookiePhien = (anToan: boolean): CookieOptions => ({
  httpOnly: true,
  secure: anToan,
  sameSite: 'strict',
  path: '/api/xac-thuc',
  maxAge: THOI_HAN_PHIEN_NGAY * 24 * 3600 * 1000,
})

/** Đọc header Cookie. Viết tay cho hai cookie của mình — không cần cả một thư viện. */
export function docCookie(header: string | undefined): Record<string, string> {
  const kq: Record<string, string> = {}
  if (!header) return kq
  for (const phan of header.split(';')) {
    const i = phan.indexOf('=')
    if (i < 0) continue
    const ten = phan.slice(0, i).trim()
    try {
      kq[ten] = decodeURIComponent(phan.slice(i + 1).trim())
    } catch {
      // Giá trị mã hóa hỏng — bỏ qua cookie đó, không làm hỏng cả request.
    }
  }
  return kq
}
