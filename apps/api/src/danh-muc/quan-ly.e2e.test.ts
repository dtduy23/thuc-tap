/**
 * Quản lý danh mục, quy trình mẫu: chỉ đơn vị gốc ghi; không xóa giá trị đang dùng
 * (đếm toàn hệ thống); quy trình theo luật chỉ nhân bản. HTTP thật → PGlite.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  DANH_SACH_MODULE,
  QUYEN_DANH_MUC,
  type BuocMau,
  type DanhMucQuanLy,
  type HoSoDuAn,
  type QuyTrinhMauChiTiet,
} from '@gdos/shared'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { phanCong, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
let db: CoSoThu
let app: INestApplication

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  // Chuyên viên ở ĐƠN VỊ GỐC (tỉnh) — người duy nhất sửa được Danh mục nghiệp vụ.
  const [mau] = await db.chuBang
    .select({ bam: taiKhoan.matKhauBam })
    .from(taiKhoan)
    .where(eq(taiKhoan.tenDangNhap, 'chuyenvien.a'))
  const [cv] = await db.chuBang
    .insert(taiKhoan)
    .values({
      tenDangNhap: 'chuyenvien.tinh',
      hoTen: 'Chuyên viên tỉnh',
      donViId: MAU.TINH,
      matKhauBam: mau!.bam,
    })
    .returning({ id: taiKhoan.id })
  await db.chuBang
    .insert(phanCong)
    .values({ taiKhoanId: cv!.id, donViId: MAU.TINH, vai: 'CHUYEN_VIEN', phamVi: null })

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

async function vao(ten: string) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent
    .post('/api/xac-thuc/dang-nhap')
    .set(GHI)
    .send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU })
  expect(res.status).toBe(200)
  return agent
}

describe('giá trị danh mục', () => {
  it('mã quyền của từng loại danh mục là module có thật', () => {
    const co = new Set(DANH_SACH_MODULE.map((m) => m.maQuyen))
    expect(Object.values(QUYEN_DANH_MUC).filter((q) => !co.has(q))).toEqual([])
  })

  it('đơn vị gốc: thêm, đổi tên, đổi thứ tự, xóa giá trị chưa dùng', async () => {
    const cv = await vao('chuyenvien.tinh')
    const ds0 = (await cv.get('/api/quan-ly-danh-muc?loai=linh-vuc')).body as DanhMucQuanLy
    expect(ds0.suaDuoc).toBe(true)
    let res = await cv
      .post('/api/quan-ly-danh-muc')
      .set(GHI)
      .send({ loai: 'linh-vuc', ma: 'nong-nghiep', ten: 'Nông nghiệp' })
    expect(res.status).toBe(201)
    const moi = (res.body as DanhMucQuanLy).ds.find((d) => d.ma === 'nong-nghiep')!
    expect(moi).toMatchObject({ ten: 'Nông nghiệp', soDung: 0 })
    res = await cv
      .patch(`/api/quan-ly-danh-muc/${moi.id}`)
      .set(GHI)
      .send({ ten: 'Nông nghiệp, nông thôn', thuTu: 0 })
    expect((res.body as DanhMucQuanLy).ds[0]!.ten).toBe('Nông nghiệp, nông thôn')
    res = await cv.post(`/api/quan-ly-danh-muc/${moi.id}/xoa`).set(GHI)
    expect(res.status).toBe(200)
    expect((res.body as DanhMucQuanLy).ds.some((d) => d.id === moi.id)).toBe(false)
    // Mã sai dạng, mã trùng.
    expect(
      (await cv.post('/api/quan-ly-danh-muc').set(GHI).send({ loai: 'linh-vuc', ma: 'Có Dấu', ten: 'x' }))
        .status,
    ).toBe(400)
    const trung = ds0.ds[0]!.ma
    expect(
      (await cv.post('/api/quan-ly-danh-muc').set(GHI).send({ loai: 'linh-vuc', ma: trung, ten: 'x' }))
        .status,
    ).toBe(409)
  })

  it('giá trị đang dùng ở đơn vị khác (không thấy) vẫn không xóa được', async () => {
    const cvA = await vao('chuyenvien.a')
    const tinh = await vao('chuyenvien.tinh')
    const lv = ((await tinh.get('/api/quan-ly-danh-muc?loai=linh-vuc')).body as DanhMucQuanLy).ds[0]!
    await cvA.post('/api/du-an').set(GHI).send({
      ten: 'Dự án xã A',
      donViId: MAU.XA_A,
      quyTrinhMa: 'mua-sam',
      loaiChi: 'dtpt',
      ngayBatDau: '2026-01-01',
      linhVucId: lv.id,
    })
    const res = await tinh.post(`/api/quan-ly-danh-muc/${lv.id}/xoa`).set(GHI)
    expect(res.status).toBe(409)
    expect((res.body as { message: string }).message).toMatch(/đang được dùng ở 1 chỗ/)
  })

  it('đơn vị xã: xem được, không sửa được (danh mục dùng chung toàn hệ thống)', async () => {
    const cvA = await vao('chuyenvien.a')
    const ds = (await cvA.get('/api/quan-ly-danh-muc?loai=linh-vuc')).body as DanhMucQuanLy
    expect(ds.suaDuoc).toBe(false)
    const res = await cvA
      .post('/api/quan-ly-danh-muc')
      .set(GHI)
      .send({ loai: 'linh-vuc', ma: 'y-te-xa', ten: 'Y tế xã' })
    expect(res.status).toBe(403)
    expect((res.body as { message: string }).message).toMatch(/đơn vị gốc/)
  })

  it('nguồn vốn là tham số Tầng 2: quản trị sửa được, chuyên viên thì không', async () => {
    const qt = await vao('quantri.tinh')
    const res = await qt
      .post('/api/quan-ly-danh-muc')
      .set(GHI)
      .send({ loai: 'nguon-von', ma: 'vien-tro', ten: 'Viện trợ' })
    expect(res.status).toBe(201)
    const cv = await vao('chuyenvien.tinh')
    expect((await cv.get('/api/quan-ly-danh-muc?loai=nguon-von')).status).toBe(403)
  })
})

describe('quy trình mẫu', () => {
  it('quy trình theo luật: xem được bước, không sửa, không xóa — chỉ nhân bản', async () => {
    const cv = await vao('chuyenvien.tinh')
    const q = (await cv.get('/api/quy-trinh-mau/mua-sam')).body as QuyTrinhMauChiTiet
    expect(q).toMatchObject({ khoa: true, suaDuoc: false })
    expect(q.buoc.length).toBe(q.soBuoc)
    expect((await cv.put('/api/quy-trinh-mau/mua-sam').set(GHI).send({ ten: 'x' })).status).toBe(403)
    expect((await cv.post('/api/quy-trinh-mau/mua-sam/xoa').set(GHI)).status).toBe(403)
  })

  it('nhân bản → sửa bản sao (bước, tên) → dự án tạo theo bản sao dùng bước mới; đang dùng thì không xóa', async () => {
    const cv = await vao('chuyenvien.tinh')
    let res = await cv
      .post('/api/quy-trinh-mau/mua-sam/nhan-ban')
      .set(GHI)
      .send({ ma: 'mua-sam-gon', ten: 'Mua sắm rút gọn' })
    expect(res.status).toBe(201)
    const ban = res.body as QuyTrinhMauChiTiet
    expect(ban).toMatchObject({ khoa: false, suaDuoc: true, soDung: 0 })

    const buoc: BuocMau[] = [
      {
        gd: 'I',
        stt: 'I',
        nhom: true,
        ten: 'Chuẩn bị',
        soNgay: 0,
        donVi: '',
        ben: 'chu-dau-tu',
        vanBan: '',
        cha: null,
      },
      {
        gd: 'I',
        stt: '1',
        nhom: false,
        ten: 'Lập dự toán',
        soNgay: 5,
        donVi: '',
        ben: 'chu-dau-tu',
        vanBan: '',
        cha: 0,
      },
      {
        gd: 'II',
        stt: '2',
        nhom: false,
        ten: 'Mua sắm',
        soNgay: 10,
        donVi: '',
        ben: 'nha-thau',
        vanBan: '',
        cha: null,
      },
    ]
    // cha trỏ tới bước không phải nhóm → 400.
    const sai = await cv
      .put('/api/quy-trinh-mau/mua-sam-gon')
      .set(GHI)
      .send({ buoc: [buoc[1], { ...buoc[2], cha: 0 }] })
    expect(sai.status).toBe(400)
    res = await cv.put('/api/quy-trinh-mau/mua-sam-gon').set(GHI).send({ ten: 'Mua sắm gọn', buoc })
    expect(res.status).toBe(200)
    expect((res.body as QuyTrinhMauChiTiet).soBuoc).toBe(3)

    const cvA = await vao('chuyenvien.a')
    const hs = (
      await cvA.post('/api/du-an').set(GHI).send({
        ten: 'Theo quy trình gọn',
        donViId: MAU.XA_A,
        quyTrinhMa: 'mua-sam-gon',
        loaiChi: 'dtpt',
        ngayBatDau: '2026-01-01',
      })
    ).body as HoSoDuAn
    expect(hs.buoc.map((b) => b.ten)).toEqual(['Chuẩn bị', 'Lập dự toán', 'Mua sắm'])
    expect(hs.buoc[1]!.chaId).toBe(hs.buoc[0]!.id)

    const xoa = await cv.post('/api/quy-trinh-mau/mua-sam-gon/xoa').set(GHI)
    expect(xoa.status).toBe(409)
    // Xã không nhân bản được.
    expect(
      (await cvA.post('/api/quy-trinh-mau/mua-sam/nhan-ban').set(GHI).send({ ma: 'cua-xa', ten: 'Của xã' }))
        .status,
    ).toBe(403)
  })
})
