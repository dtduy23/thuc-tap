import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { TEN_BANG, TEN_HANH_DONG_NHAT_KY, type TrangNhatKy } from '@gdos/shared'
import { and, desc, eq, gte, lt, sql, type SQL } from 'drizzle-orm'
import { maUuid } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { donVi, nhatKyThaoTac, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

export interface LocNhatKy {
  bang?: string
  hanhDong?: string
  /** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD, tính cả ngày. */
  tu?: string
  den?: string
  /** Mã dòng cuối của trang trước — phân trang theo mã, không OFFSET. */
  truoc?: string
  gioiHan?: string
  /** Chỉ các thao tác trên MỘT dự án (thẻ Nhật ký trong hồ sơ dự án). */
  duAnId?: string
}

const NGAY = /^\d{4}-\d{2}-\d{2}$/
const MOT_NGAY_MS = 24 * 3600 * 1000

/** Đầu ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
function dauNgay(ten: string, v: string): Date {
  const d = new Date(`${v}T00:00:00+07:00`)
  if (!NGAY.test(v) || Number.isNaN(d.getTime()))
    throw new BadRequestException(`"${ten}" phải là ngày YYYY-MM-DD`)
  return d
}

/**
 * Đọc nhật ký thao tác. Chỉ ĐỌC — database không cho ai sửa hay xóa (trigger
 * `chan_sua_nhat_ky`). RLS lọc theo đơn vị như mọi bảng khác.
 */
@Injectable()
export class NhatKyService {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  async danhSach(nd: NguoiDungPhien, loc: LocNhatKy): Promise<TrangNhatKy> {
    const gioiHan = loc.gioiHan === undefined ? 50 : Number(loc.gioiHan)
    if (!Number.isInteger(gioiHan) || gioiHan < 1 || gioiHan > 200)
      throw new BadRequestException('"gioiHan" từ 1 đến 200')
    if (loc.bang !== undefined && !(loc.bang in TEN_BANG)) throw new BadRequestException('"bang" không có')
    if (loc.hanhDong !== undefined && !(loc.hanhDong in TEN_HANH_DONG_NHAT_KY))
      throw new BadRequestException('"hanhDong" không có')
    const truoc = loc.truoc === undefined ? undefined : Number(loc.truoc)
    if (truoc !== undefined && (!Number.isSafeInteger(truoc) || truoc < 1))
      throw new BadRequestException('"truoc" không hợp lệ')
    if (loc.duAnId !== undefined) maUuid(loc.duAnId, 'duAnId')

    const dk: (SQL | undefined)[] = [
      loc.bang ? eq(nhatKyThaoTac.bang, loc.bang) : undefined,
      loc.hanhDong ? eq(nhatKyThaoTac.hanhDong, loc.hanhDong) : undefined,
      loc.tu ? gte(nhatKyThaoTac.luc, dauNgay('tu', loc.tu)) : undefined,
      loc.den ? lt(nhatKyThaoTac.luc, new Date(dauNgay('den', loc.den).getTime() + MOT_NGAY_MS)) : undefined,
      truoc ? lt(nhatKyThaoTac.id, truoc) : undefined,
      loc.duAnId
        ? sql`(${nhatKyThaoTac.banGhiId} = ${loc.duAnId}
              or ${nhatKyThaoTac.giaTriMoi} ->> 'du_an_id' = ${loc.duAnId}
              or ${nhatKyThaoTac.giaTriCu} ->> 'du_an_id' = ${loc.duAnId})`
        : undefined,
    ]

    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          id: nhatKyThaoTac.id,
          luc: nhatKyThaoTac.luc,
          taiKhoanId: nhatKyThaoTac.taiKhoanId,
          // Người làm ở đơn vị ngoài phạm vi (vd quản trị cấp tỉnh sửa dữ liệu
          // xã) thì RLS che tên → null; web ghi "tài khoản ngoài phạm vi".
          nguoiLam: taiKhoan.hoTen,
          donViTen: donVi.ten,
          hanhDong: nhatKyThaoTac.hanhDong,
          bang: nhatKyThaoTac.bang,
          banGhiId: nhatKyThaoTac.banGhiId,
          giaTriCu: nhatKyThaoTac.giaTriCu,
          giaTriMoi: nhatKyThaoTac.giaTriMoi,
        })
        .from(nhatKyThaoTac)
        .leftJoin(taiKhoan, eq(taiKhoan.id, nhatKyThaoTac.taiKhoanId))
        .leftJoin(donVi, eq(donVi.id, nhatKyThaoTac.donViId))
        .where(and(...dk))
        .orderBy(desc(nhatKyThaoTac.id))
        .limit(gioiHan + 1),
    )

    const coTiep = ds.length > gioiHan
    const trang = coTiep ? ds.slice(0, gioiHan) : ds
    return {
      dong: trang.map((d) => ({
        ...d,
        luc: d.luc.toISOString(),
        giaTriCu: d.giaTriCu as Record<string, unknown> | null,
        giaTriMoi: d.giaTriMoi as Record<string, unknown> | null,
      })),
      tiep: coTiep ? (trang.at(-1)?.id ?? null) : null,
    }
  }
}
