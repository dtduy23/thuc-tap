import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import {
  CHU_DE_TRO_LY_BENH_VIEN,
  KET_QUA_NHAC_LAO,
  NGUON_BENH_VIEN,
  NGUON_PHIM,
  NHAN_PHIM,
  VIEC_NGHIEN_CUU,
  chuanKy,
  kyHienTai,
  quyenBenhVien,
  type HanhDong,
  type KetQuaNhacLao,
  type NguonPhim,
  type NhanPhim,
  type ChuDeTroLyBenhVien,
} from '@gdos/shared'
import type { Response } from 'express'
import { coKhong, chuoi, chuoiTuyChon, motTrong } from '../chung/kiem-than.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { headerTaiExcel, vietExcel } from '../xuyen-suot/bao-cao-chung.js'
import { BenhVienThuService, type ThaoTacBhyt } from './benh-vien.service.js'
import { PhimThuService } from './phim.service.js'
import { MA_TAI_LIEU, baoCaoBoNhan, baoCaoNghienCuu } from './tai-lieu.js'

const phim = (h: HanhDong) => quyenBenhVien('phim-x-quang', h)
const bhyt = (h: HanhDong) => quyenBenhVien('ho-so-bhyt', h)
const lao = (h: HanhDong) => quyenBenhVien('dieu-tri-lao', h)
const nguon = (h: HanhDong) => quyenBenhVien('qt-nguon-vao', h)
const VIEC_BHYT = ['ra-soat', 'bo-sung', 'duyet', 'tra-lai', 'gui'] as const satisfies readonly ThaoTacBhyt[]

function batBuoc<T>(value: T | undefined, ten: string): T {
  if (value === undefined) throw new BadRequestException(`Thiếu trường ${ten}`)
  return value
}

function kyThu(v: unknown): string {
  if (v === undefined) return kyHienTai()
  const k = chuanKy(v)
  if (!k || k !== v || k < '2000-01' || k > '2100-12')
    throw new BadRequestException('Kỳ phải có dạng YYYY-MM (2000–2100)')
  return k
}

@Controller('benh-vien')
export class BenhVienThuController {
  constructor(
    @Inject(PhimThuService) private readonly p: PhimThuService,
    @Inject(BenhVienThuService) private readonly bv: BenhVienThuService,
  ) {}

  @Get('phim')
  @CanQuyen(phim('READ'))
  danhSachPhim(@NguoiDung() nd: NguoiDungPhien, @Query() q: Record<string, unknown>) {
    const loc = motTrong(q, 'loc', ['tat-ca', 'cho-nhan', 'cho-duyet', 'da-duyet']) ?? 'tat-ca'
    const nguon = motTrong(q, 'nguon', Object.keys(NGUON_PHIM) as NguonPhim[])
    const trang = q.trang === undefined ? 1 : Number(q.trang)
    if (!Number.isInteger(trang) || trang < 1 || trang > 201)
      throw new BadRequestException('Trang danh sách không hợp lệ')
    const tim = (chuoiTuyChon(q, 'tim', 15) ?? '').toUpperCase()
    return this.p.danhSach(nd, loc, nguon, tim, trang)
  }

  @Get('phim/:ma/anh')
  @CanQuyen(phim('READ'))
  anh(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    return this.p.anh(nd, ma)
  }

  @Post('phim/:ma/nhan')
  @CanQuyen(phim('UPDATE'))
  async nhan(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    const nhan = batBuoc(motTrong(than, 'nhan', Object.keys(NHAN_PHIM) as NhanPhim[]), 'nhan')
    await this.p.nhan(nd, ma, nhan)
    return { ok: true }
  }

  @Post('phim/:ma/duyet')
  @CanQuyen(phim('APPROVE'))
  async duyet(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    const nhan = batBuoc(motTrong(than, 'nhan', Object.keys(NHAN_PHIM) as NhanPhim[]), 'nhan')
    await this.p.duyet(nd, ma, nhan, batBuoc(coKhong(than, 'chapNhan'), 'chapNhan'))
    return { ok: true }
  }

  @Post('phim/:ma/goi-y')
  @CanQuyen(phim('UPDATE'))
  goiY(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    return this.p.chay(nd, ma)
  }

  @Post('phim/nhan-lo/:ma')
  @CanQuyen(phim('CREATE'))
  nhanLo(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    const nguon = batBuoc(motTrong({ ma }, 'ma', Object.keys(NGUON_PHIM) as NguonPhim[]), 'ma')
    return this.p.nhanLo(nd, nguon)
  }

  @Get('nghien-cuu')
  @CanQuyen(phim('READ'))
  nghienCuu(@NguoiDung() nd: NguoiDungPhien) {
    return this.p.nghienCuu(nd)
  }

  @Post('nghien-cuu/danh-gia')
  @CanQuyen(phim('UPDATE'))
  chayDanhGia(@NguoiDung() nd: NguoiDungPhien) {
    return this.p.chayLoDanhGia(nd)
  }

  @Post('nghien-cuu/viec/:ma')
  @CanQuyen(phim('READ'))
  async ghiViec(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    const v = VIEC_NGHIEN_CUU.find((x) => x.ma === ma)
    if (!v) throw new NotFoundException('Không có mốc nghiên cứu này')
    if (!nd.quyen.has(phim(v.ma === 'dao-duc' ? 'APPROVE' : 'UPDATE')))
      throw new ForbiddenException('Không có quyền ghi nhận mốc này')
    await this.p.ghiViec(nd, v.ma, batBuoc(coKhong(than, 'daGhiNhan'), 'daGhiNhan'))
    return { ok: true }
  }

  @Get('nghien-cuu/:ma/excel')
  @CanQuyen(phim('EXPORT'))
  async taiLieu(
    @NguoiDung() nd: NguoiDungPhien,
    @Param('ma') ma: string,
    @Res() res: Response,
  ): Promise<void> {
    const mau = MA_TAI_LIEU.find((m) => m === ma)
    if (!mau) throw new NotFoundException('Không có tài liệu thử nghiệm này')
    const baoCao =
      mau === 'bo-nhan'
        ? baoCaoBoNhan(await this.p.xuatNhan(nd))
        : baoCaoNghienCuu(mau, await this.p.nghienCuu(nd))
    res.set(headerTaiExcel(baoCao.tenTep)).send(await vietExcel(baoCao))
  }

  @Get('ket-noi')
  @CanQuyen(nguon('READ'))
  ketNoi(@NguoiDung() nd: NguoiDungPhien, @Query('ky') ky: unknown) {
    return this.bv.ketNoi(nd, kyThu(ky))
  }

  @Post('ket-noi/:ma/dong-bo')
  @CanQuyen(nguon('UPDATE'))
  dongBo(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Query('ky') ky: unknown) {
    const n = NGUON_BENH_VIEN.find((x) => x.ma === ma)
    if (!n) throw new NotFoundException('Không có nguồn dữ liệu này')
    return this.bv.dongBo(nd, n.ma, kyThu(ky))
  }

  @Get('bhyt')
  @CanQuyen(bhyt('READ'))
  docBhyt(@NguoiDung() nd: NguoiDungPhien) {
    return this.bv.bhyt(nd)
  }

  @Post('bhyt/:ma/:viec')
  @CanQuyen(bhyt('READ'))
  async doiBhyt(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Param('viec') viec: string) {
    const v = VIEC_BHYT.find((x) => x === viec)
    if (!v) throw new NotFoundException('Không có thao tác BHYT này')
    const h = v === 'duyet' || v === 'tra-lai' ? 'APPROVE' : v === 'gui' ? 'EXPORT' : 'UPDATE'
    if (!nd.quyen.has(bhyt(h)))
      throw new ForbiddenException('Tài khoản không có quyền thực hiện thao tác BHYT này')
    await this.bv.doiBhyt(nd, ma, v)
    return { ok: true }
  }

  @Get('lao')
  @CanQuyen(lao('READ'))
  docLao(@NguoiDung() nd: NguoiDungPhien) {
    return this.bv.lao(nd)
  }

  @Post('lao/:ma/nhac')
  @CanQuyen(lao('UPDATE'))
  async nhac(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string, @Body() than: unknown) {
    const kq = batBuoc(motTrong(than, 'ketQua', Object.keys(KET_QUA_NHAC_LAO) as KetQuaNhacLao[]), 'ketQua')
    await this.bv.nhacLao(nd, ma, chuoi(than, 'ngay', 10), kq)
    return { ok: true }
  }

  @Post('lao/:ma/hoan-tat')
  @CanQuyen(lao('APPROVE'))
  async hoanTat(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    await this.bv.hoanTatLao(nd, ma)
    return { ok: true }
  }

  @Post('lao/:ma/dong-bo')
  @CanQuyen(lao('EXPORT'))
  async guiLao(@NguoiDung() nd: NguoiDungPhien, @Param('ma') ma: string) {
    await this.bv.guiLao(nd, ma)
    return { ok: true }
  }

  @Post('tro-ly')
  @CanQuyen(quyenBenhVien('tro-ly-ai', 'READ'))
  troLy(@NguoiDung() nd: NguoiDungPhien, @Body() than: unknown) {
    const chuDe = batBuoc(
      motTrong(than, 'chuDe', Object.keys(CHU_DE_TRO_LY_BENH_VIEN) as ChuDeTroLyBenhVien[]),
      'chuDe',
    )
    const laLao = chuDe === 'ma-icd' || chuDe === 'nhac-theo-doi'
    if (!nd.quyen.has(laLao ? lao('READ') : quyenBenhVien('tong-quan', 'READ')))
      throw new ForbiddenException('Tài khoản không có quyền đọc dữ liệu cho câu hỏi này')
    return this.bv.troLy(nd, chuDe, kyThu(chuoiTuyChon(than, 'ky', 7)), chuoiTuyChon(than, 'ma', 30))
  }
}
