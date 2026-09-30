/**
 * Database cho test: Postgres THẬT (PGlite — biên dịch sang WebAssembly, chạy
 * trong tiến trình test), đã chạy đủ migration. Không cần Docker.
 *
 * Chỉ dùng trong test — tsconfig.build.json loại thư mục này khỏi bản build.
 */
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { fileURLToPath } from 'node:url'
import type { CoSo } from '../db/pham-vi.js'
import * as schema from '../db/schema/index.js'
import { bamMatKhau } from '../xac-thuc/mat-khau.js'

export interface CoSoThu {
  pg: PGlite
  /** Kết nối CHỦ BẢNG (superuser của PGlite) — vượt RLS, chỉ dùng để nạp và soi dữ liệu. */
  chuBang: PgliteDatabase<typeof schema>
  /** Cùng kết nối, kiểu chung mà code thật dùng — luôn đi qua trongPhamVi(). */
  coSo: CoSo
}

export async function taoCoSoThu(): Promise<CoSoThu> {
  const pg = new PGlite({ extensions: { citext } })
  const chuBang = drizzle(pg, { schema })
  await migrate(chuBang, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) })
  return { pg, chuBang, coSo: chuBang as unknown as CoSo }
}

/** Dữ liệu giả dùng chung. Mã cố định để đọc test cho dễ. */
export const MAU = {
  TINH: '00000000-0000-4000-8000-000000000001',
  XA_A: '00000000-0000-4000-8000-0000000000a1',
  XA_B: '00000000-0000-4000-8000-0000000000b1',
  MAT_KHAU: 'mat-khau-thu-nghiem',
} as const

export type TenMau =
  | 'chutich.a'
  | 'chuyenvien.a'
  | 'quantri'
  | 'quantri.tinh'
  | 'canbo.b'
  | 'lanhdao.tinh'
  | 'khoa.thu'
  | 'bikhoa'

/**
 * Nạp tỉnh + hai xã + các tài khoản đủ vai. Mọi tài khoản cùng một mật khẩu
 * (băm một lần — argon2 cố ý chậm, băm 8 lần là phí thời gian test).
 */
export async function napMau({ chuBang }: CoSoThu): Promise<void> {
  const { donVi, taiKhoan, phanCong } = schema
  const bam = await bamMatKhau(MAU.MAT_KHAU)
  await chuBang.insert(donVi).values([
    { id: MAU.TINH, ma: 'T01', ten: 'Tỉnh Mẫu', cap: 'tinh' },
    { id: MAU.XA_A, ma: 'XA-A', ten: 'Xã An Hòa', cap: 'xa', chaId: MAU.TINH },
    { id: MAU.XA_B, ma: 'XA-B', ten: 'Xã Bình Minh', cap: 'xa', chaId: MAU.TINH },
  ])

  const tk = (
    ten: TenMau,
    donViId: string,
    hoTen: string,
    them: Partial<typeof taiKhoan.$inferInsert> = {},
  ) => ({
    tenDangNhap: ten,
    donViId,
    hoTen,
    matKhauBam: bam,
    ...them,
  })
  const ds = await chuBang
    .insert(taiKhoan)
    .values([
      tk('chutich.a', MAU.XA_A, 'Chủ tịch xã An Hòa'),
      tk('chuyenvien.a', MAU.XA_A, 'Chuyên viên xã An Hòa'),
      tk('quantri', MAU.XA_A, 'Quản trị hệ thống', { laQuanTri: true }),
      tk('canbo.b', MAU.XA_B, 'Cán bộ xã Bình Minh'),
      tk('lanhdao.tinh', MAU.TINH, 'Lãnh đạo tỉnh'),
      tk('quantri.tinh', MAU.TINH, 'Quản trị cấp tỉnh', { laQuanTri: true }),
      tk('khoa.thu', MAU.XA_A, 'Tài khoản thử khóa tạm'),
      tk('bikhoa', MAU.XA_A, 'Tài khoản bị quản trị khóa', { trangThai: 'khoa' }),
    ])
    .returning({ id: taiKhoan.id, ten: taiKhoan.tenDangNhap, donViId: taiKhoan.donViId })

  const id = (ten: TenMau) => ds.find((d) => d.ten === ten)!
  const pc = (ten: TenMau, vai: 'LANH_DAO' | 'CHUYEN_VIEN') => ({
    taiKhoanId: id(ten).id,
    donViId: id(ten).donViId,
    vai,
    phamVi: null,
  })
  await chuBang
    .insert(phanCong)
    .values([
      pc('chutich.a', 'LANH_DAO'),
      pc('chuyenvien.a', 'CHUYEN_VIEN'),
      pc('canbo.b', 'CHUYEN_VIEN'),
      pc('lanhdao.tinh', 'LANH_DAO'),
    ])
}
