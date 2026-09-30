import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { QuanLyDanhMucService } from './quan-ly.service.js'

/**
 * QUẢN LÝ danh mục và quy trình mẫu (thêm, sửa, xóa mềm). Quyền phụ thuộc loại
 * danh mục (lĩnh vực → Danh mục nghiệp vụ; nguồn vốn → Tầng 2 › Tham số nghiệp vụ)
 * nên kiểm trong service; guard ở đây chỉ đòi đăng nhập.
 */
@Controller()
export class QuanLyDanhMucController {
  constructor(@Inject(QuanLyDanhMucService) private readonly dv: QuanLyDanhMucService) {}

  @Get('quan-ly-danh-muc')
  @ChiCanDangNhap()
  danhSach(@NguoiDung() nd: NguoiDungPhien, @Query('loai') loai?: string) {
    return this.dv.danhSach(nd, loai)
  }

  @Post('quan-ly-danh-muc')
  @ChiCanDangNhap()
  them(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.them(nd, than)
  }

  @Patch('quan-ly-danh-muc/:id')
  @ChiCanDangNhap()
  sua(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.sua(nd, id, than)
  }

  @Post('quan-ly-danh-muc/:id/xoa')
  @HttpCode(200)
  @ChiCanDangNhap()
  xoa(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.xoa(nd, id)
  }

  /** Chi tiết một quy trình mẫu kèm các bước — ai đăng nhập cũng xem (dùng khi tạo dự án). */
  @Get('quy-trinh-mau/:ma')
  @ChiCanDangNhap()
  quyTrinh(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    return this.dv.quyTrinh(nd, ma)
  }

  @Post('quy-trinh-mau/:ma/nhan-ban')
  @ChiCanDangNhap()
  nhanBan(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    return this.dv.nhanBan(nd, ma, than)
  }

  @Put('quy-trinh-mau/:ma')
  @ChiCanDangNhap()
  suaQuyTrinh(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    return this.dv.suaQuyTrinh(nd, ma, than)
  }

  @Post('quy-trinh-mau/:ma/xoa')
  @HttpCode(200)
  @ChiCanDangNhap()
  xoaQuyTrinh(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    return this.dv.xoaQuyTrinh(nd, ma)
  }
}
