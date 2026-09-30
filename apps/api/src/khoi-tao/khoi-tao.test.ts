import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { khongNguCanh, truyVan } from '../db/pham-vi.js'
import { phanCong, taiKhoan } from '../db/schema/index.js'
import { taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { kiemMatKhau } from '../xac-thuc/mat-khau.js'
import { khoiTaoHeThong, type ThamSoKhoiTao } from './khoi-tao.js'

const TS: ThamSoKhoiTao = {
  donVi: { ma: 'XA-01', ten: 'Xã Thử Nghiệm', cap: 'xa' },
  quanTri: { tenDangNhap: 'quantri', hoTen: 'Quản trị hệ thống', matKhau: 'mat-khau-khoi-tao-dai' },
  toanQuyen: false,
}

let db: CoSoThu
beforeAll(async () => {
  db = await taoCoSoThu()
}, 60_000)
afterAll(async () => {
  await db.pg.close()
})

describe('khoiTaoHeThong', () => {
  it('từ chối mật khẩu yếu — kể cả của quản trị viên', async () => {
    await expect(
      khoiTaoHeThong(db.coSo, { ...TS, quanTri: { ...TS.quanTri, matKhau: 'ngan' } }),
    ).rejects.toThrow(/ít nhất 8/)
  })

  it('tạo đơn vị gốc và quản trị viên — đăng nhập được bằng mật khẩu vừa đặt', async () => {
    expect(await khoiTaoHeThong(db.coSo, TS)).toBe('da-tao')
    const [tk] = await khongNguCanh(db.coSo, (tx) =>
      truyVan<{ mat_khau_bam: string; la_quan_tri: boolean }>(
        tx,
        sql`select * from dang_nhap_tim('quantri')`,
      ),
    )
    expect(tk!.la_quan_tri).toBe(true)
    expect(await kiemMatKhau(TS.quanTri.matKhau, tk!.mat_khau_bam)).toBe(true)
  })

  it('mặc định CHỈ có cờ quản trị — không tự gán vai nghiệp vụ', async () => {
    const [tk] = await db.chuBang
      .select({ id: taiKhoan.id })
      .from(taiKhoan)
      .where(eq(taiKhoan.tenDangNhap, 'quantri'))
    expect(await db.chuBang.select().from(phanCong).where(eq(phanCong.taiKhoanId, tk!.id))).toEqual([])
  })

  it('gọi lại khi đã có quản trị viên thì không làm gì, không ghi đè', async () => {
    const lanHai = await khoiTaoHeThong(db.coSo, {
      ...TS,
      quanTri: { ...TS.quanTri, tenDangNhap: 'quantri2', matKhau: 'mat-khau-khac-han-roi' },
    })
    expect(lanHai).toBe('da-co-quan-tri')
    expect(await db.chuBang.select().from(taiKhoan)).toHaveLength(1)
  })
})

describe('khoiTaoHeThong — toàn quyền (lúc xây dựng)', () => {
  it('gán thêm Lãnh đạo + Chuyên viên phạm vi tất cả', async () => {
    const moi = await taoCoSoThu()
    await khoiTaoHeThong(moi.coSo, { ...TS, toanQuyen: true })
    const pc = await moi.chuBang.select({ vai: phanCong.vai, phamVi: phanCong.phamVi }).from(phanCong)
    expect(pc.map((p) => p.vai).sort()).toEqual(['CHUYEN_VIEN', 'LANH_DAO'])
    expect(pc.every((p) => p.phamVi === null)).toBe(true)
    await moi.pg.close()
  }, 60_000)
})
