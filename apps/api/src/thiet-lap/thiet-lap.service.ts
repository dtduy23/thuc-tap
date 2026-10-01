import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import {
  CHINH_SACH,
  CHINH_SACH_MAC_DINH,
  DANH_SACH_MODULE,
  KHOA_CHINH_SACH,
  KHOA_NGUONG,
  KHOA_NHAN_DIEN,
  KHOA_TRANG_DAU,
  kiemChinhSach,
  kiemNguong,
  kiemNhanDien,
  kiemTrangDau,
  NGUONG_CANH_BAO,
  NGUONG_MAC_DINH,
  NHAN_DIEN_MAC_DINH,
  TRANG_DAU_MAC_DINH,
  type CauHinhCongKhai,
  type CauHinhHeThong,
  type ChinhSachBaoMat,
  type NguongCanhBao,
  type NhanDien,
  type TrangDau,
} from '@gdos/shared'
import { eq, sql } from 'drizzle-orm'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { khongNguCanh, maLoiPg, trongPhamVi, truyVan } from '../db/pham-vi.js'
import { cauHinh, donVi, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

/** Đăng nhập nào cũng cần chính sách — đọc lại tối đa mỗi bấy nhiêu, không hỏi DB mỗi lần. */
const GIU_MS = 10_000

type KhoaThietLap = 'bao-mat' | 'nhan-dien' | 'canh-bao' | 'trang-dau'

/** Mọi mã chức năng cấp 4 trong cây — trang đầu chỉ được trỏ tới một trong số này. */
const CHUC_NANG_HOP_LE = new Set(DANH_SACH_MODULE.flatMap((m) => m.con.map((c) => c.id)))

function hopNhatNguong(luu: unknown): NguongCanhBao {
  const o = (luu ?? {}) as Record<string, unknown>
  const kq = { ...NGUONG_MAC_DINH }
  for (const k of KHOA_NGUONG) {
    const v = o[k]
    const d = NGUONG_CANH_BAO[k]
    if (typeof v === 'number' && Number.isInteger(v) && v >= d.min && v <= d.max) kq[k] = v
  }
  return kq
}

/** Chức năng đã bị gỡ khỏi cây ở bản sau thì coi như chưa đặt — không đưa người dùng tới màn không tồn tại. */
function hopNhatTrangDau(luu: unknown): TrangDau {
  const o = (luu ?? {}) as Record<string, unknown>
  const kq = { ...TRANG_DAU_MAC_DINH }
  for (const k of KHOA_TRANG_DAU) {
    const v = o[k]
    if (typeof v === 'string' && CHUC_NANG_HOP_LE.has(v)) kq[k] = v
  }
  return kq
}

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
  private boNho?: {
    luc: number
    baoMat: ChinhSachBaoMat
    nhanDien: NhanDien
    nguong: NguongCanhBao
    trangDau: TrangDau
    tenGoc: string | null
  }

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
      nguong: hopNhatNguong(lay('canh-bao')),
      trangDau: hopNhatTrangDau(lay('trang-dau')),
      tenGoc: goc[0]?.ten ?? null,
    }
    return this.boNho
  }

  async baoMat(): Promise<ChinhSachBaoMat> {
    return (await this.doc()).baoMat
  }

  /** Ngưỡng cảnh báo đang áp dụng — các nghiệp vụ tính "sắp hạn", "lâu không cập nhật" theo đây. */
  async nguong(): Promise<NguongCanhBao> {
    return (await this.doc()).nguong
  }

  async congKhai(): Promise<CauHinhCongKhai> {
    const { nhanDien, baoMat, nguong, trangDau, tenGoc } = await this.doc()
    return {
      nhanDien: { ...nhanDien, tenCoQuan: nhanDien.tenCoQuan.trim() || tenGoc || '' },
      matKhauToiThieu: baoMat.matKhauToiThieu,
      nguong,
      trangDau,
    }
  }

  async xem(nd: NguoiDungPhien): Promise<CauHinhHeThong> {
    const { baoMat, nhanDien, nguong, trangDau, tenGoc } = await this.doc()
    const [toi] = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({ chaId: donVi.chaId })
        .from(taiKhoan)
        .innerJoin(donVi, eq(donVi.id, taiKhoan.donViId))
        .where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    return {
      baoMat,
      nhanDien,
      nguong,
      trangDau,
      coTheSua: nd.laQuanTri && !!toi && toi.chaId === null,
      tenDonViGoc: tenGoc,
    }
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

  async ghiNguong(nd: NguoiDungPhien, than: unknown): Promise<CauHinhHeThong> {
    const loi = kiemNguong(than)
    if (loi.length) throw new BadRequestException(loi.join('; '))
    return this.ghi(nd, 'canh-bao', than)
  }

  async ghiTrangDau(nd: NguoiDungPhien, than: unknown): Promise<CauHinhHeThong> {
    const loi = kiemTrangDau(than, CHUC_NANG_HOP_LE)
    if (loi.length) throw new BadRequestException(loi.join('; '))
    return this.ghi(nd, 'trang-dau', than)
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
