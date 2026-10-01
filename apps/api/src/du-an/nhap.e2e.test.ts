/**
 * Nhập dự án từ Excel: tải mẫu → điền → kiểm (không ghi) → nhập (tất cả hoặc
 * không). HTTP thật → Postgres thật (PGlite).
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { DuAnDong, KetQuaNhapDuAn } from '@gdos/shared'
import ExcelJS from 'exceljs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { docNgay } from './nhap-excel.js'

const GHI = { 'X-GDOS': '1' }
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
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent
    .post('/api/xac-thuc/dang-nhap')
    .set(GHI)
    .send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU })
  expect(res.status).toBe(200)
  return agent
}

/** Đọc thân phản hồi nhị phân (tệp Excel) thành Buffer. */
const nhiPhan: Parameters<request.Test['parse']>[0] = (r, cb) => {
  const phan: Buffer[] = []
  r.on('data', (c: Buffer) => phan.push(c))
  r.on('end', () => cb(null, Buffer.concat(phan)))
}

/** Tải tệp mẫu, điền các dòng, trả tệp .xlsx. */
async function tepCo(agent: request.Agent, dong: (string | number | Date)[][]): Promise<Buffer> {
  const res = await agent.get('/api/du-an/nhap/mau').buffer(true).parse(nhiPhan)
  expect(res.status).toBe(200)
  const b = res.body as Buffer
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer)
  const ws = wb.getWorksheet('Dự án')!
  dong.forEach((d, i) => (ws.getRow(i + 2).values = d))
  return Buffer.from(await wb.xlsx.writeBuffer())
}

describe('nhập dự án từ Excel', () => {
  it('tệp mẫu có sheet Hướng dẫn liệt kê chủ đầu tư và quy trình trong phạm vi', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv.get('/api/du-an/nhap/mau').buffer(true).parse(nhiPhan)
    expect(res.headers['content-disposition']).toContain('Mau_nhap_du_an.xlsx')
    const b = res.body as Buffer
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer)
    const chu: string[] = []
    wb.getWorksheet('Hướng dẫn')!.eachRow((r) => chu.push(r.getCell(2).text))
    expect(chu).toContain('Xã An Hòa')
    expect(chu).not.toContain('Xã Bình Minh') // ngoài phạm vi của chuyên viên xã An Hòa
  })

  it('kiểm: báo lỗi từng dòng, không ghi gì; có dòng sai thì nhập bị từ chối', async () => {
    const cv = await vao('chuyenvien.a')
    const tep = await tepCo(cv, [
      ['', 'Dự án nhập một', 'Xã An Hòa', 'mua-sam', 'dtpt', 'B', '', 300, new Date(Date.UTC(2026, 0, 15))],
      ['', 'Dự án nhập hai', 'Xã Bình Minh', 'khong-co', 'xyz', '', '', 'abc', '31/02/2026'],
    ])
    const kt = await cv.post('/api/du-an/nhap/kiem-tra').set(GHI).attach('tep', tep, 'nhap.xlsx')
    expect(kt.status).toBe(200)
    const kq = kt.body as KetQuaNhapDuAn
    expect([kq.soHopLe, kq.soLoi]).toEqual([1, 1])
    expect(kq.dong[1]!.hang).toBe(3)
    expect(kq.dong[1]!.loi.join(' | ')).toMatch(/Xã Bình Minh.*không có trong phạm vi/)
    expect(kq.dong[1]!.loi.join(' | ')).toMatch(/Không có quy trình mẫu "khong-co"/)
    expect(kq.dong[1]!.loi.join(' | ')).toMatch(/Loại chi "xyz"/)
    expect(kq.dong[1]!.loi.join(' | ')).toMatch(/Tổng mức "abc"/)
    expect(kq.dong[1]!.loi.join(' | ')).toMatch(/31\/02\/2026/)

    const nhap = await cv.post('/api/du-an/nhap').set(GHI).attach('tep', tep, 'nhap.xlsx')
    expect(nhap.status).toBe(400)
    const ds = (await cv.get('/api/du-an')).body as DuAnDong[]
    expect(ds.some((d) => d.ten === 'Dự án nhập một')).toBe(false)
  })

  it('mọi dòng hợp lệ → nhập hết trong một lần, đi đúng đường tạo tay (có checklist)', async () => {
    const cv = await vao('chuyenvien.a')
    const tep = await tepCo(cv, [
      [
        'DA-NHAP-01',
        'Dự án nhập một',
        'XA-A',
        'mua-sam',
        'Đầu tư phát triển',
        'B',
        '',
        300,
        '15/01/2026',
        'Thôn 1',
      ],
      ['', 'Dự án nhập hai', 'xã an hòa', 'mua-sam', 'ctx', '', '', '', '2026-02-01', '', '', 'chutich.a'],
    ])
    const res = await cv.post('/api/du-an/nhap').set(GHI).attach('tep', tep, 'nhap.xlsx')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ soDuAn: 2 })
    const ds = (await cv.get('/api/du-an')).body as DuAnDong[]
    const mot = ds.find((d) => d.ma === 'DA-NHAP-01')!
    expect(mot).toMatchObject({
      ten: 'Dự án nhập một',
      loaiChi: 'dtpt',
      nhomDuAn: 'B',
      tongMuc: 300,
      ngayBatDau: '2026-01-15',
    })
    expect(mot.thongKe.tong).toBeGreaterThan(0)
    expect(ds.find((d) => d.ten === 'Dự án nhập hai')!.canBo?.hoTen).toBe('Chủ tịch xã An Hòa')

    // Nhập lại cùng tệp: mã đã có → cả tệp bị từ chối, không sinh bản trùng.
    const lai = await cv.post('/api/du-an/nhap/kiem-tra').set(GHI).attach('tep', tep, 'nhap.xlsx')
    expect((lai.body as KetQuaNhapDuAn).dong[0]!.loi[0]).toMatch(/đã có trên hệ thống/)
  })

  it('tệp không đúng mẫu, không phải Excel → 400; không có quyền tạo → 403', async () => {
    const cv = await vao('chuyenvien.a')
    const sai = await cv.post('/api/du-an/nhap/kiem-tra').set(GHI).attach('tep', Buffer.from('abc'), 'a.xlsx')
    expect(sai.status).toBe(400)
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('X').addRow(['Cột lạ'])
    const la = await cv
      .post('/api/du-an/nhap/kiem-tra')
      .set(GHI)
      .attach('tep', Buffer.from(await wb.xlsx.writeBuffer()), 'a.xlsx')
    expect(la.status).toBe(400)
    const ct = await vao('chutich.a')
    expect((await ct.get('/api/du-an/nhap/mau')).status).toBe(403)
  })

  it('đọc ngày: dd/mm/yyyy, yyyy-mm-dd; ngày không có thật → null', () => {
    expect(docNgay('5/3/2026')).toBe('2026-03-05')
    expect(docNgay('2026-03-05')).toBe('2026-03-05')
    expect(docNgay('31/02/2026')).toBeNull()
  })
})
