/**
 * KHO TỆP — nơi giữ nội dung tệp đính kèm. Postgres chỉ giữ KHÓA của tệp.
 *
 * Mọi module dùng qua giao diện `KhoTep`, không đụng thẳng ổ đĩa hay MinIO, nên
 * đổi nơi lưu không phải sửa nghiệp vụ. Hiện có bản lưu vào THƯ MỤC (máy dev,
 * hoặc máy chủ gắn ổ đĩa). Bản MinIO làm ở Mốc 2 — cần máy có Docker để kiểm thật.
 *
 * Khóa tệp do API sinh (`du-an/<mã dự án>/<uuid>`), không bao giờ lấy từ tên tệp
 * người dùng gửi — tên gốc chỉ lưu trong database để hiện và đặt tên khi tải về.
 */
import { createReadStream } from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import type { Readable } from 'node:stream'

export interface KhoTep {
  ghi(khoa: string, noiDung: Buffer): Promise<void>
  mo(khoa: string): Promise<Readable>
}

export const KHO_TEP = Symbol('KHO_TEP')

const KHOA_HOP_LE = /^[a-z0-9-]+(\/[a-z0-9-]+)+$/

export class KhoTepThuMuc implements KhoTep {
  private readonly goc: string

  constructor(thuMuc: string) {
    this.goc = resolve(thuMuc)
  }

  /** Chặn đi ra ngoài thư mục gốc — dù khóa luôn do API sinh, phòng khi có lỗi ở chỗ khác. */
  private duongDan(khoa: string): string {
    if (!KHOA_HOP_LE.test(khoa)) throw new Error(`Khóa tệp không hợp lệ: "${khoa}"`)
    const p = resolve(this.goc, khoa)
    if (!p.startsWith(this.goc + sep)) throw new Error('Khóa tệp đi ra ngoài kho')
    return p
  }

  async ghi(khoa: string, noiDung: Buffer): Promise<void> {
    const p = this.duongDan(khoa)
    await mkdir(dirname(p), { recursive: true })
    // 'wx': không bao giờ ghi đè một tệp đã có.
    await writeFile(p, noiDung, { flag: 'wx' })
  }

  async mo(khoa: string): Promise<Readable> {
    const p = this.duongDan(khoa)
    await access(p)
    return createReadStream(p)
  }
}
