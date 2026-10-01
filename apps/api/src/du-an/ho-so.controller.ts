import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { KICH_THUOC_TEP_TOI_DA } from '@gdos/shared'
import type { Response } from 'express'
import { maUuid } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { HoSoDuAnService, type TepTaiLen } from './ho-so.service.js'

/** Loại tệp trình duyệt được HIỂN THỊ ngay; còn lại luôn tải về (không cho trình duyệt đoán). */
const XEM_DUOC = new Set(['application/pdf', 'image/png', 'image/jpeg'])

@Controller('du-an')
export class HoSoDuAnController {
  constructor(@Inject(HoSoDuAnService) private readonly dv: HoSoDuAnService) {}

  // ── Văn bản ──────────────────────────────────────────────────────────────

  @Post(':id/van-ban')
  @CanQuyen('DU_AN.UPDATE')
  @UseInterceptors(FileInterceptor('tep', { limits: { fileSize: KICH_THUOC_TEP_TOI_DA, files: 1 } }))
  taiLen(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @UploadedFile() tep: TepTaiLen | undefined,
    @Body() than: unknown,
  ) {
    return this.dv.taiLen(nd, maUuid(id), tep, than)
  }

  @Get(':id/van-ban/:vbId/tai')
  @CanQuyen('DU_AN.READ')
  async taiVe(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('vbId') vbId: string,
    @Res() res: Response,
  ) {
    const tep = await this.dv.moTep(nd, maUuid(id), maUuid(vbId, 'vbId'))
    const xem = XEM_DUOC.has(tep.loai)
    res.setHeader('Content-Type', xem ? tep.loai : 'application/octet-stream')
    res.setHeader('Content-Length', String(tep.kichThuoc))
    res.setHeader('X-Content-Type-Options', 'nosniff')
    // Tên tiếng Việt: filename* theo RFC 5987; filename thường là bản không dấu dự phòng.
    const khongDau = tep.ten
      .normalize('NFD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/"/g, '')
    res.setHeader(
      'Content-Disposition',
      `${xem ? 'inline' : 'attachment'}; filename="${khongDau || 'tep'}"; filename*=UTF-8''${encodeURIComponent(tep.ten)}`,
    )
    tep.noiDung.pipe(res)
  }

  @Patch(':id/van-ban/:vbId')
  @CanQuyen('DU_AN.UPDATE')
  suaVanBan(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('vbId') vb: string,
    @Body() than: unknown,
  ) {
    return this.dv.suaVanBan(nd, maUuid(id), maUuid(vb, 'vbId'), than)
  }

  @Post(':id/van-ban/:vbId/xoa')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  xoaVanBan(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('vbId') vb: string) {
    return this.dv.xoaVanBan(nd, maUuid(id), maUuid(vb, 'vbId'))
  }

  // ── Kế hoạch vốn ────────────────────────────────────────────────────────

  @Post(':id/von')
  @CanQuyen('DU_AN.UPDATE')
  themVon(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.themVon(nd, maUuid(id), than)
  }

  @Patch(':id/von/:vonId')
  @CanQuyen('DU_AN.UPDATE')
  suaVon(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('vonId') v: string,
    @Body() than: unknown,
  ) {
    return this.dv.suaVon(nd, maUuid(id), maUuid(v, 'vonId'), than)
  }

  @Post(':id/von/:vonId/xoa')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  xoaVon(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('vonId') v: string) {
    return this.dv.xoaVon(nd, maUuid(id), maUuid(v, 'vonId'))
  }

  // ── Giải ngân ───────────────────────────────────────────────────────────

  @Post(':id/giai-ngan')
  @CanQuyen('DU_AN.UPDATE')
  themGiaiNgan(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.themGiaiNgan(nd, maUuid(id), than)
  }

  @Patch(':id/giai-ngan/:gnId')
  @CanQuyen('DU_AN.UPDATE')
  suaGiaiNgan(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('gnId') g: string,
    @Body() than: unknown,
  ) {
    return this.dv.suaGiaiNgan(nd, maUuid(id), maUuid(g, 'gnId'), than)
  }

  @Post(':id/giai-ngan/:gnId/xoa')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  xoaGiaiNgan(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('gnId') g: string) {
    return this.dv.xoaGiaiNgan(nd, maUuid(id), maUuid(g, 'gnId'))
  }

  // ── Vướng mắc ───────────────────────────────────────────────────────────

  @Post(':id/vuong-mac')
  @CanQuyen('DU_AN.UPDATE')
  neuVuongMac(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.neuVuongMac(nd, maUuid(id), than)
  }

  @Patch(':id/vuong-mac/:vmId')
  @CanQuyen('DU_AN.UPDATE')
  phanTich(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('vmId') v: string,
    @Body() than: unknown,
  ) {
    return this.dv.phanTichVuongMac(nd, maUuid(id), maUuid(v, 'vmId'), than)
  }

  @Post(':id/vuong-mac/:vmId/giai-quyet')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  giaiQuyet(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('id') id: string,
    @Param('vmId') v: string,
    @Body() than: unknown,
  ) {
    return this.dv.giaiQuyetVuongMac(nd, maUuid(id), maUuid(v, 'vmId'), than)
  }

  @Post(':id/vuong-mac/:vmId/mo-lai')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  moLai(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('vmId') v: string) {
    return this.dv.moLaiVuongMac(nd, maUuid(id), maUuid(v, 'vmId'))
  }

  @Post(':id/vuong-mac/:vmId/xoa')
  @CanQuyen('DU_AN.UPDATE')
  @HttpCode(200)
  xoaVuongMac(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Param('vmId') v: string) {
    return this.dv.xoaVuongMac(nd, maUuid(id), maUuid(v, 'vmId'))
  }
}
