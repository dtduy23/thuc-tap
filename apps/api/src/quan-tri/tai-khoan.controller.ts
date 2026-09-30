import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Put } from '@nestjs/common'
import { maUuid } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { TaiKhoanService } from './tai-khoan.service.js'

@Controller('tai-khoan')
export class TaiKhoanController {
  constructor(@Inject(TaiKhoanService) private readonly dv: TaiKhoanService) {}

  @Get()
  @CanQuyen('QT_TAI_KHOAN.READ')
  danhSach(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.danhSach(nd)
  }

  @Post()
  @CanQuyen('QT_TAI_KHOAN.CREATE')
  tao(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.tao(nd, than)
  }

  @Patch(':id')
  @CanQuyen('QT_TAI_KHOAN.UPDATE')
  sua(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.sua(nd, maUuid(id), than)
  }

  @Put(':id/phan-cong')
  @CanQuyen('QT_TAI_KHOAN.ASSIGN')
  datPhanCong(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.datPhanCong(nd, maUuid(id), than)
  }

  @Post(':id/khoa')
  @CanQuyen('QT_TAI_KHOAN.UPDATE')
  @HttpCode(200)
  khoa(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.khoa(nd, maUuid(id))
  }

  @Post(':id/mo-khoa')
  @CanQuyen('QT_TAI_KHOAN.UPDATE')
  @HttpCode(200)
  moKhoa(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.moKhoa(nd, maUuid(id))
  }

  @Post(':id/dat-lai-mat-khau')
  @CanQuyen('QT_TAI_KHOAN.UPDATE')
  @HttpCode(200)
  datLaiMatKhau(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.datLaiMatKhau(nd, maUuid(id))
  }
}
