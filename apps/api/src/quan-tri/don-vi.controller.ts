import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common'
import { maUuid } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { DonViService } from './don-vi.service.js'

@Controller('don-vi')
export class DonViController {
  constructor(@Inject(DonViService) private readonly dv: DonViService) {}

  @Get()
  @CanQuyen('QT_DON_VI.READ')
  danhSach(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.danhSach(nd)
  }

  @Post()
  @CanQuyen('QT_DON_VI.CREATE')
  tao(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.tao(nd, than)
  }

  @Patch(':id')
  @CanQuyen('QT_DON_VI.UPDATE')
  sua(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.sua(nd, maUuid(id), than)
  }
}
