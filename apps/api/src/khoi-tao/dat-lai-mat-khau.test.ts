import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { khongNguCanh, truyVan } from '../db/pham-vi.js'
import { phienDangNhap, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { kiemMatKhau } from '../xac-thuc/mat-khau.js'
import { datLaiMatKhauQuanTri } from './dat-lai-mat-khau.js'

const MOI = 'mat-khau-dat-lai-moi'

let db: CoSoThu
beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
}, 60_000)
afterAll(async () => {
  await db.pg.close()
})

describe('datLaiMatKhauQuanTri', () => {
  it('từ chối mật khẩu yếu; không có tài khoản; không đặt lại cho tài khoản thường', async () => {
    await expect(datLaiMatKhauQuanTri(db.coSo, 'quantri', 'ngan')).rejects.toThrow(/ít nhất 8/)
    expect(await datLaiMatKhauQuanTri(db.coSo, 'khong-co-ai', MOI)).toBe('khong-co')
    expect(await datLaiMatKhauQuanTri(db.coSo, 'chuyenvien.a', MOI)).toBe('khong-phai-quan-tri')
    const [cv] = await khongNguCanh(db.coSo, (tx) =>
      truyVan<{ mat_khau_bam: string }>(tx, sql`select * from dang_nhap_tim('chuyenvien.a')`),
    )
    expect(await kiemMatKhau(MAU.MAT_KHAU, cv!.mat_khau_bam)).toBe(true)
  })

  it('đặt lại cho quản trị viên: đăng nhập được bằng mật khẩu mới, gỡ khóa tạm, thu hồi phiên cũ', async () => {
    const [tk] = await db.chuBang
      .select({ id: taiKhoan.id })
      .from(taiKhoan)
      .where(eq(taiKhoan.tenDangNhap, 'quantri'))
    await db.chuBang
      .update(taiKhoan)
      .set({ soLanSai: 9, khoaDen: new Date(Date.now() + 3600e3), phaiDoiMatKhau: true })
      .where(eq(taiKhoan.id, tk!.id))
    await db.chuBang
      .insert(phienDangNhap)
      .values({ taiKhoanId: tk!.id, tokenBam: 'token-thu', hetHan: new Date(Date.now() + 3600e3) })

    // Tên đăng nhập không phân biệt hoa thường (citext).
    expect(await datLaiMatKhauQuanTri(db.coSo, 'QuanTri', MOI)).toBe('da-dat-lai')

    const [sau] = await db.chuBang.select().from(taiKhoan).where(eq(taiKhoan.id, tk!.id))
    expect(await kiemMatKhau(MOI, sau!.matKhauBam)).toBe(true)
    expect(await kiemMatKhau(MAU.MAT_KHAU, sau!.matKhauBam)).toBe(false)
    expect(sau).toMatchObject({ soLanSai: 0, khoaDen: null, phaiDoiMatKhau: false })
    const phien = await db.chuBang.select().from(phienDangNhap).where(eq(phienDangNhap.taiKhoanId, tk!.id))
    expect(phien.every((p) => p.thuHoiLuc !== null)).toBe(true)

    // Có vết trong nhật ký, và nhật ký không chứa mật khẩu băm.
    const nk = await db.pg.query<{ hanh_dong: string; moi: string }>(
      `select hanh_dong, gia_tri_moi::text as moi from nhat_ky_thao_tac where bang = 'tai_khoan' and ban_ghi_id = $1 order by id desc limit 1`,
      [tk!.id],
    )
    expect(nk.rows[0]!.hanh_dong).toBe('DOI_MAT_KHAU')
    expect(nk.rows[0]!.moi).not.toContain(sau!.matKhauBam)
  })
})
