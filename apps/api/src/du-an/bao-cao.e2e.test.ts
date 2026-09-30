/**
 * Báo cáo dự án qua điểm gom /api/bao-cao/:ma (ADR-0007): Biểu 01/02/03, Điều 35,
 * danh sách xuất, checklist Excel. HTTP thật → Postgres thật (PGlite).
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { GiaTriDanhMuc, HoSoDuAn, KetQuaBaoCao } from '@gdos/shared'
import ExcelJS from 'exceljs'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { duAnBuoc } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
let db: CoSoThu
let app: INestApplication
let dauTu: HoSoDuAn
let chuyenTiep: HoSoDuAn
let moiNam: HoSoDuAn
let nguon: GiaTriDanhMuc[]

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
  nguon = (await cv.get('/api/danh-muc?loai=nguon-von')).body as GiaTriDanhMuc[]
  const tao = async (ten: string, loaiChi: string, ngayBatDau: string, them: object = {}) =>
    (
      await cv
        .post('/api/du-an')
        .set(GHI)
        .send({ ten, donViId: MAU.XA_A, quyTrinhMa: 'mua-sam', loaiChi, ngayBatDau, ...them })
    ).body as HoSoDuAn
  dauTu = await tao('Đầu tư hạ tầng số', 'dtpt', '2026-01-10', { tongMuc: 900, diaDiem: 'Trụ sở xã' })
  chuyenTiep = await tao('Duy trì phần mềm', 'ctx', '2025-03-01')
  moiNam = await tao('Thuê dịch vụ mới', 'ctx', '2026-02-01')

  const von = (id: string, nam: number, n: number, keHoach: number) =>
    cv.post(`/api/du-an/${id}/von`).set(GHI).send({ nam, nguonVonId: nguon[n]!.id, keHoach })
  await von(dauTu.id, 2026, 0, 400)
  await von(dauTu.id, 2026, 1, 100)
  await von(chuyenTiep.id, 2026, 0, 50)
  await von(chuyenTiep.id, 2027, 0, 70)
  const gn = (id: string, ngay: string, soTien: number) =>
    cv.post(`/api/du-an/${id}/giai-ngan`).set(GHI).send({ nam: 2026, nguonVonId: nguon[0]!.id, ngay, soTien })
  await gn(dauTu.id, '2026-03-01', 150)
  await gn(dauTu.id, '2026-06-01', 50)
  await gn(chuyenTiep.id, '2026-03-05', 20)
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

const chiTiet = (kq: KetQuaBaoCao) => kq.dong.filter((d) => d.cap === 0)

describe('Biểu 01/02/03', () => {
  it('Biểu 01: chỉ dự án đầu tư; kế hoạch vốn năm, giải ngân năm tính đến ngày báo cáo, theo nguồn', async () => {
    const ct = await vao('chutich.a')
    const res = await ct.get('/api/bao-cao/du-an-bieu-01?nam=2026&denNgay=2026-04-01')
    expect(res.status).toBe(200)
    const kq = res.body as KetQuaBaoCao
    const [d] = chiTiet(kq)
    expect(chiTiet(kq)).toHaveLength(1)
    // Tên · địa điểm · CĐT · thời gian · tổng mức · KH [tổng, n0, n1] · GN [tổng, n0, n1] · tình hình
    expect(d!.o.slice(0, 2)).toEqual(['Đầu tư hạ tầng số', 'Trụ sở xã'])
    expect(d!.o.slice(4, 11)).toEqual([900, 500, 400, 100, 150, 150, 0])
    expect(kq.nhomCot?.map((g) => [g.tu, g.so])).toEqual([
      [5, 3],
      [8, 3],
    ])
    expect(d!.lienKet).toBe(`/du-an/${dauTu.id}`)
  })

  it('Biểu 02 = chi thường xuyên bắt đầu trước năm báo cáo; Biểu 03 = từ năm báo cáo', async () => {
    const ct = await vao('chutich.a')
    const b2 = (await ct.get('/api/bao-cao/du-an-bieu-02?nam=2026&tuNam=2026&denNam=2027'))
      .body as KetQuaBaoCao
    const b3 = (await ct.get('/api/bao-cao/du-an-bieu-03?nam=2026')).body as KetQuaBaoCao
    expect(chiTiet(b2).map((d) => d.o[0])).toEqual(['Duy trì phần mềm'])
    expect(chiTiet(b3).map((d) => d.o[0])).toEqual(['Thuê dịch vụ mới'])
    // Tổng KP giai đoạn 2026–2027 = 50 + 70; KP năm 2026 = 50; giải ngân lũy kế = 20.
    const d = chiTiet(b2)[0]!
    expect(d.o[3]).toBe(120)
    expect(d.o[4]).toBe(50)
    expect(d.o.at(-2)).toBe(20)
  })

  it('phân nhóm theo chủ đầu tư: dòng nhóm cộng đúng các dòng bên dưới', async () => {
    const ct = await vao('chutich.a')
    const kq = (await ct.get('/api/bao-cao/du-an-danh-sach?nhom=don-vi')).body as KetQuaBaoCao
    expect(kq.dong[0]).toMatchObject({ cap: 1 })
    expect(kq.dong[0]!.o[0]).toBe('Xã An Hòa')
    const iTongMuc = kq.cot.findIndex((c) => c.nhan === 'Tổng mức')
    expect(kq.dong[0]!.o[iTongMuc]).toBe(900)
    expect(chiTiet(kq)).toHaveLength(3)
  })
})

describe('Điều 35 và checklist', () => {
  it('dự án xong hết bước lên danh sách Điều 35 với hạn 20 ngày và 30 ngày tiếp theo', async () => {
    await db.chuBang
      .update(duAnBuoc)
      .set({ ngayHoanThanh: '2026-05-01' })
      .where(eq(duAnBuoc.duAnId, moiNam.id))
    const ct = await vao('chutich.a')
    const kq = (await ct.get('/api/bao-cao/du-an-bc35')).body as KetQuaBaoCao
    expect(chiTiet(kq).map((d) => d.o.slice(0, 5))).toEqual([
      ['Thuê dịch vụ mới', 'Xã An Hòa', '2026-05-01', '2026-05-21', '2026-06-20'],
    ])
  })

  it('checklist Excel của một dự án: có tiêu đề, các bước', async () => {
    const ct = await vao('chutich.a')
    const res = await ct
      .get(`/api/du-an/${dauTu.id}/checklist/excel`)
      .buffer(true)
      .parse((r, cb) => {
        const phan: Buffer[] = []
        r.on('data', (c: Buffer) => phan.push(c))
        r.on('end', () => cb(null, Buffer.concat(phan)))
      })
    expect(res.status).toBe(200)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(moTep(res.body as Buffer))
    const ws = wb.worksheets[0]!
    expect(ws.getCell('A1').text).toContain('CHECKLIST TIẾN ĐỘ')
    expect(ws.rowCount).toBeGreaterThan(dauTu.buoc.length)
  })
})

describe('Excel và quyền', () => {
  it('xuất Excel: đúng loại tệp, tên tiếng Việt, dòng tổng là công thức SUBTOTAL', async () => {
    const ct = await vao('chutich.a')
    const res = await ct
      .get('/api/bao-cao/du-an-bieu-01/excel?nam=2026&denNgay=2026-04-01')
      .buffer(true)
      .parse((r, cb) => {
        const phan: Buffer[] = []
        r.on('data', (c: Buffer) => phan.push(c))
        r.on('end', () => cb(null, Buffer.concat(phan)))
      })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('spreadsheetml')
    expect(res.headers['content-disposition']).toContain('Bieu01_2026.xlsx')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(moTep(res.body as Buffer))
    const ws = wb.worksheets[0]!
    expect(ws.getCell('A1').text).toContain('BIỂU 01')
    // Hàng 4–5 tiêu đề hai tầng, hàng 6 tổng số; cột G = kế hoạch vốn tổng số.
    const tong = ws.getCell('G6').value as { formula?: string; result?: number }
    expect(tong.formula).toMatch(/^SUBTOTAL\(9,G7:G7\)$/)
    expect(tong.result).toBe(500)
  })

  it('không có quyền dự án → 403; báo cáo không có → 404; tham số sai → 400', async () => {
    const qt = await vao('quantri')
    expect((await qt.get('/api/bao-cao/du-an-bieu-01')).status).toBe(403)
    const ct = await vao('chutich.a')
    expect((await ct.get('/api/bao-cao/khong-co')).status).toBe(404)
    expect((await ct.get('/api/bao-cao/du-an-bieu-01?nam=1990')).status).toBe(400)
    expect((await ct.get('/api/bao-cao/du-an-danh-sach?nhom=bat-ky')).status).toBe(400)
    expect((await ct.get('/api/bao-cao/du-an-bieu-02?tuNam=2027&denNam=2026')).status).toBe(400)
  })

  it('xã khác không thấy số liệu của xã An Hòa (RLS)', async () => {
    const b = await vao('canbo.b')
    const kq = (await b.get('/api/bao-cao/du-an-danh-sach')).body as KetQuaBaoCao
    expect(chiTiet(kq)).toHaveLength(0)
  })
})

/** Buffer của Node → ArrayBuffer đúng đoạn dữ liệu, kiểu exceljs nhận. */
function moTep(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}
