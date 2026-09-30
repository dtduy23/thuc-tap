import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Response } from 'express'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { chuoi } from '../chung/kiem-than.js'
import { ChiCanDangNhap, CongKhai, NguoiDung, type NguoiDungPhien, type YeuCau } from './bao-ve.js'
import { COOKIE_PHIEN, COOKIE_VE, docCookie, tuyChonCookiePhien, tuyChonCookieVe } from './cookie.js'
import { XacThucService, type KetQuaPhien, type ThietBi, type ThongTinToi } from './xac-thuc.service.js'

const thietBi = (req: YeuCau): ThietBi => ({ ip: req.ip, trinhDuyet: req.headers['user-agent'] })

@Controller('xac-thuc')
export class XacThucController {
  constructor(
    @Inject(XacThucService) private readonly dv: XacThucService,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
  ) {}

  private datCookie(res: Response, kq: KetQuaPhien): ThongTinToi {
    res.cookie(COOKIE_VE, kq.ve, tuyChonCookieVe(this.cauHinh.cookieAnToan, kq.hanVeGiay))
    res.cookie(COOKIE_PHIEN, kq.tokenPhien, tuyChonCookiePhien(this.cauHinh.cookieAnToan, kq.hanPhienNgay))
    return kq.thongTin
  }

  private xoaCookie(res: Response) {
    // clearCookie phải trùng path với lúc đặt, không thì trình duyệt giữ nguyên cookie cũ.
    const { maxAge: _a, ...ve } = tuyChonCookieVe(this.cauHinh.cookieAnToan, 0)
    const { maxAge: _b, ...phien } = tuyChonCookiePhien(this.cauHinh.cookieAnToan, 0)
    res.clearCookie(COOKIE_VE, ve)
    res.clearCookie(COOKIE_PHIEN, phien)
  }

  @Post('dang-nhap')
  @CongKhai()
  @HttpCode(200)
  async dangNhap(@Body() than: unknown, @Req() req: YeuCau, @Res({ passthrough: true }) res: Response) {
    const kq = await this.dv.dangNhap(chuoi(than, 'tenDangNhap', 100), chuoi(than, 'matKhau'), thietBi(req))
    return this.datCookie(res, kq)
  }

  @Post('lam-moi')
  @CongKhai()
  @HttpCode(200)
  async lamMoi(@Req() req: YeuCau, @Res({ passthrough: true }) res: Response) {
    const token = docCookie(req.headers.cookie)[COOKIE_PHIEN]
    if (!token) throw new UnauthorizedException('Chưa đăng nhập')
    try {
      return this.datCookie(res, await this.dv.lamMoi(token, thietBi(req)))
    } catch (e) {
      this.xoaCookie(res)
      throw e
    }
  }

  @Post('dang-xuat')
  @CongKhai()
  @HttpCode(204)
  async dangXuat(@Req() req: YeuCau, @Res({ passthrough: true }) res: Response) {
    const token = docCookie(req.headers.cookie)[COOKIE_PHIEN]
    if (token) await this.dv.dangXuat(token)
    this.xoaCookie(res)
  }

  @Get('toi')
  @ChiCanDangNhap()
  toi(@NguoiDung() nd: NguoiDungPhien) {
    return this.dv.thongTinCua(nd)
  }

  @Post('doi-mat-khau')
  @ChiCanDangNhap()
  @HttpCode(200)
  async doiMatKhau(
    @NguoiDung() nd: NguoiDungPhien,
    @Body() than: unknown,
    @Req() req: YeuCau,
    @Res({ passthrough: true }) res: Response,
  ) {
    const kq = await this.dv.doiMatKhau(
      nd,
      chuoi(than, 'matKhauCu'),
      chuoi(than, 'matKhauMoi'),
      docCookie(req.headers.cookie)[COOKIE_PHIEN],
    )
    // Chỉ thay vé; token phiên hiện tại giữ nguyên (các phiên KHÁC đã bị thu hồi).
    res.cookie(COOKIE_VE, kq.ve, tuyChonCookieVe(this.cauHinh.cookieAnToan, kq.hanVeGiay))
    return kq.thongTin
  }
}
