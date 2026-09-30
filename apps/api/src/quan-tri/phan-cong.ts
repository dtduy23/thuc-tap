import { BadRequestException } from '@nestjs/common'
import { DANH_SACH_MODULE, kiemTraPhanCong, MA_VAI, type MaVai, type PhanCong } from '@gdos/shared'

/**
 * Đọc danh sách phân công từ thân request và kiểm bằng `kiemTraPhanCong()` —
 * CÙNG hàm web dùng để báo lỗi ngay trên form.
 */
export function docPhanCong(ds: unknown[]): PhanCong[] {
  const kq: PhanCong[] = []
  for (const x of ds) {
    const { vai, phamVi } = (x ?? {}) as { vai?: unknown; phamVi?: unknown }
    if (typeof vai !== 'string' || !MA_VAI.includes(vai as MaVai))
      throw new BadRequestException(`Vai "${String(vai)}" không có`)
    if (kq.some((p) => p.vai === vai)) throw new BadRequestException('Mỗi vai chỉ phân công một lần')
    let pv: PhanCong['phamVi']
    if (phamVi === 'tat-ca') pv = 'tat-ca'
    else if (Array.isArray(phamVi) && phamVi.every((m) => typeof m === 'string')) pv = [...new Set(phamVi)]
    else throw new BadRequestException('Phạm vi phân công phải là "tat-ca" hoặc danh sách phân hệ')
    const pc: PhanCong = { vai: vai as MaVai, phamVi: pv }
    const loi = kiemTraPhanCong(pc, DANH_SACH_MODULE)
    if (loi.length) throw new BadRequestException(loi.join('; '))
    kq.push(pc)
  }
  return kq
}
