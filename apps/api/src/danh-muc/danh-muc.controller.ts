import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common'
import { CAP_DON_VI, type GiaTriDanhMuc, type QuyTrinhMauDong, type TaiKhoanDanhBa } from '@gdos/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, truyVan } from '../db/pham-vi.js'
import { danhMucGiaTri, quyTrinhMau } from '../db/schema/index.js'
import { ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'

const LOAI = ['linh-vuc', 'nguon-von', 'loai-van-ban'] as const

/**
 * Tra cứu dùng chung cho mọi nghiệp vụ: giá trị danh mục, quy trình mẫu, danh bạ
 * tài khoản. Chỉ ĐỌC và không bí mật — ai đăng nhập cũng dùng được để chọn giá trị
 * khi nhập liệu. Màn QUẢN LÝ danh mục (thêm, sửa) là Danh mục › Danh mục nghiệp vụ.
 */
@Controller()
export class DanhMucController {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  @Get('danh-muc')
  @ChiCanDangNhap()
  async giaTri(@NguoiDung() nd: NguoiDungPhien, @Query('loai') loai?: string): Promise<GiaTriDanhMuc[]> {
    if (!LOAI.includes(loai as (typeof LOAI)[number]))
      throw new BadRequestException(`"loai" phải là một trong: ${LOAI.join(', ')}`)
    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          id: danhMucGiaTri.id,
          loai: danhMucGiaTri.loai,
          ma: danhMucGiaTri.ma,
          ten: danhMucGiaTri.ten,
          mau: danhMucGiaTri.mau,
        })
        .from(danhMucGiaTri)
        .where(and(eq(danhMucGiaTri.loai, loai!), isNull(danhMucGiaTri.deletedAt)))
        .orderBy(asc(danhMucGiaTri.thuTu), asc(danhMucGiaTri.ten)),
    )
    return ds.map((d) => ({ ...d, loai: d.loai as GiaTriDanhMuc['loai'] }))
  }

  @Get('quy-trinh-mau')
  @ChiCanDangNhap()
  async quyTrinh(@NguoiDung() nd: NguoiDungPhien): Promise<QuyTrinhMauDong[]> {
    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          id: quyTrinhMau.id,
          ma: quyTrinhMau.ma,
          ten: quyTrinhMau.ten,
          canCu: quyTrinhMau.canCu,
          hinhThuc: quyTrinhMau.hinhThuc,
          soBuoc: sql<number>`jsonb_array_length(${quyTrinhMau.buoc})::int`,
          khoa: quyTrinhMau.khoa,
        })
        .from(quyTrinhMau)
        .where(isNull(quyTrinhMau.deletedAt))
        .orderBy(asc(quyTrinhMau.thuTu), asc(quyTrinhMau.ten)),
    )
    return ds.map((d) => ({
      ...d,
      hinhThuc: d.hinhThuc as QuyTrinhMauDong['hinhThuc'],
      soBuoc: Number(d.soBuoc),
    }))
  }

  /** Danh bạ: tìm tài khoản theo tên, tên đăng nhập, tên đơn vị (tối đa 30). `cap`: lọc loại đơn vị, vd doanh-nghiep. */
  @Get('danh-ba')
  @ChiCanDangNhap()
  async danhBa(
    @NguoiDung() nd: NguoiDungPhien,
    @Query('tim') tim?: string,
    @Query('cap') cap?: string,
  ): Promise<TaiKhoanDanhBa[]> {
    const t = typeof tim === 'string' ? tim.slice(0, 100) : ''
    const c = typeof cap === 'string' && cap ? cap.split(',').slice(0, 5) : null
    if (c?.some((x) => !Object.hasOwn(CAP_DON_VI, x))) throw new BadRequestException('"cap" không hợp lệ')
    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      truyVan<{ id: string; ho_ten: string; ten_dang_nhap: string; don_vi_ten: string; don_vi_cap: string }>(
        tx,
        // Đã kiểm từng phần tử là loại đơn vị hợp lệ → ghép thành mảng Postgres an toàn.
        sql`select * from danh_ba_tai_khoan(${t}, ${c ? `{${c.join(',')}}` : null}::text[])`,
      ),
    )
    return ds.map((d) => ({
      id: d.id,
      hoTen: d.ho_ten,
      tenDangNhap: d.ten_dang_nhap,
      donViTen: d.don_vi_ten,
      donViCap: d.don_vi_cap,
    }))
  }
}
