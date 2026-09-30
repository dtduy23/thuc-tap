/**
 * Đóng góp của Dự án cho nhóm xuyên suốt (ADR-0007): cảnh báo ở Giám sát, "Việc của
 * tôi" ở trang chủ, đôn đốc. HTTP thật → Postgres thật (PGlite).
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { congNgay, homNay, type DongCanhBao, type DotDonDoc, type HoSoDuAn, type MucViec } from '@gdos/shared'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { duAn } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
let db: CoSoThu
let app: INestApplication
let cu: HoSoDuAn // bắt đầu từ lâu → có bước quá hạn
let moi: HoSoDuAn // bắt đầu hôm nay → bước đầu sắp đến hạn

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
  const tao = async (ten: string, ngayBatDau: string) =>
    (
      await cv
        .post('/api/du-an')
        .set(GHI)
        .send({ ten, donViId: MAU.XA_A, quyTrinhMa: 'mua-sam', loaiChi: 'dtpt', ngayBatDau })
    ).body as HoSoDuAn
  cu = await tao('Dự án cũ đang chậm', congNgay(homNay(), -400))
  moi = await tao('Dự án mới bắt đầu', homNay())
  // Dự án cũ: lâu không ai cập nhật.
  await db.chuBang
    .update(duAn)
    .set({ capNhatNgay: congNgay(homNay(), -40) })
    .where(eq(duAn.id, cu.id))
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

describe('cảnh báo — Giám sát › Hồ sơ quá hạn', () => {
  it('quá hạn: bước của dự án cũ, kèm số ngày trễ và liên kết mở thẳng checklist', async () => {
    const ct = await vao('chutich.a')
    const ds = (await ct.get('/api/canh-bao?loai=qua-han')).body as DongCanhBao[]
    expect(ds.length).toBeGreaterThan(0)
    expect(ds.every((d) => d.hoSoId === cu.id && d.soNgay > 0 && d.nghiepVu === 'Dự án')).toBe(true)
    expect(ds[0]!.lienKet).toBe(`/du-an/${cu.id}?the=checklist`)
  })

  it('sắp đến hạn: bước đầu của dự án mới; lâu không cập nhật: dự án cũ (40 ngày)', async () => {
    const ct = await vao('chutich.a')
    const sap = (await ct.get('/api/canh-bao?loai=sap-han')).body as DongCanhBao[]
    expect(sap.some((d) => d.hoSoId === moi.id)).toBe(true)
    const lau = (await ct.get('/api/canh-bao?loai=lau-khong-cap-nhat')).body as DongCanhBao[]
    expect(lau.map((d) => d.hoSoId)).toEqual([cu.id])
    expect(lau[0]!.soNgay).toBe(40)
  })

  it('chuyên viên không vào Giám sát; xã khác không thấy; loại lạ 400', async () => {
    expect((await (await vao('chuyenvien.a')).get('/api/canh-bao?loai=qua-han')).status).toBe(403)
    const tinh = await vao('lanhdao.tinh')
    expect(((await tinh.get('/api/canh-bao?loai=qua-han')).body as DongCanhBao[]).length).toBeGreaterThan(0)
    expect((await tinh.get('/api/canh-bao?loai=bat-ky')).status).toBe(400)
  })
})

describe('đôn đốc + việc của tôi', () => {
  it('cán bộ phụ trách thấy bước quá hạn trong "Việc của tôi", quá hạn xếp trước', async () => {
    const cv = await vao('chuyenvien.a')
    const viec = (await cv.get('/api/viec-cua-toi')).body as MucViec[]
    expect(viec.length).toBeGreaterThan(0)
    expect(viec[0]).toMatchObject({ nguon: 'du-an-buoc', mucDo: 'qua-han', hoSoTen: 'Dự án cũ đang chậm' })
    expect(viec.some((v) => v.mucDo === 'sap-han' && v.hoSoTen === 'Dự án mới bắt đầu')).toBe(true)
  })

  it('lãnh đạo đôn đốc → lịch sử có đợt; cán bộ phụ trách thấy "bị đôn đốc"; chuyên viên không đôn đốc được', async () => {
    const ct = await vao('chutich.a')
    const res = await ct
      .post('/api/du-an/don-doc')
      .set(GHI)
      .send({ duAnIds: [cu.id], noiDung: 'Đề nghị đẩy nhanh bước thẩm định giá' })
    expect(res.status).toBe(201)
    expect((res.body as { soDuAn: number }).soDuAn).toBe(1)
    const ls = (await ct.get('/api/du-an/don-doc')).body as DotDonDoc[]
    expect(ls[0]).toMatchObject({
      noiDung: 'Đề nghị đẩy nhanh bước thẩm định giá',
      nguoiGui: 'Chủ tịch xã An Hòa',
    })
    expect(ls[0]!.duAn.map((d) => d.id)).toEqual([cu.id])

    const cv = await vao('chuyenvien.a')
    const viec = (await cv.get('/api/viec-cua-toi')).body as MucViec[]
    expect(viec.some((v) => v.nguon === 'du-an-don-doc' && v.hoSoTen === 'Dự án cũ đang chậm')).toBe(true)
    expect(
      (
        await cv
          .post('/api/du-an/don-doc')
          .set(GHI)
          .send({ duAnIds: [cu.id], noiDung: 'x' })
      ).status,
    ).toBe(403)
  })

  it('không đôn đốc dự án ngoài phạm vi; danh sách rỗng hoặc mã sai thì 400', async () => {
    const b = await (async () => {
      const agent = await vao('canbo.b')
      return agent
    })()
    // canbo.b là Chuyên viên (không ASSIGN) → 403 ngay ở guard.
    expect(
      (
        await b
          .post('/api/du-an/don-doc')
          .set(GHI)
          .send({ duAnIds: [cu.id], noiDung: 'x' })
      ).status,
    ).toBe(403)
    const tinh = await vao('lanhdao.tinh')
    expect((await tinh.post('/api/du-an/don-doc').set(GHI).send({ duAnIds: [], noiDung: 'x' })).status).toBe(
      400,
    )
    expect(
      (
        await tinh
          .post('/api/du-an/don-doc')
          .set(GHI)
          .send({ duAnIds: ['sai'], noiDung: 'x' })
      ).status,
    ).toBe(400)
    // Tỉnh đôn đốc được dự án của xã trực thuộc.
    expect(
      (
        await tinh
          .post('/api/du-an/don-doc')
          .set(GHI)
          .send({ duAnIds: [moi.id], noiDung: 'Theo dõi sát' })
      ).status,
    ).toBe(201)
  })

  it('người không có quyền Dự án: "Việc của tôi" rỗng, không lỗi', async () => {
    const qt = await vao('quantri')
    expect((await qt.get('/api/viec-cua-toi')).body).toEqual([])
  })
})
