/**
 * GỌI RA NGUỒN API của khách (Tầng 2 › Nguồn dữ liệu vào). Địa chỉ do quản trị nhập nên phải
 * chặn việc dùng máy chủ GDOS để dò mạng của chính nó (SSRF):
 *   - chỉ http(s); production chỉ https;
 *   - không gọi vào chính máy chủ (loopback), địa chỉ link-local / metadata của hạ tầng;
 *   - kiểm cả địa chỉ IP mà tên miền phân giải ra; không đi theo chuyển hướng;
 *   - có hạn giờ và trần kích thước phản hồi.
 * Mạng nội bộ (10.x, 192.168.x…) KHÔNG chặn: hệ thống của khách thường nằm trong mạng nội bộ.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { BadRequestException } from '@nestjs/common'

export const GOI_NGUON_NGOAI = Symbol('GOI_NGUON_NGOAI')

export interface PhanHoiNgoai {
  ma: number
  than: string
}
/** Gọi GET một địa chỉ đã qua kiểm, trả mã HTTP và thân (chữ). Test thay bằng bản giả. */
export type GoiNguonNgoai = (diaChi: string, headers: Record<string, string>) => Promise<PhanHoiNgoai>

const HET_GIO_MS = 20_000
export const THAN_TOI_DA = 2 * 1024 * 1024

/** IP không được gọi tới: loopback, chưa xác định, link-local (gồm metadata 169.254.169.254). */
export function laIpCam(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (isIP(v) === 4) {
    const [a, b] = v.split('.').map(Number) as [number, number]
    return a === 127 || a === 0 || (a === 169 && b === 254)
  }
  if (isIP(v) === 6) {
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')) return true
    const v4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v)?.[1]
    return v4 ? laIpCam(v4) : false
  }
  return false
}

/** Kiểm hình thức địa chỉ (không phân giải tên miền). Ném 400 kèm câu tiếng Việt. */
export function kiemDiaChiNguon(diaChi: string, laProduction: boolean): URL {
  let u: URL
  try {
    u = new URL(diaChi)
  } catch {
    throw new BadRequestException('Địa chỉ nguồn không hợp lệ')
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:')
    throw new BadRequestException('Địa chỉ nguồn phải là http(s)://')
  if (laProduction && u.protocol !== 'https:') throw new BadRequestException('Địa chỉ nguồn phải là https://')
  if (u.username || u.password)
    throw new BadRequestException('Không đặt tài khoản trong địa chỉ — dùng mục Xác thực')
  const ten = u.hostname.toLowerCase()
  if (ten === 'localhost' || ten.endsWith('.localhost') || laIpCam(ten))
    throw new BadRequestException('Không gọi được vào chính máy chủ GDOS hay địa chỉ nội bộ của hạ tầng')
  return u
}

/** Bản thật: kiểm địa chỉ + IP phân giải được, rồi GET. */
export function taoGoiNguonNgoai(laProduction: boolean): GoiNguonNgoai {
  return async (diaChi, headers) => {
    const u = kiemDiaChiNguon(diaChi, laProduction)
    if (isIP(u.hostname.replace(/^\[|\]$/g, '')) === 0) {
      const ds = await lookup(u.hostname, { all: true }).catch(() => {
        throw new BadRequestException(`Không phân giải được tên miền "${u.hostname}"`)
      })
      if (ds.some((d) => laIpCam(d.address)))
        throw new BadRequestException('Không gọi được vào chính máy chủ GDOS hay địa chỉ nội bộ của hạ tầng')
    }
    const res = await fetch(u, {
      headers: { Accept: 'application/json', ...headers },
      redirect: 'error',
      signal: AbortSignal.timeout(HET_GIO_MS),
    })
    const dai = Number(res.headers.get('content-length') ?? 0)
    if (dai > THAN_TOI_DA) throw new BadRequestException('Phản hồi của nguồn quá lớn (tối đa 2 MB)')
    const than = await res.text()
    if (than.length > THAN_TOI_DA) throw new BadRequestException('Phản hồi của nguồn quá lớn (tối đa 2 MB)')
    return { ma: res.status, than }
  }
}
