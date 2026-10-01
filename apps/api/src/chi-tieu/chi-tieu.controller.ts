import { Controller, Get, Inject } from '@nestjs/common'
import type { BangChiTieu } from '@gdos/shared'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { ChiTieuService } from './chi-tieu.service.js'

/** Điều hành › Chỉ tiêu điều hành — giá trị của bộ chỉ tiêu (danh mục ở @gdos/shared). */
@Controller('chi-tieu')
export class ChiTieuController {
  constructor(@Inject(ChiTieuService) private readonly dv: ChiTieuService) {}

  @Get()
  @CanQuyen('CHI_TIEU.READ')
  bang(@NguoiDung() nd: NguoiDungPhien): Promise<BangChiTieu> {
    return this.dv.bang(nd)
  }
}
