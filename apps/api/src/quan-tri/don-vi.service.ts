import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { CapDonVi, DonViDong } from '@gdos/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { chuoi, chuoiTuyChon, maUuid } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { maLoiPg, trongPhamVi, TRUNG_KHOA, type GiaoDich } from '../db/pham-vi.js'
import { donVi } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

/** Mã đơn vị: chữ in hoa không dấu, số, gạch — 2 đến 30 ký tự. */
const MA_DON_VI = /^[A-Z0-9][A-Z0-9_-]{1,29}$/

function docMa(than: unknown, batBuoc: true): string
function docMa(than: unknown, batBuoc: false): string | undefined
function docMa(than: unknown, batBuoc: boolean): string | undefined {
  const tho = batBuoc ? chuoi(than, 'ma', 30, true) : chuoiTuyChon(than, 'ma', 30)
  if (tho === undefined) return undefined
  const ma = tho.toUpperCase()
  if (!MA_DON_VI.test(ma))
    throw new BadRequestException('Mã đơn vị 2–30 ký tự: chữ không dấu, số, gạch ngang/dưới')
  return ma
}

/**
 * Đơn vị hành chính. Đơn vị gốc (tỉnh) chỉ tạo bằng lệnh khởi tạo trên máy chủ;
 * ở đây chỉ thêm XÃ dưới một TỈNH trong phạm vi — database cũng chặn thêm đơn vị
 * dưới cha ngoài phạm vi (policy `them_cap_duoi`, migration 0005).
 *
 * Đơn vị mới chưa nằm trong vé đang cầm: web làm mới phiên ngay sau khi tạo.
 */
@Injectable()
export class DonViService {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private get db() {
    return dbCua(this.csdl)
  }

  danhSach(nd: NguoiDungPhien): Promise<DonViDong[]> {
    return trongPhamVi(this.db, nd.nguCanh, (tx) => docDonVi(tx))
  }

  async tao(nd: NguoiDungPhien, than: unknown): Promise<{ id: string }> {
    const ma = docMa(than, true)
    const ten = chuoi(than, 'ten', 150, true)
    const chaId = maUuid((than as { chaId?: unknown } | null)?.chaId, 'chaId')
    const id = randomUUID()
    try {
      await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        const [cha] = await docDonVi(tx, chaId)
        if (!cha) throw new BadRequestException('Đơn vị cấp trên không có trong phạm vi quản lý')
        if (cha.cap !== 'tinh') throw new BadRequestException('Chỉ thêm được xã trực thuộc một tỉnh')
        const cap: CapDonVi = 'xa'
        // Không dùng RETURNING: dòng mới chưa nằm trong phạm vi ĐỌC của vé hiện tại.
        await tx.insert(donVi).values({ id, ma, ten, cap, chaId })
      })
    } catch (e) {
      if (maLoiPg(e) === TRUNG_KHOA) throw new ConflictException(`Mã đơn vị "${ma}" đã có`)
      throw e
    }
    return { id }
  }

  async sua(nd: NguoiDungPhien, id: string, than: unknown): Promise<DonViDong> {
    const ma = docMa(than, false)
    const ten = chuoiTuyChon(than, 'ten', 150)
    try {
      return await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        if (ma !== undefined || ten !== undefined) {
          const kq = await tx
            .update(donVi)
            .set({ ma, ten })
            .where(and(eq(donVi.id, id), isNull(donVi.deletedAt)))
            .returning({ id: donVi.id })
          if (kq.length === 0) throw new NotFoundException('Không tìm thấy đơn vị')
        }
        const [dv] = await docDonVi(tx, id)
        if (!dv) throw new NotFoundException('Không tìm thấy đơn vị')
        return dv
      })
    } catch (e) {
      if (maLoiPg(e) === TRUNG_KHOA) throw new ConflictException(`Mã đơn vị "${ma}" đã có`)
      throw e
    }
  }
}

async function docDonVi(tx: GiaoDich, chiId?: string): Promise<DonViDong[]> {
  const ds = await tx
    .select({
      id: donVi.id,
      ma: donVi.ma,
      ten: donVi.ten,
      cap: donVi.cap,
      chaId: donVi.chaId,
      // RLS lọc cả truy vấn con: chỉ đếm tài khoản trong phạm vi.
      soTaiKhoan: sql<number>`(select count(*)::int from tai_khoan t
                                where t.don_vi_id = "don_vi"."id" and t.deleted_at is null)`,
    })
    .from(donVi)
    .where(and(isNull(donVi.deletedAt), chiId ? eq(donVi.id, chiId) : undefined))
    .orderBy(asc(donVi.cap), asc(donVi.ten))
  return ds.map((d) => ({ ...d, cap: d.cap as CapDonVi, soTaiKhoan: Number(d.soTaiKhoan) }))
}
