import { Body, Controller, Get, Inject, Put } from '@nestjs/common'
import { CanQuyen, CongKhai, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
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
  @CanQuyen('QT_DANG_NHAP.READ', 'QT_HIEN_THI.READ')
  xem(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.xem(nd)
  }

  @Put('bao-mat')
  @CanQuyen('QT_DANG_NHAP.UPDATE')
  ghiBaoMat(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiBaoMat(nd, than)
  }

  @Put('nhan-dien')
  @CanQuyen('QT_HIEN_THI.UPDATE')
  ghiNhanDien(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.ghiNhanDien(nd, than)
  }
}
