/**
 * Test lớp bảo mật database trên Postgres THẬT (PGlite — Postgres biên dịch sang
 * WebAssembly, chạy trong tiến trình test, không cần Docker).
 *
 * Đây là bộ test ADR-0004 yêu cầu KHÔNG ĐƯỢC TẮT: ba tài khoản ở ba xã thấy ba
 * tập dữ liệu khác nhau, và các luật "chặn bằng database" giữ đúng.
 */
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { eq, sql } from 'drizzle-orm'
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { khongNguCanh, trongPhamVi, truyVan, type CoSo, type NguCanh } from './pham-vi.js'
import * as schema from './schema/index.js'

const { donVi, taiKhoan, nhatKyThaoTac } = schema

// Dữ liệu giả — mã cố định để đọc test cho dễ.
const TINH = '00000000-0000-4000-8000-000000000001'
const XA = {
  A: '00000000-0000-4000-8000-0000000000a1',
  B: '00000000-0000-4000-8000-0000000000b1',
  C: '00000000-0000-4000-8000-0000000000c1',
} as const
const TK = {
  A: '00000000-0000-4000-8000-0000000000a2',
  B: '00000000-0000-4000-8000-0000000000b2',
  C: '00000000-0000-4000-8000-0000000000c2',
} as const
const nc = (xa: keyof typeof XA): NguCanh => ({ taiKhoanId: TK[xa], donViIds: [XA[xa]] })

/** Cột được phép đọc — KHÔNG có mat_khau_bam (role app không có quyền đọc cột đó). */
const COT_TAI_KHOAN = { id: taiKhoan.id, hoTen: taiKhoan.hoTen, donViId: taiKhoan.donViId }

/**
 * Drizzle bọc lỗi Postgres trong `cause` ("Failed query: …"). Lấy lỗi GỐC để
 * khẳng định đúng lý do bị chặn — bị chặn vì lỗi cú pháp thì không tính.
 */
async function loiGoc(viec: Promise<unknown>): Promise<string> {
  try {
    await viec
  } catch (e) {
    const loi = e as Error & { cause?: Error }
    return loi.cause?.message ?? loi.message
  }
  throw new Error('Mong bị chặn nhưng câu lệnh lại chạy được')
}

let pg: PGlite
let db: PgliteDatabase<typeof schema>
const coSo = () => db as unknown as CoSo

beforeAll(async () => {
  pg = new PGlite({ extensions: { citext } })
  db = drizzle(pg, { schema })
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) })

  // Nạp dữ liệu bằng chủ bảng (superuser của PGlite) — giống bước khởi tạo thật.
  await db.insert(donVi).values([
    { id: TINH, ma: 'T01', ten: 'Tỉnh Mẫu', cap: 'tinh' },
    { id: XA.A, ma: 'XA-A', ten: 'Xã An Hòa', cap: 'xa', chaId: TINH },
    { id: XA.B, ma: 'XA-B', ten: 'Xã Bình Minh', cap: 'xa', chaId: TINH },
    { id: XA.C, ma: 'XA-C', ten: 'Xã Cát Tiên', cap: 'xa', chaId: TINH },
  ])
  await db.insert(taiKhoan).values(
    (['A', 'B', 'C'] as const).map((x) => ({
      id: TK[x],
      donViId: XA[x],
      tenDangNhap: `canbo.${x.toLowerCase()}`,
      hoTen: `Cán bộ xã ${x}`,
      matKhauBam: `bam-gia-${x}`,
    })),
  )
}, 60_000)

afterAll(async () => {
  await pg.close()
})

describe('RLS — mỗi xã chỉ thấy dữ liệu của mình', () => {
  it('ba tài khoản ở ba xã thấy ba tập dữ liệu khác nhau', async () => {
    for (const x of ['A', 'B', 'C'] as const) {
      const ds = await trongPhamVi(coSo(), nc(x), (tx) => tx.select(COT_TAI_KHOAN).from(taiKhoan))
      expect(ds.map((r) => r.id)).toEqual([TK[x]])
      const dv = await trongPhamVi(coSo(), nc(x), (tx) => tx.select({ id: donVi.id }).from(donVi))
      expect(dv.map((r) => r.id)).toEqual([XA[x]])
    }
  })

  it('có nhiều đơn vị trong ngữ cảnh thì thấy hợp của chúng', async () => {
    const ds = await trongPhamVi(coSo(), { taiKhoanId: TK.A, donViIds: [XA.A, XA.B] }, (tx) =>
      tx.select(COT_TAI_KHOAN).from(taiKhoan),
    )
    expect(ds.map((r) => r.id).sort()).toEqual([TK.A, TK.B].sort())
  })

  it('không có ngữ cảnh đơn vị thì KHÔNG thấy gì — mặc định an toàn', async () => {
    const ds = await khongNguCanh(coSo(), (tx) => tx.select(COT_TAI_KHOAN).from(taiKhoan))
    expect(ds).toEqual([])
  })

  it('ngữ cảnh rỗng bị từ chối thay vì lặng lẽ trả 0 dòng', async () => {
    await expect(
      trongPhamVi(coSo(), { taiKhoanId: TK.A, donViIds: [] }, () => Promise.resolve()),
    ).rejects.toThrow(/không có đơn vị/)
  })

  it('trong giao dịch, câu lệnh chạy dưới role gdos_app chứ không phải chủ bảng', async () => {
    const r = await trongPhamVi(coSo(), nc('A'), (tx) =>
      truyVan<{ u: string }>(tx, sql`select current_user as u`),
    )
    expect(r).toEqual([{ u: 'gdos_app' }])
  })

  it('không ghi được dữ liệu sang xã khác', async () => {
    await expect(
      trongPhamVi(coSo(), nc('A'), (tx) =>
        tx
          .insert(taiKhoan)
          .values({ donViId: XA.B, tenDangNhap: 'lan.sang', hoTen: 'Lấn sang xã B', matKhauBam: 'x' }),
      ),
    ).rejects.toThrow()
  })

  it('không sửa được tài khoản của xã khác — câu lệnh không chạm dòng nào', async () => {
    await trongPhamVi(coSo(), nc('A'), (tx) =>
      tx.update(taiKhoan).set({ hoTen: 'Bị sửa lén' }).where(eq(taiKhoan.id, TK.B)),
    )
    const [b] = await trongPhamVi(coSo(), nc('B'), (tx) => tx.select(COT_TAI_KHOAN).from(taiKhoan))
    expect(b!.hoTen).toBe('Cán bộ xã B')
  })
})

describe('chặn bằng database, không trông vào code', () => {
  it('không xóa cứng được — chỉ có xóa mềm', async () => {
    const loi = await loiGoc(
      trongPhamVi(coSo(), nc('A'), (tx) => tx.delete(taiKhoan).where(eq(taiKhoan.id, TK.A))),
    )
    expect(loi).toMatch(/permission denied/)
  })

  it('không đọc được mật khẩu băm, kể cả tài khoản trong xã mình', async () => {
    const loi = await loiGoc(
      trongPhamVi(coSo(), nc('A'), (tx) => tx.select({ bam: taiKhoan.matKhauBam }).from(taiKhoan)),
    )
    expect(loi).toMatch(/permission denied/)
  })

  it('không ghi tay được vào nhật ký', async () => {
    const loi = await loiGoc(
      trongPhamVi(coSo(), nc('A'), (tx) =>
        tx.insert(nhatKyThaoTac).values({ hanhDong: 'GIA_MAO', bang: 'tai_khoan', donViId: XA.A }),
      ),
    )
    expect(loi).toMatch(/permission denied/)
  })

  it('nhật ký không sửa, không xóa được — kể cả chủ bảng', async () => {
    await expect(db.update(nhatKyThaoTac).set({ hanhDong: 'SUA_LEN' })).rejects.toThrow()
    await expect(db.delete(nhatKyThaoTac)).rejects.toThrow()
  })
})

describe('nhật ký thao tác do trigger ghi', () => {
  const nhatKyCua = (id: string) =>
    trongPhamVi(coSo(), nc('A'), (tx) =>
      tx.select().from(nhatKyThaoTac).where(eq(nhatKyThaoTac.banGhiId, id)).orderBy(nhatKyThaoTac.id),
    )

  it('sửa thông tin → có dòng nhật ký, ghi đúng người sửa, giá trị cũ và mới', async () => {
    await trongPhamVi(coSo(), nc('A'), (tx) =>
      tx.update(taiKhoan).set({ hoTen: 'Cán bộ xã A (đổi tên)' }).where(eq(taiKhoan.id, TK.A)),
    )
    const cuoi = (await nhatKyCua(TK.A)).at(-1)!
    expect(cuoi.hanhDong).toBe('UPDATE')
    expect(cuoi.taiKhoanId).toBe(TK.A)
    expect(cuoi.donViId).toBe(XA.A)
    expect((cuoi.giaTriCu as Record<string, unknown>).ho_ten).toBe('Cán bộ xã A')
    expect((cuoi.giaTriMoi as Record<string, unknown>).ho_ten).toBe('Cán bộ xã A (đổi tên)')
  })

  it('nhật ký KHÔNG chứa mật khẩu băm', async () => {
    for (const dong of await nhatKyCua(TK.A)) {
      expect(dong.giaTriCu ?? {}).not.toHaveProperty('mat_khau_bam')
      expect(dong.giaTriMoi ?? {}).not.toHaveProperty('mat_khau_bam')
    }
  })

  it('đổi RIÊNG mật khẩu vẫn được ghi — gọi là DOI_MAT_KHAU', async () => {
    await trongPhamVi(coSo(), nc('A'), (tx) =>
      tx.update(taiKhoan).set({ matKhauBam: 'bam-moi' }).where(eq(taiKhoan.id, TK.A)),
    )
    expect((await nhatKyCua(TK.A)).at(-1)!.hanhDong).toBe('DOI_MAT_KHAU')
  })

  it('xóa mềm được ghi là XOA_MEM', async () => {
    await trongPhamVi(coSo(), nc('C'), (tx) =>
      tx.update(taiKhoan).set({ deletedAt: new Date() }).where(eq(taiKhoan.id, TK.C)),
    )
    const ds = await trongPhamVi(coSo(), nc('C'), (tx) =>
      tx.select().from(nhatKyThaoTac).where(eq(nhatKyThaoTac.banGhiId, TK.C)).orderBy(nhatKyThaoTac.id),
    )
    expect(ds.at(-1)!.hanhDong).toBe('XOA_MEM')
  })

  it('xã B không đọc được nhật ký của xã A', async () => {
    const ds = await trongPhamVi(coSo(), nc('B'), (tx) =>
      tx.select().from(nhatKyThaoTac).where(eq(nhatKyThaoTac.banGhiId, TK.A)),
    )
    expect(ds).toEqual([])
  })
})

describe('đăng nhập — lối vượt RLS duy nhất, và hẹp', () => {
  interface DongDangNhap {
    id: string
    don_vi_id: string
    so_lan_sai: number
    khoa_den: string | null
  }
  const tim = (ten: string) =>
    khongNguCanh(coSo(), (tx) => truyVan<DongDangNhap>(tx, sql`select * from dang_nhap_tim(${ten})`))
  const ghi = (id: string, dung: boolean) =>
    khongNguCanh(coSo(), (tx) => tx.execute(sql`select dang_nhap_ghi(${id}::uuid, ${dung})`))

  it('tìm được tài khoản khi chưa có ngữ cảnh, không phân biệt hoa thường', async () => {
    const ds = await tim('CANBO.B')
    expect(ds).toHaveLength(1)
    expect(ds[0]).toMatchObject({ id: TK.B, don_vi_id: XA.B })
  })

  it('tài khoản đã xóa mềm không đăng nhập được', async () => {
    expect(await tim('canbo.c')).toEqual([])
  })

  it('sai 5 lần liên tiếp thì bị khóa; đúng một lần thì xóa đếm', async () => {
    for (let i = 0; i < 4; i++) await ghi(TK.B, false)
    expect((await tim('canbo.b'))[0]).toMatchObject({ so_lan_sai: 4, khoa_den: null })
    await ghi(TK.B, false)
    expect((await tim('canbo.b'))[0]!.khoa_den).not.toBeNull()
    await ghi(TK.B, true)
    expect((await tim('canbo.b'))[0]).toMatchObject({ so_lan_sai: 0, khoa_den: null })
  })
})
