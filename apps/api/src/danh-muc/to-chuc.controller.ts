import { Controller, Get, Inject } from '@nestjs/common'
import type { CanBoDong, DonViDong, MaVai } from '@gdos/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { donVi, taiKhoan } from '../db/schema/index.js'
import { DonViService } from '../quan-tri/don-vi.service.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'

/**
 * Danh mục › Tổ chức — danh bạ đơn vị và cán bộ để mọi nghiệp vụ tra cứu. CHỈ ĐỌC, chỉ
 * trong phạm vi đơn vị của người xem (RLS). Không trả gì về mật khẩu, khóa, phiên —
 * việc khai báo và quản lý tài khoản là của Tầng 2 › Người dùng & Phân quyền.
 */
@Controller('to-chuc')
export class ToChucController {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(DonViService) private readonly dv: DonViService,
  ) {}

  @Get('don-vi')
  @CanQuyen('DM_TO_CHUC.READ')
  donVi(@NguoiDung() nd: NguoiDungPhien): Promise<DonViDong[]> {
    return this.dv.danhSach(nd)
  }

  @Get('can-bo')
  @CanQuyen('DM_TO_CHUC.READ')
  async canBo(@NguoiDung() nd: NguoiDungPhien): Promise<CanBoDong[]> {
    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          id: taiKhoan.id,
          hoTen: taiKhoan.hoTen,
          tenDangNhap: taiKhoan.tenDangNhap,
          donViId: taiKhoan.donViId,
          donViTen: donVi.ten,
          donViCap: donVi.cap,
          // Vai trò đang giữ (không trùng) — RLS lọc cả truy vấn con.
          vai: sql<string[]>`coalesce((select array_agg(distinct p.vai order by p.vai) from phan_cong p
                                       where p.tai_khoan_id = "tai_khoan"."id" and p.deleted_at is null), '{}')`,
        })
        .from(taiKhoan)
        .innerJoin(donVi, eq(donVi.id, taiKhoan.donViId))
        // Tài khoản đang khóa hoặc đã xóa không nằm trong danh bạ.
        .where(and(isNull(taiKhoan.deletedAt), eq(taiKhoan.trangThai, 'hoat-dong')))
        .orderBy(asc(donVi.ten), asc(taiKhoan.hoTen)),
    )
    return ds.map((d) => ({ ...d, vai: d.vai as MaVai[] }))
  }
}
