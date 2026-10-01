import { Controller, Get, Inject } from '@nestjs/common'
import type { BangChiTieu } from '@gdos/shared'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { ChiTieuService } from './chi-tieu.service.js'

/** Điều hành › Tổng quan điều hành + Chỉ tiêu theo lĩnh vực — giá trị của bộ chỉ tiêu (danh mục ở @gdos/shared). */
@Controller('chi-tieu')
export class ChiTieuController {
  constructor(@Inject(ChiTieuService) private readonly dv: ChiTieuService) {}

  @Get()
  // Cùng một bảng chỉ tiêu phục vụ hai module: Tổng quan điều hành và Chỉ tiêu theo lĩnh vực.
  @CanQuyen('TONG_QUAN.READ', 'CHI_TIEU.READ')
  bang(@NguoiDung() nd: NguoiDungPhien): Promise<BangChiTieu> {
    return this.dv.bang(nd)
  }
}
