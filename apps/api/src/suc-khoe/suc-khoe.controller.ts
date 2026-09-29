import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'

/**
 * Hai điểm kiểm tra tách riêng, theo đúng thông lệ liveness / readiness:
 *
 *   GET /api/health       tiến trình còn sống — KHÔNG chạm DB, để Docker
 *                         không giết container chỉ vì Postgres chậm một nhịp
 *   GET /api/health/deps  đủ điều kiện phục vụ chưa — hỏi từng phụ thuộc,
 *                         thiếu cái nào trả 503 và nói rõ cái nào
 */
@Controller('health')
export class SucKhoeController {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
  ) {}

  @Get()
  song() {
    return { trangThai: 'ok', phienBan: this.cauHinh.phienBan, thoiGian: new Date().toISOString() }
  }

  @Get('deps')
  async phuThuoc() {
    const postgres = await this.csdl.kiemTra()
    const ketQua = { trangThai: postgres === 'ok' ? 'ok' : 'loi', phuThuoc: { postgres } }
    if (postgres !== 'ok') throw new ServiceUnavailableException(ketQua)
    return ketQua
  }
}
