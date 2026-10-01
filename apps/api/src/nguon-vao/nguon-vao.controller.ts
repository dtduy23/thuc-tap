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
import type { Response } from 'express'
import { maUuid } from '../chung/kiem-than.js'
import type { TepTaiLen } from '../du-an/ho-so.service.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { headerTaiExcel } from '../xuyen-suot/bao-cao-chung.js'
import { KICH_THUOC_TEP_SO_LIEU, NguonVaoService } from './nguon-vao.service.js'

const TEP = () => FileInterceptor('tep', { limits: { fileSize: KICH_THUOC_TEP_SO_LIEU, files: 1 } })

/** Tầng 2 › Kết nối › Nguồn dữ liệu vào — nạp số liệu chỉ tiêu qua API và Excel (QT_NGUON_VAO). */
@Controller('nguon-vao')
export class NguonVaoController {
  constructor(@Inject(NguonVaoService) private readonly dv: NguonVaoService) {}

  // ── Nguồn API ──
  @Get('api')
  @CanQuyen('QT_NGUON_VAO.READ')
  dsNguon(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.dsNguon(nd)
  }

  @Post('api')
  @CanQuyen('QT_NGUON_VAO.CREATE')
  taoNguon(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.taoNguon(nd, than)
  }

  /** Gọi thử theo cấu hình đang soạn — không lưu, không ghi số liệu. */
  @Post('api/thu')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.UPDATE')
  thuNguon(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    return this.dv.thuNguon(nd, than)
  }

  @Patch('api/:id')
  @CanQuyen('QT_NGUON_VAO.UPDATE')
  suaNguon(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string, @Body() than: unknown) {
    return this.dv.suaNguon(nd, maUuid(id), than)
  }

  @Post('api/:id/xoa')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.DELETE')
  xoaNguon(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.xoaNguon(nd, maUuid(id))
  }

  @Post('api/:id/lay')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.UPDATE')
  layTuNguon(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.layTuNguon(nd, maUuid(id))
  }

  // ── Excel: tải mẫu → kiểm (không ghi) → nạp (tất cả hoặc không) ──
  @Get('excel/mau')
  @CanQuyen('QT_NGUON_VAO.READ')
  async tepMau(@Res() res: Response) {
    res.set(headerTaiExcel('Mau_nap_so_lieu_chi_tieu')).send(await this.dv.tepMau())
  }

  @Post('excel/kiem-tra')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.CREATE')
  @UseInterceptors(TEP())
  kiemTep(@UploadedFile() tep: TepTaiLen | undefined) {
    return this.dv.kiemTep(tep)
  }

  @Post('excel')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.CREATE')
  @UseInterceptors(TEP())
  napTep(@NguoiDung() nd: NguoiDungPhien, @UploadedFile() tep: TepTaiLen | undefined) {
    return this.dv.napTep(nd, tep)
  }

  // ── Kết quả lấy về ──
  @Get('lan-nap')
  @CanQuyen('QT_NGUON_VAO.READ')
  dsLanNap(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.dsLanNap(nd)
  }

  @Get('so-lieu')
  @CanQuyen('QT_NGUON_VAO.READ')
  dsSoLieu(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.dsSoLieu(nd)
  }

  @Post('so-lieu/:id/xoa')
  @HttpCode(200)
  @CanQuyen('QT_NGUON_VAO.DELETE')
  xoaSoLieu(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.xoaSoLieu(nd, maUuid(id))
  }
}
