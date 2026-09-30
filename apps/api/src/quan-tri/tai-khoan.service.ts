import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { kiemTenDangNhap, type KetQuaCapMatKhau, type PhanCong, type TaiKhoanDong } from '@gdos/shared'
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { randomInt, randomUUID } from 'node:crypto'
import { chuoi, chuoiHoacRong, chuoiTuyChon, coKhong, mang, maUuid } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { maLoiPg, trongPhamVi, TRUNG_KHOA, type GiaoDich } from '../db/pham-vi.js'
import { donVi, phanCong, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { bamMatKhau, kiemTraMatKhauMoi } from '../xac-thuc/mat-khau.js'
import { docPhanCong } from './phan-cong.js'

/** Bỏ các chữ dễ đọc nhầm (l/1, o/0, i) — mật khẩu tạm hay được đọc qua điện thoại. */
const BANG_CHU = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Mật khẩu tạm dạng `xxxx-xxxx-xxxx`: 14 ký tự, ~59 bit ngẫu nhiên. */
export function sinhMatKhauTam(tenDangNhap: string): string {
  const nhom = () => Array.from({ length: 4 }, () => BANG_CHU[randomInt(BANG_CHU.length)]).join('')
  for (;;) {
    const mk = `${nhom()}-${nhom()}-${nhom()}`
    if (!kiemTraMatKhauMoi(mk, tenDangNhap)) return mk
  }
}

/**
 * Tài khoản — Tầng 2: cần cờ quản trị (guard của API) VÀ nằm trong phạm vi đơn
 * vị (RLS). Tài khoản ngoài phạm vi thì database không trả ra → 404, không lộ
 * là "có nhưng không được xem".
 *
 * Không có xóa: tài khoản thôi dùng thì KHÓA — nhật ký thao tác vẫn cần biết
 * "ai" đã làm những việc cũ.
 */
@Injectable()
export class TaiKhoanService {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private get db() {
    return dbCua(this.csdl)
  }

  danhSach(nd: NguoiDungPhien): Promise<TaiKhoanDong[]> {
    return trongPhamVi(this.db, nd.nguCanh, (tx) => docTaiKhoan(tx))
  }

  async tao(nd: NguoiDungPhien, than: unknown): Promise<KetQuaCapMatKhau> {
    const tenDangNhap = chuoi(than, 'tenDangNhap', 50, true)
    const loiTen = kiemTenDangNhap(tenDangNhap)
    if (loiTen) throw new BadRequestException(loiTen)
    const hoTen = chuoi(than, 'hoTen', 150, true)
    const donViId = maUuid((than as { donViId?: unknown } | null)?.donViId, 'donViId')
    const laQuanTri = coKhong(than, 'laQuanTri') ?? false
    const nativeUserId = chuoiHoacRong(than, 'nativeUserId', 100) ?? null
    const pc = docPhanCong(mang(than, 'phanCong'))

    const matKhauTam = sinhMatKhauTam(tenDangNhap)
    const bam = await bamMatKhau(matKhauTam)
    const id = randomUUID()

    try {
      return await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        const [dv] = await tx
          .select({ id: donVi.id })
          .from(donVi)
          .where(and(eq(donVi.id, donViId), isNull(donVi.deletedAt)))
        if (!dv) throw new BadRequestException('Đơn vị không có trong phạm vi quản lý')

        await tx.insert(taiKhoan).values({
          id,
          donViId,
          tenDangNhap,
          hoTen,
          laQuanTri,
          nativeUserId,
          matKhauBam: bam,
          phaiDoiMatKhau: true,
        })
        await ghiPhanCong(tx, id, donViId, pc)
        return { taiKhoan: await motTaiKhoan(tx, id), matKhauTam }
      })
    } catch (e) {
      // Tên đăng nhập là duy nhất TOÀN hệ thống; trùng với tài khoản ở đơn vị
      // khác thì RLS không cho thấy trước, chỉ biết khi database từ chối.
      if (maLoiPg(e) === TRUNG_KHOA)
        throw new ConflictException(`Tên đăng nhập "${tenDangNhap}" đã có người dùng`)
      throw e
    }
  }

  async sua(nd: NguoiDungPhien, id: string, than: unknown): Promise<TaiKhoanDong> {
    const hoTen = chuoiTuyChon(than, 'hoTen', 150)
    const laQuanTri = coKhong(than, 'laQuanTri')
    const nativeUserId = chuoiHoacRong(than, 'nativeUserId', 100)
    if (id === nd.taiKhoanId && laQuanTri === false)
      throw new BadRequestException('Không tự bỏ cờ quản trị của chính mình — nhờ một quản trị viên khác')

    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      if (hoTen !== undefined || laQuanTri !== undefined || nativeUserId !== undefined)
        await capNhat(tx, id, { hoTen, laQuanTri, nativeUserId })
      return motTaiKhoan(tx, id)
    })
  }

  /** Thay TOÀN BỘ phân công: xóa mềm cái cũ, thêm cái mới — nhật ký giữ đủ lịch sử. */
  async datPhanCong(nd: NguoiDungPhien, id: string, than: unknown): Promise<TaiKhoanDong> {
    const pc = docPhanCong(mang(than, 'phanCong'))
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const tk = await motTaiKhoan(tx, id)
      await tx
        .update(phanCong)
        .set({ deletedAt: new Date() })
        .where(and(eq(phanCong.taiKhoanId, id), isNull(phanCong.deletedAt)))
      await ghiPhanCong(tx, id, tk.donViId, pc)
      return motTaiKhoan(tx, id)
    })
  }

  /** Khóa: thu hồi MỌI phiên ngay; vé đang cầm hết hạn trong tối đa 15 phút. */
  khoa(nd: NguoiDungPhien, id: string): Promise<TaiKhoanDong> {
    if (id === nd.taiKhoanId) throw new BadRequestException('Không tự khóa tài khoản của chính mình')
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      await capNhat(tx, id, { trangThai: 'khoa' })
      await tx.execute(sql`select phien_thu_hoi_tai_khoan(${id}::uuid)`)
      return motTaiKhoan(tx, id)
    })
  }

  /** Mở khóa — cả khóa của quản trị lẫn khóa tạm do nhập sai nhiều lần. */
  moKhoa(nd: NguoiDungPhien, id: string): Promise<TaiKhoanDong> {
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      await capNhat(tx, id, { trangThai: 'hoat-dong', soLanSai: 0, khoaDen: null })
      return motTaiKhoan(tx, id)
    })
  }

  /** Cấp mật khẩu tạm mới. Người dùng phải đổi ngay lần đăng nhập tới; mọi phiên cũ bị thu hồi. */
  async datLaiMatKhau(nd: NguoiDungPhien, id: string): Promise<KetQuaCapMatKhau> {
    if (id === nd.taiKhoanId)
      throw new BadRequestException('Tài khoản của chính mình thì dùng "Đổi mật khẩu"')
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const tk = await motTaiKhoan(tx, id)
      const matKhauTam = sinhMatKhauTam(tk.tenDangNhap)
      await capNhat(tx, id, {
        matKhauBam: await bamMatKhau(matKhauTam),
        phaiDoiMatKhau: true,
        soLanSai: 0,
        khoaDen: null,
      })
      await tx.execute(sql`select phien_thu_hoi_tai_khoan(${id}::uuid)`)
      return { taiKhoan: await motTaiKhoan(tx, id), matKhauTam }
    })
  }
}

// ── truy vấn ───────────────────────────────────────────────────────────────

/** Cột được đọc — liệt kê TƯỜNG MINH; `mat_khau_bam` thì gdos_app không đọc được. */
const COT = {
  id: taiKhoan.id,
  tenDangNhap: taiKhoan.tenDangNhap,
  hoTen: taiKhoan.hoTen,
  donViId: taiKhoan.donViId,
  donViTen: donVi.ten,
  laQuanTri: taiKhoan.laQuanTri,
  nativeUserId: taiKhoan.nativeUserId,
  trangThai: taiKhoan.trangThai,
  khoaDen: taiKhoan.khoaDen,
  phaiDoiMatKhau: taiKhoan.phaiDoiMatKhau,
  createdAt: taiKhoan.createdAt,
}

async function docTaiKhoan(tx: GiaoDich, chiId?: string): Promise<TaiKhoanDong[]> {
  const ds = await tx
    .select(COT)
    .from(taiKhoan)
    .innerJoin(donVi, eq(donVi.id, taiKhoan.donViId))
    .where(and(isNull(taiKhoan.deletedAt), chiId ? eq(taiKhoan.id, chiId) : undefined))
    .orderBy(asc(donVi.ten), asc(taiKhoan.tenDangNhap))
  if (ds.length === 0) return []

  const ids = ds.map((d) => d.id)
  const pcs = await tx
    .select({ taiKhoanId: phanCong.taiKhoanId, vai: phanCong.vai, phamVi: phanCong.phamVi })
    .from(phanCong)
    .where(and(isNull(phanCong.deletedAt), inArray(phanCong.taiKhoanId, ids)))
    .orderBy(asc(phanCong.vai))

  const bayGio = new Date()
  return ds.map(({ khoaDen, createdAt, trangThai, ...d }) => ({
    ...d,
    trangThai: trangThai as TaiKhoanDong['trangThai'],
    khoaTamDen: khoaDen && khoaDen > bayGio ? khoaDen.toISOString() : null,
    taoLuc: createdAt.toISOString(),
    phanCong: pcs
      .filter((p) => p.taiKhoanId === d.id)
      .map((p) => ({ vai: p.vai as PhanCong['vai'], phamVi: p.phamVi ?? 'tat-ca' })),
  }))
}

async function motTaiKhoan(tx: GiaoDich, id: string): Promise<TaiKhoanDong> {
  const [tk] = await docTaiKhoan(tx, id)
  if (!tk) throw new NotFoundException('Không tìm thấy tài khoản')
  return tk
}

/** Cập nhật đúng một tài khoản trong phạm vi; không có → 404. */
async function capNhat(tx: GiaoDich, id: string, gt: Partial<typeof taiKhoan.$inferInsert>) {
  const kq = await tx
    .update(taiKhoan)
    .set(gt)
    .where(and(eq(taiKhoan.id, id), isNull(taiKhoan.deletedAt)))
    .returning({ id: taiKhoan.id })
  if (kq.length === 0) throw new NotFoundException('Không tìm thấy tài khoản')
}

async function ghiPhanCong(tx: GiaoDich, taiKhoanId: string, donViId: string, ds: PhanCong[]) {
  if (ds.length === 0) return
  await tx.insert(phanCong).values(
    ds.map((p) => ({
      taiKhoanId,
      donViId,
      vai: p.vai,
      phamVi: p.phamVi === 'tat-ca' ? null : [...p.phamVi],
    })),
  )
}
