import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type {
  BangDieuHanhBenhVien,
  CaLaoThu,
  DanhSachPhimThu,
  HoSoBhytThu,
  NghienCuuPhimThu,
} from '@gdos/shared'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { benhVienThu, phanCong, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
const GOC = '/api/benh-vien'
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

async function vao(ten: string) {
  const a = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  expect(
    (await a.post('/api/xac-thuc/dang-nhap').set(GHI).send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU }))
      .status,
  ).toBe(200)
  return a
}

it('tra cứu theo quyền nguồn và chỉ mở báo cáo cho người có quyền của phân hệ chủ', async () => {
  const [tk] = await db.chuBang
    .select({ id: taiKhoan.id, donViId: taiKhoan.donViId })
    .from(taiKhoan)
    .where(eq(taiKhoan.tenDangNhap, 'khoa.thu'))
  await db.chuBang
    .insert(phanCong)
    .values({ taiKhoanId: tk!.id, donViId: tk!.donViId, vai: 'LANH_DAO', phamVi: ['tong-quan'] })
  const a = await vao('khoa.thu')
  expect((await a.get('/api/chi-tieu/benh-vien?ky=2026-11')).status).toBe(200)
  const hoi = (chuDe: string, ma: string) =>
    a.post(`${GOC}/tro-ly`).set(GHI).send({ chuDe, ma, ky: '2026-11' })
  expect((await hoi('so-lieu', 'BV-01')).status).toBe(201)
  expect((await hoi('ma-icd', 'LAO-THU-01')).status).toBe(403)
  expect((await hoi('kiem-tra-don-thuoc', 'LAO-THU-01')).status).toBe(403)
  expect((await hoi('soan-thao', 'LAO-THU-01')).status).toBe(403)

  const baoCao = '/api/bao-cao/bao-cao-benh-vien-so-y-te'
  expect((await a.get(baoCao)).status).toBe(403)
  expect((await a.get(`${baoCao}/excel`)).status).toBe(403)
  await db.chuBang
    .update(phanCong)
    .set({ phamVi: ['bao-cao'] })
    .where(eq(phanCong.taiKhoanId, tk!.id))
  expect((await (await vao('khoa.thu')).get(baoCao)).status).toBe(200)
  await db.chuBang.update(taiKhoan).set({ phaiDoiMatKhau: true }).where(eq(taiKhoan.id, tk!.id))
  const choDoiMatKhau = await vao('khoa.thu')
  expect((await choDoiMatKhau.get(baoCao)).status).toBe(403)
  expect((await choDoiMatKhau.get(`${baoCao}/excel`)).status).toBe(403)
})

it('duyệt đạo đức, nhận lô cả hai nguồn, đọc phantom, gán nhãn độc lập rồi mới đối chiếu', async () => {
  const cv = await vao('chuyenvien.a')
  const ld = await vao('chutich.a')
  expect(((await cv.get(`${GOC}/phim`)).body as DanhSachPhimThu).tong).toBe(5000)
  expect((await cv.post(`${GOC}/phim/nhan-lo/benh-vien`).set(GHI)).status).toBe(409)
  expect((await cv.post(`${GOC}/nghien-cuu/viec/dao-duc`).set(GHI).send({ daGhiNhan: true })).status).toBe(
    403,
  )
  expect((await ld.post(`${GOC}/nghien-cuu/viec/dao-duc`).set(GHI).send({ daGhiNhan: true })).status).toBe(
    201,
  )
  for (const nguon of ['benh-vien', 'xe-luu-dong', 'benh-vien']) {
    expect((await cv.post(`${GOC}/phim/nhan-lo/${nguon}`).set(GHI)).status).toBe(201)
  }
  expect(((await cv.get(`${GOC}/phim`)).body as DanhSachPhimThu).tong).toBe(5012)
  const anh = (await cv.get(`${GOC}/phim/XQ-5001/anh`)).body as { rong: number; anh: string }
  expect(Buffer.from(anh.anh, 'base64').length).toBe(anh.rong ** 2)
  expect((await cv.post(`${GOC}/phim/XQ-5001/goi-y`).set(GHI)).status).toBe(409)
  expect((await cv.post(`${GOC}/phim/XQ-5001/nhan`).set(GHI).send({ nhan: 'co-dau' })).status).toBe(201)
  expect(
    (await ld.post(`${GOC}/phim/XQ-5001/duyet`).set(GHI).send({ nhan: 'khong-co-dau', chapNhan: true }))
      .status,
  ).toBe(409)
  expect(
    (await ld.post(`${GOC}/phim/XQ-5001/duyet`).set(GHI).send({ nhan: 'co-dau', chapNhan: true })).status,
  ).toBe(201)
  expect((await cv.post(`${GOC}/phim/XQ-5001/goi-y`).set(GHI)).body).toMatchObject({
    phienBan: 'phantom-centroid-v1',
    diem: expect.any(Number) as number,
  })
  expect((await cv.post(`${GOC}/nghien-cuu/danh-gia`).set(GHI)).body).toEqual({ soPhim: 25 })
  const nc = (await cv.get(`${GOC}/nghien-cuu`)).body as NghienCuuPhimThu
  expect(nc.daChaySongSong).toBe(1)
  expect(Object.values(nc.doiChieu).reduce((a, b) => a + b, 0)).toBe(26)
  expect((await cv.get('/api/bao-cao/phim-x-quang-bao-cao/excel')).headers['content-disposition']).toContain(
    'gia-lap.xlsx',
  )
})

it('5 nguồn ghi vết theo kỳ, dashboard đọc chung, đơn vị khác không thấy và không thể xóa cứng', async () => {
  const qt = await vao('quantri')
  const a = await vao('chutich.a')
  const b = await vao('canbo.b')
  const ky = '2026-11'
  expect((await b.get(`${GOC}/phim/XQ-5001/anh`)).status).toBe(404)
  expect((await a.get(`${GOC}/ket-noi?ky=${ky}`)).status).toBe(403)
  const soDong: number[] = []
  for (const nguon of ['his', 'lis', 'x-quang', 'bhxh', 'vitimes']) {
    const r = await qt.post(`${GOC}/ket-noi/${nguon}/dong-bo?ky=${ky}`).set(GHI)
    expect(r.status).toBe(201)
    soDong.push((r.body as { soDong: number }).soDong)
  }
  expect(soDong).toEqual([5, 1, 1, 2, 2])
  const doc = async (nd: Awaited<ReturnType<typeof vao>>) =>
    ((await nd.get(`/api/chi-tieu/benh-vien?ky=${ky}&nguon=gia-lap`)).body as BangDieuHanhBenhVien).cacKy.at(
      -1,
    )!.soLieu
  expect((await doc(a)).find((d) => d.ma === 'BV-01')?.nguon).toBe('Giả lập · HIS')
  expect((await doc(b)).find((d) => d.ma === 'BV-01')?.nguon).toBe('Giả lập')
  expect(
    ((await a.get(`/api/chi-tieu/benh-vien?ky=${ky}&nguon=da-nap`)).body as BangDieuHanhBenhVien).cacKy.at(
      -1,
    )!.soLieu,
  ).toEqual([])
  const ndB = (await b.get('/api/xac-thuc/toi')).body as { id: string }
  const nc = { taiKhoanId: ndB.id, donViIds: [MAU.XA_B] }
  expect(await trongPhamVi(db.coSo, nc, (tx) => tx.select().from(benhVienThu))).toEqual([])
  await expect(
    trongPhamVi(db.coSo, nc, async (tx) => {
      await tx.delete(benhVienThu)
    }),
  ).rejects.toThrow()
})

it('BHYT có lỗi, sửa, duyệt và chỉ mô phỏng gửi sau khi cán bộ duyệt', async () => {
  const cv = await vao('chuyenvien.a')
  const ld = await vao('chutich.a')
  const ma = 'BHYT-THU-02'
  const url = `${GOC}/bhyt/${ma}`
  expect((await cv.post(`${url}/gui`).set(GHI)).status).toBe(409)
  expect((await cv.post(`${url}/ra-soat`).set(GHI)).status).toBe(201)
  const doc = async () => ((await cv.get(`${GOC}/bhyt`)).body as HoSoBhytThu[]).find((h) => h.ma === ma)!
  expect(await doc()).toMatchObject({ trangThai: 'can-sua', loi: ['Thiếu mã thẻ BHYT'] })
  expect((await cv.post(`${url}/bo-sung`).set(GHI)).status).toBe(201)
  expect((await cv.post(`${url}/ra-soat`).set(GHI)).status).toBe(201)
  expect((await cv.post(`${url}/duyet`).set(GHI)).status).toBe(403)
  expect((await ld.post(`${url}/duyet`).set(GHI)).status).toBe(201)
  expect((await ld.post(`${url}/gui`).set(GHI)).status).toBe(403)
  expect((await cv.post(`${url}/gui`).set(GHI)).status).toBe(201)
  expect(await doc()).toMatchObject({ trangThai: 'da-gui', loi: [] })
})

it('trợ lý đọc đúng nguồn và nhận thay đổi theo dõi lao, VITIMES yêu cầu vết theo dõi', async () => {
  const cv = await vao('chuyenvien.a')
  const ld = await vao('chutich.a')
  const ma = 'LAO-THU-01'
  const url = `${GOC}/lao/${ma}`
  expect((await cv.post(`${url}/dong-bo`).set(GHI)).status).toBe(409)
  expect((await ld.post(`${url}/hoan-tat`).set(GHI)).status).toBe(409)
  const doc = async () => ((await cv.get(`${GOC}/lao`)).body as CaLaoThu[]).find((c) => c.ma === ma)!
  const hoi = (chuDe: string, ma?: string) =>
    cv.post(`${GOC}/tro-ly`).set(GHI).send({ chuDe, ma, ky: '2026-11' })
  expect((await hoi('ma-icd', ma)).body).toMatchObject({ nguon: 'Hồ sơ lao giả lập' })
  expect((await hoi('kiem-tra-don-thuoc', ma)).status).toBe(201)
  expect((await hoi('soan-thao', ma)).status).toBe(201)
  const { lanTheoDoi } = await doc()
  for (const { ngay } of lanTheoDoi)
    expect((await cv.post(`${url}/nhac`).set(GHI).send({ ngay, ketQua: 'da-xac-nhan' })).status).toBe(201)
  expect((await hoi('nhac-theo-doi', ma)).body).toMatchObject({
    noiDung: `Đã xác nhận mọi mốc theo dõi của ${ma}.`,
  })
  expect((await ld.post(`${url}/hoan-tat`).set(GHI)).status).toBe(201)
  expect((await ld.post(`${url}/dong-bo`).set(GHI)).status).toBe(403)
  expect((await cv.post(`${url}/dong-bo`).set(GHI)).status).toBe(201)
  expect((await doc()).dongBoLuc).not.toBeNull()
  expect((await hoi('du-thao')).body).toMatchObject({ noiDung: expect.stringContaining('Giả lập') as string })
  expect((await hoi('so-lieu', 'BV-01')).body).toMatchObject({
    noiDung: expect.stringContaining('Lượt khám ngoại trú') as string,
  })
})
