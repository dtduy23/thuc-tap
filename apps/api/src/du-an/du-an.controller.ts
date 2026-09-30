import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query } from '@nestjs/common'
import { LOC_DU_AN, type LocDuAn } from '@gdos/shared'
import { maUuid } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { DongGopDuAnService } from './dong-gop.service.js'
import { DuAnService } from './du-an.service.js'

/**
 * Dự án. Guard chặn theo QUYỀN VAI (DU_AN.*); service chặn theo VỊ TRÍ trên
 * từng dự án (chủ đầu tư sửa, thành viên ngoài đơn vị chỉ gửi); RLS chặn lần cuối.
 * Mọi thao tác ghi trả về hồ sơ mới — web vẽ lại một lần, không đoán.
 */
@Controller('du-an')
export class DuAnController {
  constructor(
    @Inject(DuAnService) private readonly dv: DuAnService,
    @Inject(DongGopDuAnService) private readonly dongGop: DongGopDuAnService,
  ) {}

  @Get()
  @CanQuyen('DU_AN.READ')
  danhSach(@NguoiDung() nd: NguoiDungPhien, @Query('loc') loc?: string) {
    const l: LocDuAn = LOC_DU_AN.includes(loc as LocDuAn) ? (loc as LocDuAn) : 'tat-ca'
    return this.dv.danhSach(nd, l)
  }

  /** Lịch sử đôn đốc — đợt nào, gửi dự án nào, ai gửi. */
  @Get('don-doc')
  @CanQuyen('DU_AN.READ')
  lichSuDonDoc(@NguoiDung() nd: NguoiDungPhien) {
    return this.dongGop.lichSuDonDoc(nd)
  }

  /** Gửi đôn đốc (Điều 36) — cơ quan quản lý: quyền giao việc. */
  @Post('don-doc')
  @CanQuyen('DU_AN.ASSIGN')
  guiDonDoc(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dongGop.guiDonDoc(nd, than)
  }

  @Get('chu-dau-tu')
  @CanQuyen('DU_AN.CREATE')
  chonChuDauTu(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.chonChuDauTu(nd)
  }

  @Post()
  @CanQuyen('DU_AN.CREATE')
  tao(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.tao(nd, than)
  }

  @Get(':id')
  @CanQuyen('DU_AN.READ')
  hoSo(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.hoSo(nd, maUuid(id))
  }

  @Patch(':id')
  @CanQuyen('DU_AN.UPDATE')
  sua(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.sua(nd, maUuid(id), than)
  }

  @Post(':id/buoc/:buocId/hoan-thanh')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  hoanThanh(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('buocId') b: string,
    @Body() than: unknown,
  ) {
    return this.dv.hoanThanh(nd, maUuid(id), maUuid(b, 'buocId'), than)
  }

  @Post(':id/buoc/:buocId/bo-hoan-thanh')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  boHoanThanh(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('buocId') b: string) {
    return this.dv.boHoanThanh(nd, maUuid(id), maUuid(b, 'buocId'))
  }

  @Post(':id/buoc/:buocId/bo-qua')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  boQua(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('buocId') b: string,
    @Body() than: unknown,
  ) {
    return this.dv.boQua(nd, maUuid(id), maUuid(b, 'buocId'), than)
  }

  @Post(':id/buoc/:buocId/khoi-phuc')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  khoiPhuc(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('buocId') b: string) {
    return this.dv.khoiPhuc(nd, maUuid(id), maUuid(b, 'buocId'))
  }

  @Patch(':id/buoc/:buocId')
  @CanQuyen('DU_AN.UPDATE')
  suaBuoc(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('buocId') b: string,
    @Body() than: unknown,
  ) {
    return this.dv.suaBuoc(nd, maUuid(id), maUuid(b, 'buocId'), than)
  }

  /** Nhà thầu, tư vấn gửi cập nhật. Chỉ cần quyền XEM — quyền gửi do tư cách thành viên quyết định. */
  @Post(':id/buoc/:buocId/gui')
  @CanQuyen('DU_AN.READ')
  @HttpCode(200)
  gui(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('buocId') b: string,
    @Body() than: unknown,
  ) {
    return this.dv.gui(nd, maUuid(id), maUuid(b, 'buocId'), than)
  }

  /** Xác nhận: chuyên viên chủ đầu tư (UPDATE) hoặc lãnh đạo đơn vị (APPROVE) — service kiểm một trong hai. */
  @Post(':id/buoc/:buocId/xac-nhan')
  @CanQuyen('DU_AN.READ')
  @HttpCode(200)
  xacNhan(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('buocId') b: string,
    @Body() than: unknown,
  ) {
    return this.dv.xacNhan(nd, maUuid(id), maUuid(b, 'buocId'), than)
  }

  @Post(':id/buoc')
  @CanQuyen('DU_AN.UPDATE')
  themBuoc(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.themBuoc(nd, maUuid(id), than)
  }

  @Post(':id/buoc/:buocId/xoa')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  xoaBuoc(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('buocId') b: string) {
    return this.dv.xoaBuoc(nd, maUuid(id), maUuid(b, 'buocId'))
  }

  @Post(':id/chot-ke-hoach')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  chotKeHoach(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.chotKeHoach(nd, maUuid(id), than)
  }

  @Post(':id/thanh-vien')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  themThanhVien(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.themThanhVien(nd, maUuid(id), than)
  }

  @Post(':id/thanh-vien/:tvId/bo')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  boThanhVien(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('tvId') tv: string) {
    return this.dv.boThanhVien(nd, maUuid(id), maUuid(tv, 'tvId'))
  }
}
