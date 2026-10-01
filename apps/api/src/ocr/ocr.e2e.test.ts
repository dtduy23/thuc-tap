/**
 * Nhận dạng chứng từ (OCR) qua FOXAI Native: chụp loại, bật loại, lấy kết quả về, đọc lại.
 * Native = fetch giả trả theo đường dẫn. Dữ liệu trong test là bịa.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { ChungTuOcr, KetQuaLayVeOcr, LoaiChungTuOcr } from '@gdos/shared'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { GOI_NATIVE } from '../native/chuyen-tiep.controller.js'
import { XAC_THUC_NATIVE, XacThucNativeGia } from '../native/xac-thuc-native.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { ketQuaTuNative, loaiTuNative } from './ocr-native.js'

const GHI = { 'X-GDOS': '1' }
const NATIVE = 'https://native.thu'
const LOAI_HD = '11111111-1111-4111-8111-111111111111'
const LOAI_KHAC = '22222222-2222-4222-8222-222222222222'
const CT = (n: number) => `aaaaaaaa-aaaa-4aaa-8aaa-00000000000${n}`

const LOAI = [
  { id: LOAI_HD, code: 'HOADON', name: 'Hóa đơn thử', isActive: true },
  { id: LOAI_KHAC, code: 'KHAC', name: 'Loại của khách khác', isActive: true },
]
const CHI_TIET_LOAI: Record<string, unknown> = {
  [LOAI_HD]: {
    ...LOAI[0],
    fields: [
      { fieldKey: 'tongTien', label: 'Tổng tiền', dataType: 'number', displayOrder: 2, isRequired: true },
      { fieldKey: 'soHoaDon', label: 'Số hóa đơn', dataType: 'string', displayOrder: 1 },
    ],
    tables: [
      {
        tableKey: 'dongHang',
        name: 'Dòng hàng',
        columns: [{ columnKey: 'ten', label: 'Tên hàng', dataType: 'string' }],
      },
    ],
  },
  [LOAI_KHAC]: { ...LOAI[1], fields: [], tables: [] },
}
/** Danh sách chứng từ trên Native — test đổi được giữa các lần lấy về. */
let chungTu: { id: string; status: string; updatedAt: string; schemaId: string }[] = []
let tongTien = 1500
let daGoi: string[] = []

const fetchGia = (url: string | URL) => {
  const p = new URL(String(url)).pathname.replace('/api/ocr', '')
  daGoi.push(p)
  if (p === '/schemas') return Promise.resolve(Response.json(LOAI))
  const loai = /^\/schemas\/(.+)$/.exec(p)?.[1]
  if (loai) return Promise.resolve(Response.json(CHI_TIET_LOAI[loai]))
  if (p === '/documents')
    return Promise.resolve(
      Response.json({ items: chungTu, page: 1, pageSize: 100, total: chungTu.length, totalPages: 1 }),
    )
  const id = /^\/documents\/(.+)\/result$/.exec(p)?.[1]
  const d = chungTu.find((c) => c.id === id)
  if (!d) return Promise.resolve(Response.json({ message: 'Not found' }, { status: 404 }))
  return Promise.resolve(
    Response.json({
      documentId: d.id,
      status: d.status,
      ocrConfidence: 0.91,
      schemaCode: d.schemaId === LOAI_HD ? 'HOADON' : 'KHAC',
      schemaName: 'Hóa đơn thử',
      fileName: `hoa-don-${d.id.slice(-1)}.pdf`,
      mimeType: 'application/pdf',
      data: { soHoaDon: `HD-${d.id.slice(-1)}`, tongTien, truongMoi: { a: 1 } },
      tables: { dongHang: [{ ten: 'Giấy A4' }, { ten: 'Mực in' }] },
      createdAt: '2026-09-01T02:00:00.000Z',
      updatedAt: d.updatedAt,
    }),
  )
}

let db: CoSoThu
let app: INestApplication

async function vao(ten: string) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent
    .post('/api/xac-thuc/dang-nhap')
    .set(GHI)
    .send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU })
  expect(res.status).toBe(200)
  return agent
}

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CAU_HINH)
    .useValue(docCauHinh({ NODE_ENV: 'test', NATIVE_URL: NATIVE }))
    .overrideProvider(CoSoDuLieu)
    .useValue({ db: db.coSo, kiemTra: () => Promise.resolve('ok') })
    .overrideProvider(XAC_THUC_NATIVE)
    .useValue(new XacThucNativeGia())
    .overrideProvider(GOI_NATIVE)
    .useValue(fetchGia)
    .compile()
  app = mod.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()
}, 60_000)

afterAll(async () => {
  await app.close()
  await db.pg.close()
})

beforeEach(() => {
  daGoi = []
})

describe('đọc phản hồi Native', () => {
  it('loại: sắp trường theo thứ tự, quy kiểu; thiếu mã hoặc mã lạ thì bỏ', () => {
    const l = loaiTuNative(CHI_TIET_LOAI[LOAI_HD])!
    expect(l.ma).toBe('HOADON')
    expect(l.dinhNghia!.truong).toEqual([
      { khoa: 'soHoaDon', nhan: 'Số hóa đơn', kieu: 'chu', batBuoc: false },
      { khoa: 'tongTien', nhan: 'Tổng tiền', kieu: 'so', batBuoc: true },
    ])
    expect(l.dinhNghia!.bang[0]).toMatchObject({ khoa: 'dongHang', cot: [{ khoa: 'ten', nhan: 'Tên hàng' }] })
    expect(loaiTuNative(LOAI[0])!.dinhNghia).toBeNull()
    expect(loaiTuNative({ id: LOAI_HD })).toBeNull()
    expect(loaiTuNative({ id: '../x', code: 'A' })).toBeNull()
  })

  it('kết quả: giá trị lồng thành chuỗi, độ tin cậy 0–100 quy về 0–1, mã lạ thì bỏ', () => {
    const r = ketQuaTuNative({
      documentId: CT(1),
      schemaCode: 'HOADON',
      status: 'PROCESSED',
      ocrConfidence: 87,
      data: { a: { b: 1 }, c: '' },
      tables: { t: [{ x: 1 }, 'rac'] },
    })!
    expect(r.trangThai).toBe('da-xu-ly')
    expect(r.doTinCay).toBeCloseTo(0.87)
    expect(r.duLieu).toEqual({ a: '{"b":1}', c: null })
    expect(r.bang.t).toEqual([{ x: 1 }, {}])
    expect(ketQuaTuNative({ documentId: 'khong-phai-uuid', schemaCode: 'HOADON' })).toBeNull()
  })
})

describe('quyền', () => {
  it('chuyên viên không vào được phần OCR của quản trị', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/ocr/loai')).status).toBe(403)
    expect((await cv.get('/api/ocr/chung-tu')).status).toBe(403)
    expect((await cv.post('/api/ocr/lay-ve').set(GHI)).status).toBe(403)
  })

  it('quản trị chưa liên kết Native → 403 kèm lời hướng dẫn, không gọi Native', async () => {
    const qt = await vao('quantri.tinh')
    const r = await qt.post('/api/ocr/loai/dong-bo').set(GHI)
    expect(r.status).toBe(403)
    expect(String((r.body as { message: unknown }).message)).toContain('liên kết')
    expect(daGoi).toEqual([])
  })
})

describe('lấy kết quả về', () => {
  let qt: Awaited<ReturnType<typeof vao>>

  beforeAll(async () => {
    qt = await vao('quantri.tinh')
    expect(
      (await qt.post('/api/native/lien-ket').set(GHI).send({ tenDangNhap: 'qt', matKhau: 'mk-thu' })).status,
    ).toBe(200)
  })

  it('chụp loại từ Native: mặc định chưa bật; chụp lại không sinh trùng, giữ nguyên lựa chọn bật', async () => {
    const r = await qt.post('/api/ocr/loai/dong-bo').set(GHI)
    expect(r.body).toEqual({ tong: 2, moi: 2 })
    const ds = (await qt.get('/api/ocr/loai')).body as LoaiChungTuOcr[]
    expect(ds.map((l) => [l.ma, l.bat])).toEqual([
      ['HOADON', false],
      ['KHAC', false],
    ])
    expect(ds[0]!.truong.map((t) => t.khoa)).toEqual(['soHoaDon', 'tongTien'])

    expect((await qt.post('/api/ocr/lay-ve').set(GHI)).status).toBe(400) // chưa bật loại nào
    expect((await qt.patch('/api/ocr/loai/HOADON').set(GHI).send({ bat: true })).status).toBe(200)
    expect((await qt.patch('/api/ocr/loai/KHONG-CO').set(GHI).send({ bat: true })).status).toBe(404)
    expect((await qt.patch('/api/ocr/loai/HOADON').set(GHI).send({})).status).toBe(400)

    expect((await qt.post('/api/ocr/loai/dong-bo').set(GHI)).body).toEqual({ tong: 2, moi: 0 })
    const sau = (await qt.get('/api/ocr/loai?bat=1')).body as LoaiChungTuOcr[]
    expect(sau.map((l) => l.ma)).toEqual(['HOADON'])
  })

  it('chỉ lấy chứng từ đã nhận dạng của loại đang bật; lần sau không đổi thì không hỏi lại', async () => {
    chungTu = [
      { id: CT(1), status: 'processed', updatedAt: '2026-09-02T03:00:00.000Z', schemaId: LOAI_HD },
      { id: CT(2), status: 'confirmed', updatedAt: '2026-09-03T03:00:00.000Z', schemaId: LOAI_HD },
      { id: CT(3), status: 'error', updatedAt: '2026-09-03T03:00:00.000Z', schemaId: LOAI_HD },
      { id: CT(4), status: 'processed', updatedAt: '2026-09-03T03:00:00.000Z', schemaId: LOAI_KHAC },
    ]
    const r = (await qt.post('/api/ocr/lay-ve').set(GHI)).body as KetQuaLayVeOcr
    expect(r).toEqual({ daXem: 4, moi: 2, capNhat: 0, khongDoi: 0, boQua: 2, loi: 0, conNua: false })
    // Loại chưa bật và chứng từ lỗi: không hỏi kết quả.
    expect(daGoi.filter((p) => p.endsWith('/result'))).toHaveLength(2)

    const ds = (await qt.get('/api/ocr/chung-tu?loai=HOADON')).body as ChungTuOcr[]
    expect(ds.map((c) => [c.tenTep, c.trangThai])).toEqual([
      ['hoa-don-2.pdf', 'da-xac-nhan'],
      ['hoa-don-1.pdf', 'da-xu-ly'],
    ])
    expect(ds[0]!.duLieu).toEqual({ soHoaDon: 'HD-2', tongTien: 1500, truongMoi: '{"a":1}' })
    expect(ds[0]!.bang.dongHang).toHaveLength(2)
    expect(ds[0]!.doTinCay).toBeCloseTo(0.91)
    const mot = (await qt.get(`/api/ocr/chung-tu/${ds[0]!.id}`)).body as ChungTuOcr
    expect(mot.tenTep).toBe('hoa-don-2.pdf')
    expect((await qt.get('/api/ocr/chung-tu?loai=KHAC')).body).toEqual([])
    expect((await qt.get('/api/ocr/chung-tu?loai=a%20b')).status).toBe(400)

    daGoi = []
    const lan2 = (await qt.post('/api/ocr/lay-ve').set(GHI)).body as KetQuaLayVeOcr
    expect(lan2).toMatchObject({ moi: 0, capNhat: 0, khongDoi: 2, boQua: 2 })
    expect(daGoi.filter((p) => p.endsWith('/result'))).toHaveLength(0)
  })

  it('Native sửa chứng từ → lần lấy về sau cập nhật đúng dòng đó, không sinh dòng mới', async () => {
    chungTu[0] = { ...chungTu[0]!, status: 'confirmed', updatedAt: '2026-09-05T03:00:00.000Z' }
    tongTien = 2750
    const r = (await qt.post('/api/ocr/lay-ve').set(GHI)).body as KetQuaLayVeOcr
    expect(r).toMatchObject({ moi: 0, capNhat: 1, khongDoi: 1 })
    const ds = (await qt.get('/api/ocr/chung-tu')).body as ChungTuOcr[]
    expect(ds).toHaveLength(2)
    expect(ds[0]).toMatchObject({ tenTep: 'hoa-don-1.pdf', trangThai: 'da-xac-nhan' })
    expect(ds[0]!.duLieu.tongTien).toBe(2750)
    const loai = (await qt.get('/api/ocr/loai')).body as LoaiChungTuOcr[]
    expect(loai.find((l) => l.ma === 'HOADON')!.soChungTu).toBe(2)
  })

  it('đơn vị khác không thấy kết quả của đơn vị này (RLS)', async () => {
    const xa = await vao('quantri')
    expect((await xa.get('/api/ocr/chung-tu')).body).toEqual([])
    expect((await xa.get('/api/ocr/loai')).body).toEqual([])
  })

  it('trang Kết nối có dòng OCR và kiểm tra được', async () => {
    const ds = (await qt.get('/api/ket-noi')).body as { ma: string; cheDo: string; diaChi: string }[]
    expect(ds.find((k) => k.ma === 'foxai-native-ocr')).toMatchObject({ cheDo: 'that', diaChi: NATIVE })
    const kt = await qt.post('/api/ket-noi/foxai-native-ocr/kiem-tra').set(GHI)
    expect((kt.body as { ok: boolean }).ok).toBe(true)
  })
})
