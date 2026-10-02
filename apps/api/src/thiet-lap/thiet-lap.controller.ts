import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common'
import { CanMotTrongQuyen, CanQuyen, CongKhai, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { ThietLapService } from './thiet-lap.service.js'

@Controller('cau-hinh')
export class ThietLapController {
  constructor(@Inject(ThietLapService) private readonly dv: ThietLapService) {}

  /** Tên hiển thị + độ dài mật khẩu tối thiểu — màn đăng nhập cần trước khi biết là ai. */
  @Get('cong-khai')
  @CongKhai()
  congKhai() {
    return this.dv.congKhai()
  }

  @Get()
  @CanMotTrongQuyen('QT_DANG_NHAP.READ', 'QT_HIEN_THI.READ', 'QT_CANH_BAO.READ', 'QT_PHE_DUYET.READ')
  xem(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.xem(nd)
  }

  @Put('bao-mat')
  @CanQuyen('QT_DANG_NHAP.UPDATE')
  ghiBaoMat(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiBaoMat(nd, than)
  }

  @Put('canh-bao')
  @CanQuyen('QT_CANH_BAO.UPDATE')
  ghiNguong(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiNguong(nd, than)
  }

  @Put('trang-dau')
  @CanQuyen('QT_HIEN_THI.UPDATE')
  ghiTrangDau(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiTrangDau(nd, than)
  }

  @Put('luong-duyet/:ma')
  @CanQuyen('QT_PHE_DUYET.UPDATE')
  ghiLuongDuyet(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    return this.dv.ghiLuongDuyet(nd, ma, than)
  }

  @Put('nhan-dien')
  @CanQuyen('QT_HIEN_THI.UPDATE')
  ghiNhanDien(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiNhanDien(nd, than)
  }
}
