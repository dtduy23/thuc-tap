/**
 * Tầng 2 (tài khoản, đơn vị) và nhật ký thao tác — đầu cuối: HTTP thật → guard
 * → service → Postgres thật (PGlite) với đủ RLS, trigger và hàm SECURITY DEFINER.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  DANH_SACH_MODULE,
  MA_VAI,
  tinhQuyen,
  type DonViDong,
  type KetQuaCapMatKhau,
  type TaiKhoanDong,
  type ThongTinToi,
  type TrangNhatKy,
} from '@gdos/shared'
import { eq, sql } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { donVi, taiKhoan } from '../db/schema/index.js'
import { NhatKyController } from '../nhat-ky/nhat-ky.controller.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu, type TenMau } from '../test/co-so-thu.js'
import { DuAnController } from '../du-an/du-an.controller.js'
import { HoSoDuAnController } from '../du-an/ho-so.controller.js'
import { XuyenSuotController } from '../xuyen-suot/xuyen-suot.controller.js'
import { ThietLapController } from '../thiet-lap/thiet-lap.controller.js'
import { XacThucController } from '../xac-thuc/xac-thuc.controller.js'
import { DonViController } from './don-vi.controller.js'
import { TaiKhoanController } from './tai-khoan.controller.js'

let db: CoSoThu
let app: INestApplication

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CAU_HINH)
    .useValue(docCauHinh({ NODE_ENV: 'test' }))
    .overrideProvider(CoSoDuLieu)
    .useValue({ db: db.coSo, kiemTra: () => Promise.resolve('ok') })
    .compile()
  app = mod.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()
}, 60_000)

afterAll(async () => {
  await app.close()
  await db.pg.close()
})

const GHI = { 'X-GDOS': '1' }

async function dangNhap(ten: string, matKhau: string = MAU.MAT_KHAU) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent.post('/api/xac-thuc/dang-nhap').set(GHI).send({ tenDangNhap: ten, matKhau })
  return { agent, res }
}

async function quanTri(ten: TenMau = 'quantri') {
  const { agent, res } = await dangNhap(ten)
  expect(res.status).toBe(200)
  return agent
}

async function idCua(ten: string): Promise<string> {
  const [tk] = await db.chuBang
    .select({ id: taiKhoan.id })
    .from(taiKhoan)
    .where(eq(taiKhoan.tenDangNhap, ten))
  return tk!.id
}

let dem = 0
/** Tạo một tài khoản mới ở xã A, trả mật khẩu tạm. */
async function taoTaiKhoan(qt: request.Agent, them: Record<string, unknown> = {}) {
  const ten = `moi.${++dem}`
  const res = await qt
    .post('/api/tai-khoan')
    .set(GHI)
    .send({
      tenDangNhap: ten,
      hoTen: `Cán bộ thử ${dem}`,
      donViId: MAU.XA_A,
      phanCong: [{ vai: 'LANH_DAO', phamVi: 'tat-ca' }],
      ...them,
    })
  return { res, ten, kq: res.body as KetQuaCapMatKhau }
}

describe('tài khoản — xem', () => {
  it('quản trị cấp xã chỉ thấy tài khoản của xã mình; không có gì về mật khẩu', async () => {
    const qt = await quanTri()
    const res = await qt.get('/api/tai-khoan')
    expect(res.status).toBe(200)
    const ds = res.body as TaiKhoanDong[]
    expect(ds.length).toBeGreaterThan(0)
    expect(ds.every((t) => t.donViId === MAU.XA_A)).toBe(true)
    expect(JSON.stringify(ds)).not.toMatch(/mat_?khau_?bam|argon2/i)
    expect(ds.find((t) => t.tenDangNhap === 'chutich.a')?.phanCong).toEqual([
      { vai: 'LANH_DAO', phamVi: 'tat-ca' },
    ])
  })

  it('không có cờ quản trị thì 403 — kể cả Chủ tịch', async () => {
    const { agent } = await dangNhap('chutich.a')
    expect((await agent.get('/api/tai-khoan')).status).toBe(403)
  })
})

describe('tài khoản — tạo', () => {
  it('trả mật khẩu tạm MỘT lần; người mới phải đổi mật khẩu trước khi làm việc', async () => {
    const qt = await quanTri()
    const { res, ten, kq } = await taoTaiKhoan(qt)
    expect(res.status).toBe(201)
    expect(kq.matKhauTam).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)
    expect(kq.taiKhoan).toMatchObject({ tenDangNhap: ten, phaiDoiMatKhau: true, trangThai: 'hoat-dong' })

    const { agent, res: vao } = await dangNhap(ten, kq.matKhauTam)
    expect(vao.status).toBe(200)
    expect((vao.body as ThongTinToi).phaiDoiMatKhau).toBe(true)
    const chan = await agent.get('/api/nhat-ky')
    expect(chan.status).toBe(403)
    expect((chan.body as { message: string }).message).toMatch(/đổi mật khẩu/)

    const doi = await agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: kq.matKhauTam, matKhauMoi: 'mat-khau-rieng-cua-toi' })
    expect(doi.status).toBe(200)
    expect((doi.body as ThongTinToi).phaiDoiMatKhau).toBe(false)
    // Vé mới đi kèm phản hồi — không phải chờ 15 phút.
    expect((await agent.get('/api/nhat-ky')).status).toBe(200)
  })

  it('đổi sang đúng mật khẩu cũ thì 400', async () => {
    const qt = await quanTri()
    const { ten, kq } = await taoTaiKhoan(qt)
    const { agent } = await dangNhap(ten, kq.matKhauTam)
    const doi = await agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: kq.matKhauTam, matKhauMoi: kq.matKhauTam })
    expect(doi.status).toBe(400)
  })

  it('không tạo được vào đơn vị ngoài phạm vi', async () => {
    const qt = await quanTri()
    expect((await taoTaiKhoan(qt, { donViId: MAU.XA_B })).res.status).toBe(400)
  })

  it('trùng tên với tài khoản ở đơn vị KHÁC (không nhìn thấy) thì 409', async () => {
    const qt = await quanTri()
    const { res } = await taoTaiKhoan(qt, { tenDangNhap: 'CANBO.B' })
    expect(res.status).toBe(409)
  })

  it('tên đăng nhập sai dạng thì 400', async () => {
    const qt = await quanTri()
    expect((await taoTaiKhoan(qt, { tenDangNhap: 'có dấu' })).res.status).toBe(400)
  })

  it('phân công sai luật thì 400: Chuyên viên vào Giám sát, phân công vào Tầng 2, vai lạ, lặp vai', async () => {
    const qt = await quanTri()
    const sai = [
      [{ vai: 'CHUYEN_VIEN', phamVi: ['nhat-ky'] }],
      [{ vai: 'LANH_DAO', phamVi: ['qt-tai-khoan'] }],
      [{ vai: 'SIEU_NHAN', phamVi: 'tat-ca' }],
      [
        { vai: 'LANH_DAO', phamVi: 'tat-ca' },
        { vai: 'LANH_DAO', phamVi: ['nhat-ky'] },
      ],
    ]
    for (const phanCong of sai) expect((await taoTaiKhoan(qt, { phanCong })).res.status).toBe(400)
  })
})

describe('tài khoản — khóa, đặt lại mật khẩu, phân công', () => {
  it('khóa: phiên đang có bị thu hồi, không đăng nhập được; mở khóa thì vào lại được', async () => {
    const qt = await quanTri()
    const { ten, kq } = await taoTaiKhoan(qt)
    const { agent } = await dangNhap(ten, kq.matKhauTam)

    const khoa = await qt.post(`/api/tai-khoan/${kq.taiKhoan.id}/khoa`).set(GHI)
    expect(khoa.status).toBe(200)
    expect((khoa.body as TaiKhoanDong).trangThai).toBe('khoa')
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(401)
    expect((await dangNhap(ten, kq.matKhauTam)).res.status).toBe(403)

    expect((await qt.post(`/api/tai-khoan/${kq.taiKhoan.id}/mo-khoa`).set(GHI)).status).toBe(200)
    expect((await dangNhap(ten, kq.matKhauTam)).res.status).toBe(200)
  })

  it('không tự khóa mình, không tự bỏ cờ quản trị của mình', async () => {
    const qt = await quanTri()
    const toi = await idCua('quantri')
    expect((await qt.post(`/api/tai-khoan/${toi}/khoa`).set(GHI)).status).toBe(400)
    expect((await qt.patch(`/api/tai-khoan/${toi}`).set(GHI).send({ laQuanTri: false })).status).toBe(400)
    expect((await qt.post(`/api/tai-khoan/${toi}/dat-lai-mat-khau`).set(GHI)).status).toBe(400)
  })

  it('tài khoản ngoài phạm vi thì 404 — không lộ là có', async () => {
    const qt = await quanTri()
    const ngoai = await idCua('canbo.b')
    expect((await qt.post(`/api/tai-khoan/${ngoai}/khoa`).set(GHI)).status).toBe(404)
    expect((await qt.patch(`/api/tai-khoan/${ngoai}`).set(GHI).send({ hoTen: 'Sửa trộm' })).status).toBe(404)
    const [cb] = await db.chuBang.select().from(taiKhoan).where(eq(taiKhoan.id, ngoai))
    expect(cb).toMatchObject({ trangThai: 'hoat-dong', hoTen: 'Cán bộ xã Bình Minh' })
  })

  it('mã sai dạng thì 400 trước khi chạm database', async () => {
    const qt = await quanTri()
    expect((await qt.post('/api/tai-khoan/khong-phai-uuid/khoa').set(GHI)).status).toBe(400)
  })

  it('đặt lại mật khẩu: mật khẩu cũ hết dùng, phiên cũ bị thu hồi, phải đổi lại', async () => {
    const qt = await quanTri()
    const { ten, kq } = await taoTaiKhoan(qt)
    const { agent } = await dangNhap(ten, kq.matKhauTam)

    const res = await qt.post(`/api/tai-khoan/${kq.taiKhoan.id}/dat-lai-mat-khau`).set(GHI)
    expect(res.status).toBe(200)
    const moi = (res.body as KetQuaCapMatKhau).matKhauTam
    expect(moi).not.toBe(kq.matKhauTam)
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(401)
    expect((await dangNhap(ten, kq.matKhauTam)).res.status).toBe(401)
    const vao = await dangNhap(ten, moi)
    expect((vao.res.body as ThongTinToi).phaiDoiMatKhau).toBe(true)
  })

  it('đổi phân công: lần làm mới vé tới, quyền đổi theo', async () => {
    const qt = await quanTri()
    const cv = await idCua('chuyenvien.a')
    const { agent } = await dangNhap('chuyenvien.a')
    const truoc = ((await agent.get('/api/xac-thuc/toi')).body as ThongTinToi).quyen
    expect(truoc).not.toContain('NHAT_KY.READ')

    const res = await qt
      .put(`/api/tai-khoan/${cv}/phan-cong`)
      .set(GHI)
      .send({
        phanCong: [
          { vai: 'CHUYEN_VIEN', phamVi: 'tat-ca' },
          { vai: 'THANH_TRA', phamVi: ['nhat-ky'] },
        ],
      })
    expect(res.status).toBe(200)
    expect((res.body as TaiKhoanDong).phanCong.map((p) => p.vai)).toEqual(['CHUYEN_VIEN', 'THANH_TRA'])

    const sau = ((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).body as ThongTinToi).quyen
    expect(sau).toContain('NHAT_KY.READ')
  })

  it('sửa họ tên, mã Native', async () => {
    const qt = await quanTri()
    const { kq } = await taoTaiKhoan(qt)
    const res = await qt
      .patch(`/api/tai-khoan/${kq.taiKhoan.id}`)
      .set(GHI)
      .send({ hoTen: '  Tên đã sửa  ', nativeUserId: 'native-001' })
    expect(res.body).toMatchObject({ hoTen: 'Tên đã sửa', nativeUserId: 'native-001' })
    const xoa = await qt.patch(`/api/tai-khoan/${kq.taiKhoan.id}`).set(GHI).send({ nativeUserId: '' })
    expect((xoa.body as TaiKhoanDong).nativeUserId).toBeNull()
  })
})

describe('tài khoản — chặn ở database, không trông vào API', () => {
  it('người không có cờ quản trị gọi thẳng hàm thu hồi phiên của người khác → bị từ chối', async () => {
    const cv = await idCua('chuyenvien.a')
    const ct = await idCua('chutich.a')
    await expect(
      trongPhamVi(db.coSo, { taiKhoanId: cv, donViIds: [MAU.XA_A] }, (tx) =>
        tx.execute(sql`select phien_thu_hoi_tai_khoan(${ct}::uuid)`),
      ),
    ).rejects.toThrow()
  })

  it('quản trị cấp xã gọi thẳng hàm thu hồi phiên của tài khoản xã khác → bị từ chối', async () => {
    const qt = await idCua('quantri')
    const ngoai = await idCua('canbo.b')
    await expect(
      trongPhamVi(db.coSo, { taiKhoanId: qt, donViIds: [MAU.XA_A] }, (tx) =>
        tx.execute(sql`select phien_thu_hoi_tai_khoan(${ngoai}::uuid)`),
      ),
    ).rejects.toThrow()
  })

  it('thêm đơn vị dưới cha ngoài phạm vi → RLS từ chối', async () => {
    const qt = await idCua('quantri')
    await expect(
      trongPhamVi(db.coSo, { taiKhoanId: qt, donViIds: [MAU.XA_A] }, (tx) =>
        tx.insert(donVi).values({ ma: 'XA-LEN', ten: 'Xã lén', cap: 'xa', chaId: MAU.TINH }),
      ),
    ).rejects.toThrow()
  })
})

describe('đơn vị', () => {
  it('quản trị tỉnh thấy tỉnh và mọi xã, kèm số tài khoản', async () => {
    const qt = await quanTri('quantri.tinh')
    const ds = (await qt.get('/api/don-vi')).body as DonViDong[]
    expect(ds.map((d) => d.ma)).toEqual(expect.arrayContaining(['T01', 'XA-A', 'XA-B']))
    expect(ds[0]?.cap).toBe('tinh')
    expect(ds.find((d) => d.ma === 'XA-B')?.soTaiKhoan).toBe(1)
  })

  it('thêm xã dưới tỉnh; thấy ngay sau khi làm mới phiên', async () => {
    const qt = await quanTri('quantri.tinh')
    const res = await qt
      .post('/api/don-vi')
      .set(GHI)
      .send({ ma: 'xa-c', ten: 'Xã Cẩm Thành', chaId: MAU.TINH })
    expect(res.status).toBe(201)
    const { id } = res.body as { id: string }

    expect((await qt.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(200)
    const ds = (await qt.get('/api/don-vi')).body as DonViDong[]
    expect(ds.find((d) => d.id === id)).toMatchObject({ ma: 'XA-C', cap: 'xa', chaId: MAU.TINH })

    // Tạo được tài khoản cho xã mới luôn.
    const tk = await qt
      .post('/api/tai-khoan')
      .set(GHI)
      .send({ tenDangNhap: 'canbo.c', hoTen: 'Cán bộ xã C', donViId: id, phanCong: [] })
    expect(tk.status).toBe(201)
  })

  it('trùng mã thì 409; cha là xã thì 400; cha ngoài phạm vi thì 400', async () => {
    const tinh = await quanTri('quantri.tinh')
    expect(
      (await tinh.post('/api/don-vi').set(GHI).send({ ma: 'XA-A', ten: 'Trùng', chaId: MAU.TINH })).status,
    ).toBe(409)
    expect(
      (await tinh.post('/api/don-vi').set(GHI).send({ ma: 'THON-1', ten: 'Thôn', chaId: MAU.XA_A })).status,
    ).toBe(400)
    const xa = await quanTri()
    expect(
      (await xa.post('/api/don-vi').set(GHI).send({ ma: 'XA-Z', ten: 'Xã Z', chaId: MAU.TINH })).status,
    ).toBe(400)
  })

  it('sửa tên; quản trị cấp xã không sửa được đơn vị ngoài phạm vi', async () => {
    const tinh = await quanTri('quantri.tinh')
    const sua = await tinh.patch(`/api/don-vi/${MAU.XA_B}`).set(GHI).send({ ten: 'Xã Bình Minh Mới' })
    expect(sua.status).toBe(200)
    expect((sua.body as DonViDong).ten).toBe('Xã Bình Minh Mới')

    const xa = await quanTri()
    expect((await xa.patch(`/api/don-vi/${MAU.XA_B}`).set(GHI).send({ ten: 'Sửa trộm' })).status).toBe(404)
  })
})

describe('nhật ký thao tác', () => {
  it('ghi đủ việc quản trị đã làm, ai làm, không có mật khẩu', async () => {
    const { agent } = await dangNhap('chutich.a')
    const res = await agent.get('/api/nhat-ky?bang=tai_khoan&gioiHan=200')
    expect(res.status).toBe(200)
    const { dong } = res.body as TrangNhatKy
    expect(dong.some((d) => d.hanhDong === 'INSERT' && d.nguoiLam === 'Quản trị hệ thống')).toBe(true)
    expect(dong.some((d) => d.hanhDong === 'DOI_MAT_KHAU')).toBe(true)
    expect(dong.every((d) => d.bang === 'tai_khoan')).toBe(true)
    expect(JSON.stringify(dong)).not.toMatch(/mat_khau_bam|token_bam|argon2/)
  })

  it('xã chỉ thấy nhật ký của xã mình', async () => {
    const { agent } = await dangNhap('chutich.a')
    const { dong } = (await agent.get('/api/nhat-ky?gioiHan=200')).body as TrangNhatKy
    expect(dong.length).toBeGreaterThan(0)
    expect(dong.every((d) => d.donViTen === 'Xã An Hòa')).toBe(true)
  })

  it('phân trang theo mã: trang sau nối tiếp, không trùng', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    const t1 = (await agent.get('/api/nhat-ky?gioiHan=3')).body as TrangNhatKy
    expect(t1.dong).toHaveLength(3)
    expect(t1.tiep).not.toBeNull()
    const t2 = (await agent.get(`/api/nhat-ky?gioiHan=3&truoc=${t1.tiep}`)).body as TrangNhatKy
    expect(Math.max(...t2.dong.map((d) => d.id))).toBeLessThan(Math.min(...t1.dong.map((d) => d.id)))
  })

  it('lọc theo ngày: ngày mai chưa có gì', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    const mai = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10)
    const { dong } = (await agent.get(`/api/nhat-ky?tu=${mai}`)).body as TrangNhatKy
    expect(dong).toEqual([])
  })

  it('tham số sai thì 400; cờ quản trị không có quyền đọc nhật ký nghiệp vụ', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    for (const q of ['gioiHan=0', 'gioiHan=abc', 'bang=mat_khau', 'tu=30-09-2026', 'truoc=-1'])
      expect((await agent.get(`/api/nhat-ky?${q}`)).status).toBe(400)
    const qt = await quanTri()
    expect((await qt.get('/api/nhat-ky')).status).toBe(403)
  })
})

describe('mã quyền khai ở controller', () => {
  it('mọi @CanQuyen đều là mã có thật trong registry — gõ sai là đỏ', () => {
    const coThat = tinhQuyen(
      DANH_SACH_MODULE,
      MA_VAI.map((vai) => ({ vai, phamVi: 'tat-ca' as const })),
      true,
    )
    const khai: string[] = []
    for (const C of [
      TaiKhoanController,
      DonViController,
      NhatKyController,
      XacThucController,
      ThietLapController,
      DuAnController,
      HoSoDuAnController,
      XuyenSuotController,
    ]) {
      for (const ten of Object.getOwnPropertyNames(C.prototype)) {
        const q = Reflect.getMetadata(
          'gdos:can-quyen',
          (C.prototype as unknown as Record<string, object>)[ten]!,
        ) as string[] | undefined
        if (q) khai.push(...q)
      }
    }
    expect(khai.length).toBeGreaterThan(5)
    expect(khai.filter((q) => !coThat.has(q))).toEqual([])
  })
})
