import {
  All,
  Controller,
  ForbiddenException,
  HttpException,
  Inject,
  NotFoundException,
  PayloadTooLargeException,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common'
import { KICH_THUOC_VAN_BAN_TOI_DA } from '@gdos/shared'
import type { Request, Response } from 'express'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { locThamSo, quyenCanCho, thongDiepLoiNative, type DichVuNative } from './chuyen-tiep.js'
import { LienKetNativeService } from './lien-ket.service.js'

/** Cho test thay fetch. */
export const GOI_NATIVE = Symbol('GOI_NATIVE')

/** AI soạn thảo / phân công / phân rã có thể chạy lâu. */
const HET_GIO_MS = 180_000
/** Tệp văn bản tối đa 20 MB + phần khung multipart. */
const THAN_TOI_DA = KICH_THUOC_VAN_BAN_TOI_DA + 1024 * 1024
const HET_LIEN_KET = 'Liên kết FOXAI Native đã hết hạn hoặc bị thu hồi — vào Cài đặt cá nhân để liên kết lại.'
const CO_THAN = new Set(['POST', 'PATCH', 'PUT'])

/** Đọc nguyên thân request (multipart) vào bộ nhớ — để gửi lại được khi phải làm mới token. */
async function docThan(req: Request): Promise<Buffer> {
  const phan: Buffer[] = []
  let tong = 0
  for await (const c of req as AsyncIterable<Buffer>) {
    tong += c.length
    if (tong > THAN_TOI_DA) throw new PayloadTooLargeException('Tệp quá lớn (tối đa 20 MB).')
    phan.push(c)
  }
  return Buffer.concat(phan)
}

/**
 * `/api/native/<dịch vụ>/*` → `{NATIVE_URL}/api/<dịch vụ>/*` (ADR-0009). Kiểm: đường dẫn
 * trong danh sách cho phép, quyền GDOS tương ứng, người dùng đã liên kết Native.
 */
@Controller('native')
export class ChuyenTiepNativeController {
  constructor(
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
    @Inject(LienKetNativeService) private readonly lienKet: LienKetNativeService,
    @Inject(GOI_NATIVE) private readonly goi: typeof fetch,
  ) {}

  @All('document/*duongDan')
  @ChiCanDangNhap()
  taiLieu(@NguoiDung() nd: NguoiDungPhien, @Req() req: Request, @Res() res: Response): Promise<void> {
    return this.chuyen('document', nd, req, res)
  }

  @All('directory/*duongDan')
  @ChiCanDangNhap()
  danhBa(@NguoiDung() nd: NguoiDungPhien, @Req() req: Request, @Res() res: Response): Promise<void> {
    return this.chuyen('directory', nd, req, res)
  }

  private async chuyen(dichVu: DichVuNative, nd: NguoiDungPhien, req: Request, res: Response): Promise<void> {
    const url = new URL(req.originalUrl, 'http://gdos')
    const duongDan = url.pathname.slice(`/api/native/${dichVu}`.length)
    const quyen = quyenCanCho(dichVu, req.method, duongDan)
    if (!quyen) throw new NotFoundException('Không có chức năng này')
    if (!quyen.some((q) => nd.quyen.has(q)))
      throw new ForbiddenException('Tài khoản không có quyền thao tác này')
    const goc = this.cauHinh.native.url
    if (!goc || this.cauHinh.native.gia)
      throw new ServiceUnavailableException(
        'Công cụ này cần FOXAI Native thật (NATIVE_URL) — bản giả chỉ có tóm tắt văn bản.',
      )

    const loaiNoiDung = req.headers['content-type'] ?? ''
    const laMultipart = loaiNoiDung.startsWith('multipart/form-data')
    const coThan = CO_THAN.has(req.method)
    // JSON: body-parser đã đọc — gửi lại. Multipart: GDOS không đọc tệp, chuyển nguyên khối.
    const than = !coThan ? undefined : laMultipart ? await docThan(req) : JSON.stringify(req.body ?? {})

    const gui = (token: string) =>
      this.goi(`${goc}/api/${dichVu}${duongDan}${locThamSo(url.searchParams)}`, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(coThan ? { 'Content-Type': laMultipart ? loaiNoiDung : 'application/json' } : {}),
        },
        body: than,
        signal: AbortSignal.timeout(HET_GIO_MS),
      }).catch(() => {
        throw new ServiceUnavailableException('Không tới được FOXAI Native — vui lòng thử lại sau.')
      })

    let kq = await gui(await this.lienKet.tokenCua(nd))
    if (kq.status === 401) {
      // Access token trong bộ nhớ đã bị Native từ chối: làm mới đúng một lần rồi gửi lại.
      this.lienKet.quenToken(nd.taiKhoanId)
      kq = await gui(await this.lienKet.tokenCua(nd))
      // 401 thứ hai: KHÔNG trả 401 (web hiểu là hết phiên GDOS) — báo liên kết Native hỏng.
      if (kq.status === 401) throw new ForbiddenException(HET_LIEN_KET)
    }

    if (!kq.ok) {
      throw new HttpException(
        thongDiepLoiNative(kq.status, await kq.text()),
        kq.status >= 500 ? 502 : kq.status,
      )
    }

    res.status(kq.status)
    res.setHeader('Content-Type', kq.headers.get('content-type') ?? 'application/octet-stream')
    const cd = kq.headers.get('content-disposition')
    if (cd) res.setHeader('Content-Disposition', cd)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-store')
    res.end(Buffer.from(await kq.arrayBuffer()))
  }
}
