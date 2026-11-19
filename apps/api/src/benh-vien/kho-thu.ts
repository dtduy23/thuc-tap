import { ForbiddenException } from '@nestjs/common'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { dbCua, type CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type GiaoDich } from '../db/pham-vi.js'
import { benhVienThu, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

export type Loai =
  'phim' | 'goi-y' | 'nguon-phim' | 'nghien-cuu' | 'ket-noi' | 'bhyt' | 'lao' | 'nhac-lao' | 'gui-lao'
type Dong = Pick<typeof benhVienThu.$inferSelect, 'loai' | 'ma' | 'giaTri' | 'updatedAt'>

export async function donViCua(tx: GiaoDich, nd: NguoiDungPhien): Promise<string> {
  const [tk] = await tx
    .select({ donViId: taiKhoan.donViId })
    .from(taiKhoan)
    .where(and(eq(taiKhoan.id, nd.taiKhoanId), isNull(taiKhoan.deletedAt)))
  if (!tk) throw new ForbiddenException('Không tìm thấy đơn vị của tài khoản')
  return tk.donViId
}

export function trongDonVi<T>(
  csdl: CoSoDuLieu,
  nd: NguoiDungPhien,
  viec: (tx: GiaoDich, donViId: string) => Promise<T>,
) {
  return trongPhamVi(dbCua(csdl), nd.nguCanh, async (tx) => viec(tx, await donViCua(tx, nd)))
}

export function docKho(tx: GiaoDich, donViId: string, ...loai: Loai[]): Promise<Dong[]> {
  return tx
    .select({
      loai: benhVienThu.loai,
      ma: benhVienThu.ma,
      giaTri: benhVienThu.giaTri,
      updatedAt: benhVienThu.updatedAt,
    })
    .from(benhVienThu)
    .where(
      and(eq(benhVienThu.donViId, donViId), inArray(benhVienThu.loai, loai), isNull(benhVienThu.deletedAt)),
    )
}

const khoa = (donViId: string, loai: Loai, ma: string) =>
  and(
    eq(benhVienThu.donViId, donViId),
    eq(benhVienThu.loai, loai),
    eq(benhVienThu.ma, ma),
    isNull(benhVienThu.deletedAt),
  )

export async function ghiKho(tx: GiaoDich, donViId: string, loai: Loai, ma: string, giaTri: string) {
  await tx
    .insert(benhVienThu)
    .values({ donViId, loai, ma, giaTri })
    .onConflictDoUpdate({
      target: [benhVienThu.donViId, benhVienThu.loai, benhVienThu.ma],
      set: { giaTri, deletedAt: null },
    })
}

/** Khóa đúng bản ghi để hai thao tác sửa/duyệt đồng thời không ghi đè nhau. */
export async function doiTrangThai(
  tx: GiaoDich,
  donViId: string,
  loai: Loai,
  ma: string,
  macDinh: string,
  doi: (cu: string) => string | Promise<string>,
) {
  await tx.insert(benhVienThu).values({ donViId, loai, ma, giaTri: macDinh }).onConflictDoNothing()
  const dk = khoa(donViId, loai, ma)
  const [dong] = await tx.select({ giaTri: benhVienThu.giaTri }).from(benhVienThu).where(dk).for('update')
  if (!dong) throw new ForbiddenException('Bản ghi thử nghiệm không còn mở')
  const moi = await doi(dong.giaTri)
  if (moi !== dong.giaTri) await tx.update(benhVienThu).set({ giaTri: moi }).where(dk)
}
