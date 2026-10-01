import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import {
  CHINH_SACH,
  CHINH_SACH_MAC_DINH,
  KHOA_CHINH_SACH,
  KHOA_NHAN_DIEN,
  kiemChinhSach,
  kiemNhanDien,
  NHAN_DIEN_MAC_DINH,
  type CauHinhCongKhai,
  type CauHinhHeThong,
  type ChinhSachBaoMat,
  type NhanDien,
} from '@gdos/shared'
import { eq, sql } from 'drizzle-orm'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { khongNguCanh, maLoiPg, trongPhamVi, truyVan } from '../db/pham-vi.js'
import { cauHinh, donVi, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

/** Đăng nhập nào cũng cần chính sách — đọc lại tối đa mỗi bấy nhiêu, không hỏi DB mỗi lần. */
const GIU_MS = 10_000

type KhoaThietLap = 'bao-mat' | 'nhan-dien'

/**
 * Giá trị đã lưu có thể từ phiên bản cũ (thiếu tham số mới, hoặc khoảng cho phép
 * đã đổi): tham số nào không hợp lệ thì dùng mặc định, không làm hỏng đăng nhập.
 */
function hopNhatBaoMat(luu: unknown): ChinhSachBaoMat {
  const o = (luu ?? {}) as Record<string, unknown>
  const kq = { ...CHINH_SACH_MAC_DINH }
  for (const k of KHOA_CHINH_SACH) {
    const v = o[k]
    const d = CHINH_SACH[k]
    if (typeof v === 'number' && Number.isInteger(v) && v >= d.min && v <= d.max) kq[k] = v
  }
  return kq
}

function hopNhatNhanDien(luu: unknown): NhanDien {
  const o = (luu ?? {}) as Record<string, unknown>
  const kq = { ...NHAN_DIEN_MAC_DINH }
  for (const k of KHOA_NHAN_DIEN) if (typeof o[k] === 'string') kq[k] = o[k]
  if (!kq.tenHeThong.trim()) kq.tenHeThong = NHAN_DIEN_MAC_DINH.tenHeThong
  return kq
}

/**
 * Cấu hình hệ thống: chính sách đăng nhập & mật khẩu, tên hiển thị. Lưu ở bảng
 * `cau_hinh`; chưa lưu gì thì dùng mặc định trong `@gdos/shared`.
 */
@Injectable()
export class ThietLapService {
  private boNho?: { luc: number; baoMat: ChinhSachBaoMat; nhanDien: NhanDien; tenGoc: string | null }

  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private async doc() {
    if (this.boNho && Date.now() - this.boNho.luc < GIU_MS) return this.boNho
    const { dong, goc } = await khongNguCanh(dbCua(this.csdl), async (tx) => ({
      dong: await tx.select({ khoa: cauHinh.khoa, giaTri: cauHinh.giaTri }).from(cauHinh),
      goc: await truyVan<{ ten: string }>(tx, sql`select ten from don_vi_goc()`),
    }))
    const lay = (k: KhoaThietLap) => dong.find((d) => d.khoa === k)?.giaTri
    this.boNho = {
      luc: Date.now(),
      baoMat: hopNhatBaoMat(lay('bao-mat')),
      nhanDien: hopNhatNhanDien(lay('nhan-dien')),
      tenGoc: goc[0]?.ten ?? null,
    }
    return this.boNho
  }

  async baoMat(): Promise<ChinhSachBaoMat> {
    return (await this.doc()).baoMat
  }

  async congKhai(): Promise<CauHinhCongKhai> {
    const { nhanDien, baoMat, tenGoc } = await this.doc()
    return {
      nhanDien: { ...nhanDien, tenCoQuan: nhanDien.tenCoQuan.trim() || tenGoc || '' },
      matKhauToiThieu: baoMat.matKhauToiThieu,
    }
  }

  async xem(nd: NguoiDungPhien): Promise<CauHinhHeThong> {
    const { baoMat, nhanDien, tenGoc } = await this.doc()
    const [toi] = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({ chaId: donVi.chaId })
        .from(taiKhoan)
        .innerJoin(donVi, eq(donVi.id, taiKhoan.donViId))
        .where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    return { baoMat, nhanDien, coTheSua: nd.laQuanTri && !!toi && toi.chaId === null, tenDonViGoc: tenGoc }
  }

  async ghiBaoMat(nd: NguoiDungPhien, than: unknown): Promise<CauHinhHeThong> {
    const loi = kiemChinhSach(than)
    if (loi.length) throw new BadRequestException(loi.join('; '))
    return this.ghi(nd, 'bao-mat', than)
  }

  async ghiNhanDien(nd: NguoiDungPhien, than: unknown): Promise<CauHinhHeThong> {
    const loi = kiemNhanDien(than)
    if (loi.length) throw new BadRequestException(loi.join('; '))
    const o = than as NhanDien
    const sach = Object.fromEntries(KHOA_NHAN_DIEN.map((k) => [k, o[k].trim()])) as NhanDien
    return this.ghi(nd, 'nhan-dien', sach)
  }

  private async ghi(nd: NguoiDungPhien, khoa: KhoaThietLap, giaTri: unknown): Promise<CauHinhHeThong> {
    try {
      await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
        tx.execute(sql`select cau_hinh_ghi(${khoa}, ${JSON.stringify(giaTri)}::jsonb)`),
      )
    } catch (e) {
      // Hàm trong database tự kiểm quyền — đây chỉ đổi lỗi của nó thành câu dễ hiểu.
      if (maLoiPg(e) === '42501')
        throw new ForbiddenException('Chỉ quản trị ở đơn vị gốc được sửa cấu hình hệ thống')
      throw e
    }
    this.boNho = undefined
    return this.xem(nd)
  }
}
