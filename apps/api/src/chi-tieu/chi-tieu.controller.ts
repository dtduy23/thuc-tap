import { Controller, Get, Inject, Query } from '@nestjs/common'
import type { BangChiTieu } from '@gdos/shared'
import { CanMotTrongQuyen, CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { kiemKyVaNguon } from '../xuyen-suot/bao-cao-chung.js'
import { ChiTieuService } from './chi-tieu.service.js'

/** Điều hành › Tổng quan + Theo lĩnh vực — giá trị của bộ chỉ tiêu (danh mục ở @gdos/shared). */
@Controller('chi-tieu')
export class ChiTieuController {
  constructor(@Inject(ChiTieuService) private readonly dv: ChiTieuService) {}

  @Get()
  // Cùng một bảng chỉ tiêu phục vụ hai module: Tổng quan và Theo lĩnh vực.
  @CanMotTrongQuyen('TONG_QUAN.READ', 'CHI_TIEU.READ')
  bang(@NguoiDung() nd: NguoiDungPhien): Promise<BangChiTieu> {
    return this.dv.bang(nd)
  }

  @Get('benh-vien')
  @CanQuyen('TONG_QUAN.READ')
  benhVien(@NguoiDung() nd: NguoiDungPhien, @Query('ky') ky: unknown, @Query('nguon') nguon: unknown) {
    const ts = kiemKyVaNguon(ky, nguon)
    return this.dv.benhVien(nd, ts.ky, ts.nguon)
  }
}
