/**
 * Giám sát theo lĩnh vực (0017/0018): tài khoản được giao lĩnh vực THẤY dự án của
 * lĩnh vực đó ở đơn vị khác — chỉ xem. HTTP thật → Postgres thật (PGlite).
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { DuAnDong, GiaTriDanhMuc, HoSoDuAn, TaiKhoanDong } from '@gdos/shared'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
let db: CoSoThu
let app: INestApplication
let coLinhVuc: HoSoDuAn
let khongLinhVuc: HoSoDuAn
let lv: GiaTriDanhMuc
let canBoB: TaiKhoanDong

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

  const cv = await vao('chuyenvien.a')
  lv = ((await cv.get('/api/danh-muc?loai=linh-vuc')).body as GiaTriDanhMuc[])[0]!
  const tao = async (ten: string, linhVucId?: string) =>
    (
      await cv.post('/api/du-an').set(GHI).send({
        ten,
        donViId: MAU.XA_A,
        quyTrinhMa: 'mua-sam',
        loaiChi: 'dtpt',
        ngayBatDau: '2026-01-01',
        linhVucId,
      })
    ).body as HoSoDuAn
  coLinhVuc = await tao('Dự án có lĩnh vực', lv.id)
  khongLinhVuc = await tao('Dự án chưa phân lĩnh vực')
  const qt = await vao('quantri.tinh')
  canBoB = ((await qt.get('/api/tai-khoan')).body as TaiKhoanDong[]).find((t) => t.tenDangNhap === 'canbo.b')!
}, 60_000)

afterAll(async () => {
  await app.close()
  await db.pg.close()
})

async function vao(ten: string) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent
    .post('/api/xac-thuc/dang-nhap')
    .set(GHI)
    .send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU })
  expect(res.status).toBe(200)
  return agent
}

const tenDuAn = async (agent: request.Agent) =>
  ((await agent.get('/api/du-an')).body as DuAnDong[]).map((d) => d.ten)

describe('giám sát theo lĩnh vực', () => {
  it('chưa giao: cán bộ xã B không thấy dự án của xã A', async () => {
    expect(await tenDuAn(await vao('canbo.b'))).toEqual([])
  })

  it('giao lĩnh vực: thấy dự án của lĩnh vực đó (không thấy dự án khác), chỉ xem', async () => {
    const qt = await vao('quantri.tinh')
    const res = await qt
      .put(`/api/tai-khoan/${canBoB.id}/giam-sat`)
      .set(GHI)
      .send({ linhVucIds: [lv.id] })
    expect(res.status).toBe(200)
    expect((res.body as TaiKhoanDong).giamSatLinhVuc).toEqual([{ id: lv.id, ten: lv.ten }])

    const b = await vao('canbo.b')
    expect(await tenDuAn(b)).toEqual(['Dự án có lĩnh vực'])
    const hs = (await b.get(`/api/du-an/${coLinhVuc.id}`)).body as HoSoDuAn
    expect(hs.buoc.length).toBeGreaterThan(0)
    expect(hs.quyen).toEqual({ sua: false, xacNhan: false, gui: false, thanhVien: false, xinGiaHan: false })
    expect((await b.get(`/api/du-an/${khongLinhVuc.id}`)).status).toBe(404)
    // Không sửa được — service chặn, RLS cũng chặn.
    expect((await b.patch(`/api/du-an/${coLinhVuc.id}`).set(GHI).send({ ten: 'Đổi tên' })).status).toBe(403)
  })

  it('bỏ giao: hết thấy ngay; quản trị xã A không giao được cho tài khoản xã B', async () => {
    const qt = await vao('quantri.tinh')
    await qt.put(`/api/tai-khoan/${canBoB.id}/giam-sat`).set(GHI).send({ linhVucIds: [] })
    expect(await tenDuAn(await vao('canbo.b'))).toEqual([])

    const qtXa = await vao('quantri')
    const res = await qtXa
      .put(`/api/tai-khoan/${canBoB.id}/giam-sat`)
      .set(GHI)
      .send({ linhVucIds: [lv.id] })
    expect(res.status).toBe(404)
  })

  it('lĩnh vực không có → 400', async () => {
    const qt = await vao('quantri.tinh')
    const res = await qt
      .put(`/api/tai-khoan/${canBoB.id}/giam-sat`)
      .set(GHI)
      .send({ linhVucIds: ['00000000-0000-4000-8000-000000000099'] })
    expect(res.status).toBe(400)
  })
})
