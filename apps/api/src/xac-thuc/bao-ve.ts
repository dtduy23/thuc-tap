/**
 * BẢO VỆ MỌI ROUTE — gắn toàn cục trong app.module.ts.
 *
 * Mặc định là CHẶN. Một route chỉ chạy được khi khai TƯỜNG MINH một trong ba:
 *   @CongKhai()         không cần đăng nhập (health, đăng nhập, làm mới, đăng xuất)
 *   @ChiCanDangNhap()   đăng nhập là đủ (xem thông tin của chính mình, đổi mật khẩu)
 *   @CanQuyen('X.Y')    cần đúng quyền — tính bằng tinhQuyen(), CÙNG hàm web dùng lọc menu
 *
 * Route không khai gì → 500. Quên khai là lỗi của người viết, phải lộ ra ngay ở
 * lần chạy đầu, không được lặng lẽ thành "ai đăng nhập cũng vào được".
 */
import {
  createParamDecorator,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
  applyDecorators,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { DANH_SACH_MODULE, tinhQuyen, type PhanCong } from '@gdos/shared'
import type { Request } from 'express'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import type { NguCanh } from '../db/pham-vi.js'
import { COOKIE_VE, docCookie } from './cookie.js'
import { docVe, phanCongTuVe } from './ve.js'

const CONG_KHAI = 'gdos:cong-khai'
const CAN_QUYEN = 'gdos:can-quyen'
const CAN_MOT_QUYEN = 'gdos:can-mot-quyen'

export const CongKhai = () => SetMetadata(CONG_KHAI, true)
export const ChiCanDangNhap = () => SetMetadata(CAN_QUYEN, [])
/** Cần ĐỦ mọi quyền liệt kê. */
export const CanQuyen = (...quyen: [string, ...string[]]) => SetMetadata(CAN_QUYEN, quyen)
/** Có MỘT trong các quyền liệt kê là đủ — cho route phục vụ nhiều module hoặc nhiều vai. */
export const CanMotTrongQuyen = (...quyen: [string, ...string[]]) =>
  applyDecorators(SetMetadata(CAN_QUYEN, []), SetMetadata(CAN_MOT_QUYEN, quyen))

export interface NguoiDungPhien {
  taiKhoanId: string
  donViIds: string[]
  laQuanTri: boolean
  phaiDoiMatKhau: boolean
  phanCong: PhanCong[]
  quyen: ReadonlySet<string>
  /** Đưa thẳng vào trongPhamVi(). */
  nguCanh: NguCanh
}

export type YeuCau = Request & { nguoiDung?: NguoiDungPhien }

/** Lấy người dùng của request trong controller: `@NguoiDung() nd: NguoiDungPhien`. */
export const NguoiDung = createParamDecorator((_: unknown, ctx: ExecutionContext): NguoiDungPhien => {
  const nd = ctx.switchToHttp().getRequest<YeuCau>().nguoiDung
  if (!nd) throw new InternalServerErrorException('Route dùng @NguoiDung() nhưng lại khai @CongKhai()')
  return nd
})

/**
 * Chống giả mạo request (CSRF): request GHI phải kèm header `X-GDOS: 1`. Trang
 * web lạ không tự gắn được header tùy biến lên request tới tên miền của ta
 * (trình duyệt đòi CORS preflight, mà API không mở CORS). Cộng với cookie
 * SameSite, đủ chặn mà không cần token CSRF riêng.
 */
const PHUONG_THUC_DOC = new Set(['GET', 'HEAD', 'OPTIONS'])

@Injectable()
export class BaoVeGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<YeuCau>()
    const dich = [ctx.getHandler(), ctx.getClass()]

    if (!PHUONG_THUC_DOC.has(req.method) && req.headers['x-gdos'] !== '1') {
      throw new ForbiddenException('Yêu cầu thiếu header X-GDOS — có thể là yêu cầu giả mạo từ trang khác')
    }

    if (this.reflector.getAllAndOverride<boolean>(CONG_KHAI, dich)) return true

    const canQuyen = this.reflector.getAllAndOverride<string[] | undefined>(CAN_QUYEN, dich)
    if (canQuyen === undefined) {
      throw new InternalServerErrorException(
        `Route ${req.method} ${req.path} chưa khai @CongKhai, @ChiCanDangNhap hay @CanQuyen`,
      )
    }

    const ve = docCookie(req.headers.cookie)[COOKIE_VE]
    const nd = ve ? docVe(ve, this.cauHinh.khoaKyVe) : null
    if (!nd) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn')

    const phanCong = phanCongTuVe(nd)
    const quyen = tinhQuyen(DANH_SACH_MODULE, phanCong, nd.qt)
    req.nguoiDung = {
      taiKhoanId: nd.tk,
      donViIds: nd.dv,
      laQuanTri: nd.qt,
      phaiDoiMatKhau: nd.dmk === true,
      phanCong,
      quyen,
      nguCanh: { taiKhoanId: nd.tk, donViIds: nd.dv },
    }

    // Mật khẩu do quản trị cấp (người khác đã biết): chỉ được xem mình và đổi mật khẩu.
    if (canQuyen.length > 0 && nd.dmk)
      throw new ForbiddenException('Cần đổi mật khẩu được cấp trước khi làm việc')

    const thieu = canQuyen.filter((q) => !quyen.has(q))
    if (thieu.length) throw new ForbiddenException(`Tài khoản không có quyền: ${thieu.join(', ')}`)

    const motQuyen = this.reflector.getAllAndOverride<string[] | undefined>(CAN_MOT_QUYEN, dich)
    if (motQuyen) {
      if (nd.dmk) throw new ForbiddenException('Cần đổi mật khẩu được cấp trước khi làm việc')
      if (!motQuyen.some((q) => quyen.has(q)))
        throw new ForbiddenException(`Tài khoản cần một trong các quyền: ${motQuyen.join(', ')}`)
    }
    return true
  }
}
