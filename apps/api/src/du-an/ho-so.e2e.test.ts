/**
 * Hồ sơ dự án — văn bản (tải lên / tải về thật qua kho tệp), kế hoạch vốn, đợt giải
 * ngân, vướng mắc, nhật ký theo dự án. HTTP thật → Postgres thật (PGlite) + thư mục tạm.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { DuAnDong, GiaTriDanhMuc, HoSoDuAn, TaiKhoanDanhBa, TrangNhatKy } from '@gdos/shared'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { donVi, phanCong, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { bamMatKhau } from '../xac-thuc/mat-khau.js'

const DN = '00000000-0000-4000-8000-0000000000d1'
const GHI = { 'X-GDOS': '1' }

let db: CoSoThu
let app: INestApplication
let thuMuc: string

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  await db.chuBang
    .insert(donVi)
    .values({ id: DN, ma: 'DN-01', ten: 'Công ty Thử Nghiệm', cap: 'doanh-nghiep', chaId: MAU.TINH })
  const [nt] = await db.chuBang
    .insert(taiKhoan)
    .values({
      tenDangNhap: 'nhathau.dn',
      hoTen: 'Nhà thầu thử',
      donViId: DN,
      matKhauBam: await bamMatKhau(MAU.MAT_KHAU),
    })
    .returning({ id: taiKhoan.id })
  await db.chuBang
    .insert(phanCong)
    .values({ taiKhoanId: nt!.id, donViId: DN, vai: 'CHUYEN_VIEN', phamVi: ['du-an'] })

  thuMuc = await mkdtemp(join(tmpdir(), 'gdos-tep-'))
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CAU_HINH)
    .useValue(docCauHinh({ NODE_ENV: 'test', KHO_TEP_THU_MUC: thuMuc }))
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
  await rm(thuMuc, { recursive: true, force: true })
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

let hs: HoSoDuAn
let nguonVon: GiaTriDanhMuc[]

beforeAll(async () => {
  const cv = await vao('chuyenvien.a')
  hs = (
    await cv.post('/api/du-an').set(GHI).send({
      ten: 'Dự án thử hồ sơ',
      donViId: MAU.XA_A,
      quyTrinhMa: 'mua-sam',
      loaiChi: 'dtpt',
      tongMuc: 1000,
      ngayBatDau: '2026-01-05',
    })
  ).body as HoSoDuAn
  nguonVon = (await cv.get('/api/danh-muc?loai=nguon-von')).body as GiaTriDanhMuc[]
  const [nt] = (await cv.get('/api/danh-ba?tim=nhathau')).body as TaiKhoanDanhBa[]
  await cv.post(`/api/du-an/${hs.id}/thanh-vien`).set(GHI).send({ taiKhoanId: nt!.id, vaiTro: 'nha-thau' })
}, 60_000)

describe('văn bản', () => {
  const NOI_DUNG = Buffer.from('%PDF-1.4 nội dung thử')

  it('tải lên kèm thông tin văn bản, gắn bước; tải về đúng nội dung, đúng tên tiếng Việt', async () => {
    const cv = await vao('chuyenvien.a')
    const buoc = hs.buoc.find((b) => !b.laNhom)!
    const res = await cv
      .post(`/api/du-an/${hs.id}/van-ban`)
      .set(GHI)
      .field('soKyHieu', '12/QĐ-UBND')
      .field('ngayKy', '2026-01-10')
      .field('buocId', buoc.id)
      .attach('tep', NOI_DUNG, 'Quyết định phê duyệt.pdf')
    expect(res.status).toBe(201)
    const vb = (res.body as HoSoDuAn).vanBan[0]!
    expect(vb).toMatchObject({
      tenTep: 'Quyết định phê duyệt.pdf',
      soKyHieu: '12/QĐ-UBND',
      ngayKy: '2026-01-10',
      buocId: buoc.id,
      kichThuoc: NOI_DUNG.length,
      nguoiTai: 'Chuyên viên xã An Hòa',
    })
    const tai = await cv
      .get(`/api/du-an/${hs.id}/van-ban/${vb.id}/tai`)
      .buffer(true)
      .parse((r, cb) => {
        const ds: Buffer[] = []
        r.on('data', (c: Buffer) => ds.push(c))
        r.on('end', () => cb(null, Buffer.concat(ds)))
      })
    expect(tai.status).toBe(200)
    expect(Buffer.compare(tai.body as Buffer, NOI_DUNG)).toBe(0)
    expect(tai.headers['content-disposition']).toContain(
      `filename*=UTF-8''${encodeURIComponent('Quyết định phê duyệt.pdf')}`,
    )
    expect(tai.headers['x-content-type-options']).toBe('nosniff')
    hs = res.body as HoSoDuAn
  })

  it('từ chối tệp chạy được, thiếu tệp; thành viên nhà thầu tải về được nhưng không tải lên; xã khác không thấy', async () => {
    const cv = await vao('chuyenvien.a')
    expect(
      (await cv.post(`/api/du-an/${hs.id}/van-ban`).set(GHI).attach('tep', Buffer.from('MZ'), 'cai-dat.exe'))
        .status,
    ).toBe(400)
    expect((await cv.post(`/api/du-an/${hs.id}/van-ban`).set(GHI).field('soKyHieu', 'x')).status).toBe(400)
    const vb = hs.vanBan[0]!
    const nt = await vao('nhathau.dn')
    expect((await nt.get(`/api/du-an/${hs.id}/van-ban/${vb.id}/tai`)).status).toBe(200)
    expect(
      (await nt.post(`/api/du-an/${hs.id}/van-ban`).set(GHI).attach('tep', NOI_DUNG, 'a.pdf')).status,
    ).toBe(403)
    const b = await vao('canbo.b')
    expect((await b.get(`/api/du-an/${hs.id}/van-ban/${vb.id}/tai`)).status).toBe(404)
  })

  it('sửa thông tin văn bản, xóa mềm', async () => {
    const cv = await vao('chuyenvien.a')
    const vb = hs.vanBan[0]!
    const sua = (
      await cv.patch(`/api/du-an/${hs.id}/van-ban/${vb.id}`).set(GHI).send({ nguoiKy: 'Chủ tịch UBND xã' })
    ).body as HoSoDuAn
    expect(sua.vanBan[0]!.nguoiKy).toBe('Chủ tịch UBND xã')
    const xoa = (await cv.post(`/api/du-an/${hs.id}/van-ban/${vb.id}/xoa`).set(GHI)).body as HoSoDuAn
    expect(xoa.vanBan).toHaveLength(0)
    expect((await cv.get(`/api/du-an/${hs.id}/van-ban/${vb.id}/tai`)).status).toBe(404)
  })
})

describe('kinh phí & giải ngân', () => {
  it('kế hoạch vốn theo năm × nguồn; trùng năm-nguồn thì 400; nguồn không phải nguồn vốn thì 400', async () => {
    const cv = await vao('chuyenvien.a')
    const ns = nguonVon[0]!
    const lan1 = await cv
      .post(`/api/du-an/${hs.id}/von`)
      .set(GHI)
      .send({ nam: 2026, nguonVonId: ns.id, keHoach: 400 })
    expect(lan1.status).toBe(201)
    await cv.post(`/api/du-an/${hs.id}/von`).set(GHI).send({ nam: 2027, nguonVonId: ns.id, keHoach: 600 })
    expect(
      (await cv.post(`/api/du-an/${hs.id}/von`).set(GHI).send({ nam: 2026, nguonVonId: ns.id, keHoach: 1 }))
        .status,
    ).toBe(400)
    const lv = ((await cv.get('/api/danh-muc?loai=linh-vuc')).body as GiaTriDanhMuc[])[0]!
    expect(
      (await cv.post(`/api/du-an/${hs.id}/von`).set(GHI).send({ nam: 2028, nguonVonId: lv.id, keHoach: 1 }))
        .status,
    ).toBe(400)
  })

  it('giải ngân cộng từ các đợt; phần trăm theo tổng mức và theo kế hoạch tới năm nay', async () => {
    const cv = await vao('chuyenvien.a')
    const ns = nguonVon[0]!
    await cv
      .post(`/api/du-an/${hs.id}/giai-ngan`)
      .set(GHI)
      .send({ nam: 2026, nguonVonId: ns.id, ngay: '2026-03-01', soTien: 150, dot: 'Đợt 1' })
    const res = await cv
      .post(`/api/du-an/${hs.id}/giai-ngan`)
      .set(GHI)
      .send({ nam: 2026, nguonVonId: ns.id, ngay: '2026-06-01', soTien: 50, dot: 'Đợt 2' })
    const moi = res.body as HoSoDuAn
    expect(moi.giaiNgan).toHaveLength(2)
    expect(moi.taiChinh).toMatchObject({ keHoach: 1000, daGiaiNgan: 200, phanTramTongMuc: 20 })
    expect(
      (
        await cv
          .post(`/api/du-an/${hs.id}/giai-ngan`)
          .set(GHI)
          .send({ nam: 2026, nguonVonId: ns.id, ngay: '2026-06-01', soTien: 0 })
      ).status,
    ).toBe(400)
    const ds = (await cv.get('/api/du-an')).body as DuAnDong[]
    expect(ds.find((d) => d.id === hs.id)?.daGiaiNgan).toBe(200)
    hs = moi
  })
})

describe('vướng mắc', () => {
  it('nêu → danh sách đếm vướng mắc mở; giải quyết (phải có kết quả) → hết; mở lại được', async () => {
    const cv = await vao('chuyenvien.a')
    const neu = (
      await cv.post(`/api/du-an/${hs.id}/vuong-mac`).set(GHI).send({ noiDung: 'Chậm bàn giao mặt bằng' })
    ).body as HoSoDuAn
    const vm = neu.vuongMac[0]!
    expect(vm).toMatchObject({
      noiDung: 'Chậm bàn giao mặt bằng',
      ngayGiaiQuyet: null,
      nguoiNeu: 'Chuyên viên xã An Hòa',
    })
    const ct = await vao('chutich.a')
    expect(((await ct.get('/api/du-an')).body as DuAnDong[]).find((d) => d.id === hs.id)?.vuongMacMo).toBe(1)
    expect(
      (
        await cv
          .post(`/api/du-an/${hs.id}/vuong-mac/${vm.id}/giai-quyet`)
          .set(GHI)
          .send({ ngay: '2026-02-01' })
      ).status,
    ).toBe(400)
    const gq = (
      await cv
        .post(`/api/du-an/${hs.id}/vuong-mac/${vm.id}/giai-quyet`)
        .set(GHI)
        .send({ ngay: '2026-02-01', ketQua: 'Đã bàn giao' })
    ).body as HoSoDuAn
    expect(gq.vuongMac[0]).toMatchObject({ ngayGiaiQuyet: '2026-02-01', ketQua: 'Đã bàn giao' })
    expect(gq.vuongMacMo).toBe(0)
    const mo = (await cv.post(`/api/du-an/${hs.id}/vuong-mac/${vm.id}/mo-lai`).set(GHI)).body as HoSoDuAn
    expect(mo.vuongMacMo).toBe(1)
  })

  it('không mượn được bước của dự án khác', async () => {
    const cv = await vao('chuyenvien.a')
    const khac = (
      await cv.post('/api/du-an').set(GHI).send({
        ten: 'Dự án khác',
        donViId: MAU.XA_A,
        quyTrinhMa: 'mua-sam',
        loaiChi: 'dtpt',
        ngayBatDau: '2026-01-05',
      })
    ).body as HoSoDuAn
    const buocKhac = khac.buoc.find((b) => !b.laNhom)!
    expect(
      (await cv.post(`/api/du-an/${hs.id}/vuong-mac`).set(GHI).send({ noiDung: 'x', buocId: buocKhac.id }))
        .status,
    ).toBe(404)
  })
})

describe('nhật ký theo dự án', () => {
  it('lọc đúng thao tác của một dự án — cả bước, văn bản, vốn, vướng mắc', async () => {
    const ct = await vao('chutich.a')
    const { dong } = (await ct.get(`/api/nhat-ky?duAnId=${hs.id}&gioiHan=200`)).body as TrangNhatKy
    const bang = new Set(dong.map((d) => d.bang))
    for (const b of [
      'du_an',
      'du_an_buoc',
      'du_an_van_ban',
      'du_an_von',
      'du_an_giai_ngan',
      'du_an_vuong_mac',
    ])
      expect(bang).toContain(b)
    expect(
      dong.every(
        (d) => d.banGhiId === hs.id || d.giaTriMoi?.du_an_id === hs.id || d.giaTriCu?.du_an_id === hs.id,
      ),
    ).toBe(true)
    expect((await ct.get('/api/nhat-ky?duAnId=khong-phai-uuid')).status).toBe(400)
  })
})

describe('nhật ký theo người dùng', () => {
  it('lọc đúng thao tác của một người; mã sai → 400', async () => {
    const ct = await vao('chutich.a')
    const tatCa = ((await ct.get('/api/nhat-ky?gioiHan=200')).body as TrangNhatKy).dong
    const nguoi = tatCa.find((d) => d.taiKhoanId)!.taiKhoanId!
    const { dong } = (await ct.get(`/api/nhat-ky?taiKhoanId=${nguoi}&gioiHan=200`)).body as TrangNhatKy
    expect(dong.length).toBeGreaterThan(0)
    expect(dong.every((d) => d.taiKhoanId === nguoi)).toBe(true)
    expect((await ct.get('/api/nhat-ky?taiKhoanId=abc')).status).toBe(400)
  })
})
