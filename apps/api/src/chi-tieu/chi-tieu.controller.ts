import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common'
import { BAO_CAO_BENH_VIEN, chuanKy, kyHienTai, type BangChiTieu, type NguonBenhVien } from '@gdos/shared'
import type { Response } from 'express'
import { CanMotTrongQuyen, CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { headerTaiExcel, vietExcel } from '../xuyen-suot/bao-cao-chung.js'
import { baoCaoBenhVien } from './benh-vien.js'
import { ChiTieuService } from './chi-tieu.service.js'

function thamSoBenhVien(ky: unknown, nguon: unknown): [string, NguonBenhVien] {
  const k = ky === undefined ? kyHienTai() : chuanKy(ky)
  if (!k || (ky !== undefined && ky !== k) || Number(k.slice(0, 4)) < 2000 || Number(k.slice(0, 4)) > 2100)
    throw new BadRequestException('Kỳ bệnh viện phải là tháng YYYY-MM trong giai đoạn 2000–2100')
  if (nguon !== undefined && nguon !== 'gia-lap' && nguon !== 'da-nap')
    throw new BadRequestException('Nguồn số liệu không hợp lệ')
  return [k, nguon ?? 'gia-lap']
}

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
    return this.dv.benhVien(nd, ...thamSoBenhVien(ky, nguon))
  }

  @Get('benh-vien/bao-cao/:ma/excel')
  @CanQuyen('TONG_QUAN.READ')
  async xuatBenhVien(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('ma') ma: string,
    @Query('ky') ky: unknown,
    @Query('nguon') nguon: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const mau = BAO_CAO_BENH_VIEN.find((m) => m.id === ma)
    if (!mau) throw new NotFoundException('Không có mẫu báo cáo bệnh viện này')
    const bang = await this.dv.benhVien(nd, ...thamSoBenhVien(ky, nguon))
    const hienTai = bang.cacKy.at(-1)!
    const kq = baoCaoBenhVien(bang, hienTai, mau)
    res.set(headerTaiExcel(kq.tenTep)).send(await vietExcel(kq))
  }
}
