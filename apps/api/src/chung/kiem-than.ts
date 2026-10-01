/**
 * Kiểm thân request bằng tay. Thân request là `unknown` cho tới khi qua đây —
 * không tin kiểu TypeScript khai ở controller, vì người gửi gửi gì cũng được.
 */
import { BadRequestException } from '@nestjs/common'

const truong = (than: unknown, ten: string): unknown =>
  than !== null && typeof than === 'object' ? (than as Record<string, unknown>)[ten] : undefined

/** Chuỗi bắt buộc, không rỗng (sau khi cắt khoảng trắng nếu `cat`). */
export function chuoi(than: unknown, ten: string, toiDa = 256, cat = false): string {
  const tho = truong(than, ten)
  const v = typeof tho === 'string' && cat ? tho.trim() : tho
  if (typeof v !== 'string' || v.length === 0) throw new BadRequestException(`Thiếu trường "${ten}"`)
  if (v.length > toiDa) throw new BadRequestException(`Trường "${ten}" quá dài`)
  return v
}

/** Chuỗi không bắt buộc: vắng → undefined, null hoặc rỗng → null. */
export function chuoiHoacRong(than: unknown, ten: string, toiDa = 256): string | null | undefined {
  const v = truong(than, ten)
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  if (typeof v !== 'string') throw new BadRequestException(`Trường "${ten}" phải là chuỗi`)
  if (v.length > toiDa) throw new BadRequestException(`Trường "${ten}" quá dài`)
  return v.trim() || null
}

/** Chuỗi không bắt buộc nhưng nếu có thì không rỗng. */
export function chuoiTuyChon(than: unknown, ten: string, toiDa = 256): string | undefined {
  return truong(than, ten) === undefined ? undefined : chuoi(than, ten, toiDa, true)
}

export function coKhong(than: unknown, ten: string): boolean | undefined {
  const v = truong(than, ten)
  if (v === undefined) return undefined
  if (typeof v !== 'boolean') throw new BadRequestException(`Trường "${ten}" phải là true/false`)
  return v
}

export function mang(than: unknown, ten: string, toiDa = 50): unknown[] {
  const v = truong(than, ten)
  if (!Array.isArray(v)) throw new BadRequestException(`Trường "${ten}" phải là danh sách`)
  if (v.length > toiDa) throw new BadRequestException(`Trường "${ten}" quá nhiều phần tử`)
  return v
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Mã trong đường dẫn hoặc thân request. Sai dạng → 400 trước khi chạm database. */
export function maUuid(v: unknown, ten = 'id'): string {
  if (typeof v !== 'string' || !UUID.test(v)) throw new BadRequestException(`"${ten}" không hợp lệ`)
  return v
}

/** Ngày 'YYYY-MM-DD' bắt buộc. */
export function ngay(than: unknown, ten: string): string {
  const v = truong(than, ten)
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`)))
    throw new BadRequestException(`"${ten}" phải là ngày YYYY-MM-DD`)
  return v
}

/** Ngày không bắt buộc: vắng → undefined, null/rỗng → null. */
export function ngayHoacRong(than: unknown, ten: string): string | null | undefined {
  const v = truong(than, ten)
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  return ngay(than, ten)
}

/** Số nguyên trong khoảng; vắng → undefined. */
export function soNguyen(than: unknown, ten: string, min: number, max: number): number | undefined {
  const v = truong(than, ten)
  if (v === undefined) return undefined
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max)
    throw new BadRequestException(`"${ten}" phải là số nguyên từ ${min} đến ${max}`)
  return v
}

/** Một giá trị trong danh sách cho phép; vắng → undefined. */
export function motTrong<T extends string>(than: unknown, ten: string, choPhep: readonly T[]): T | undefined {
  const v = truong(than, ten)
  if (v === undefined) return undefined
  if (typeof v !== 'string' || !choPhep.includes(v as T))
    throw new BadRequestException(`"${ten}" phải là một trong: ${choPhep.join(', ')}`)
  return v as T
}
