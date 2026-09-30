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
import { KICH_THUOC_VAN_BAN_TOI_DA, type KetNoiDong, type KetQuaKiemTraKetNoi } from '@gdos/shared'
import type { Response } from 'express'
import { maUuid } from '../chung/kiem-than.js'
import type { TepTaiLen } from '../du-an/ho-so.service.js'
import { KET_NOI_NATIVE, type KetNoiNative } from '../native/ket-noi-native.js'
import { LienKetNativeService } from '../native/lien-ket.service.js'
import { CanQuyen, ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { VanBanService } from './van-ban.service.js'

/** Tác nghiệp › Xử lý văn bản (ADR-0009). Quyền VAN_BAN.*; gọi Native còn cần tài khoản đã liên kết. */
@Controller('van-ban')
export class VanBanController {
  constructor(@Inject(VanBanService) private readonly dv: VanBanService) {}

  @Get()
  @CanQuyen('VAN_BAN.READ')
  danhSach(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.danhSach(nd)
  }

  /** Đang nối Native kiểu gì, tài khoản đã liên kết chưa — để màn hiện đúng thông báo. */
  @Get('trang-thai')
  @CanQuyen('VAN_BAN.READ')
  trangThai(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.trangThai(nd)
  }

  @Post()
  @CanQuyen('VAN_BAN.CREATE')
  @UseInterceptors(FileInterceptor('tep', { limits: { fileSize: KICH_THUOC_VAN_BAN_TOI_DA, files: 1 } }))
  taiLen(@NguoiDung() nd: NguoiDungPhien, @UploadedFile() tep: TepTaiLen | undefined, @Body() than: unknown) {
    return this.dv.taiLen(nd, tep, than)
  }

  @Get(':id')
  @CanQuyen('VAN_BAN.READ')
  chiTiet(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.chiTiet(nd, maUuid(id))
  }

  @Post(':id/chay-lai')
  @HttpCode(200)
  @CanQuyen('VAN_BAN.UPDATE')
  chayLai(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.chayLai(nd, maUuid(id))
  }

  @Patch(':id/tom-tat')
  @CanQuyen('VAN_BAN.UPDATE')
  suaTomTat(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.suaTomTat(nd, maUuid(id), than)
  }

  @Get(':id/tep')
  @CanQuyen('VAN_BAN.READ')
  async tep(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Res() res: Response) {
    const t = await this.dv.moTep(nd, maUuid(id))
    const khongDau = t.ten
      .normalize('NFD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/"/g, '')
    res.setHeader('Content-Type', t.loai === 'application/pdf' ? t.loai : 'application/octet-stream')
    res.setHeader('Content-Length', String(t.kichThuoc))
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
      'Content-Disposition',
      `${t.loai === 'application/pdf' ? 'inline' : 'attachment'}; filename="${khongDau || 'tep'}"; filename*=UTF-8''${encodeURIComponent(t.ten)}`,
    )
    t.noiDung.pipe(res)
  }
}

/** Quản trị › Kết nối › Dịch vụ nền tảng — hệ thống GDOS gọi tới và trạng thái. */
@Controller('ket-noi')
export class KetNoiController {
  constructor(@Inject(KET_NOI_NATIVE) private readonly native: KetNoiNative) {}

  @Get()
  @CanQuyen('QT_DICH_VU.READ')
  danhSach(): KetNoiDong[] {
    return [
      {
        ma: 'foxai-native',
        ten: 'FOXAI Native — Document Service',
        cheDo: this.native.cheDo,
        diaChi: this.native.diaChi,
        moTa: this.native.moTa,
      },
    ]
  }

  @Post(':ma/kiem-tra')
  @HttpCode(200)
  @CanQuyen('QT_DICH_VU.READ')
  async kiemTra(@Param('ma') ma: string): Promise<KetQuaKiemTraKetNoi> {
    const batDau = Date.now()
    const kq =
      ma === 'foxai-native' ? await this.native.kiemTra() : { ok: false, thongDiep: 'Không có kết nối này.' }
    return { ma, ...kq, msPhanHoi: Date.now() - batDau, luc: new Date().toISOString() }
  }
}

/**
 * Liên kết tài khoản FOXAI Native của CHÍNH người đang đăng nhập (ADR-0009) — Cài đặt
 * cá nhân. Ai đăng nhập GDOS cũng tự liên kết / hủy được cho mình, không cho người khác.
 */
@Controller('native/lien-ket')
export class LienKetNativeController {
  constructor(@Inject(LienKetNativeService) private readonly dv: LienKetNativeService) {}

  @Get()
  @ChiCanDangNhap()
  trangThai(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.trangThai(nd)
  }

  @Post()
  @HttpCode(200)
  @ChiCanDangNhap()
  lienKet(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.lienKet(nd, than)
  }

  @Post('huy')
  @HttpCode(200)
  @ChiCanDangNhap()
  huy(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.huy(nd)
  }
}
