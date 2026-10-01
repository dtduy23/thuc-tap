import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { QUYEN_DOC_OCR } from '@gdos/shared'
import { coKhong, maUuid } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { OcrService } from './ocr.service.js'

const MA_LOAI = /^[\w.-]{1,100}$/

function maLoai(v: unknown): string {
  if (typeof v !== 'string' || !MA_LOAI.test(v))
    throw new BadRequestException('Mã loại chứng từ không hợp lệ')
  return v
}

/**
 * Nhận dạng chứng từ (OCR) qua FOXAI Native. Quản trị (QT_OCR) chọn loại và lấy kết quả
 * về; phần ĐỌC (`/loai`, `/chung-tu`) mở cho các quyền trong QUYEN_DOC_OCR để trang tác
 * nghiệp dùng lại.
 */
@Controller('ocr')
export class OcrController {
  constructor(@Inject(OcrService) private readonly dv: OcrService) {}

  /** `?bat=1`: chỉ loại đang lấy về. */
  @Get('loai')
  @CanQuyen(...QUYEN_DOC_OCR)
  dsLoai(@NguoiDung() nd: NguoiDungPhien, @Query('bat') bat?: string) {
    return this.dv.dsLoai(nd, bat === '1')
  }

  @Post('loai/dong-bo')
  @HttpCode(200)
  @CanQuyen('QT_OCR.UPDATE')
  dongBoLoai(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.dongBoLoai(nd)
  }

  @Patch('loai/:ma')
  @CanQuyen('QT_OCR.UPDATE')
  batLoai(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    const bat = coKhong(than, 'bat')
    if (bat === undefined) throw new BadRequestException('Thiếu trường "bat"')
    return this.dv.batLoai(nd, maLoai(ma), bat)
  }

  @Post('lay-ve')
  @HttpCode(200)
  @CanQuyen('QT_OCR.UPDATE')
  layVe(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.layVe(nd)
  }

  /** `?loai=<mã>`: một loại; bỏ trống: mọi loại. */
  @Get('chung-tu')
  @CanQuyen(...QUYEN_DOC_OCR)
  danhSach(@NguoiDung() nd: NguoiDungPhien, @Query('loai') loai?: string) {
    return this.dv.danhSach(nd, loai === undefined || loai === '' ? undefined : maLoai(loai))
  }

  @Get('chung-tu/:id')
  @CanQuyen(...QUYEN_DOC_OCR)
  mot(@NguoiDung() nd: NguoiDungPhien, @Param('id') id: string) {
    return this.dv.mot(nd, maUuid(id))
  }
}
