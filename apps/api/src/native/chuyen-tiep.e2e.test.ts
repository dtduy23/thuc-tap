/**
 * Cổng chuyển tiếp sang Document Service của FOXAI Native (ADR-0009): danh sách cho
 * phép, quyền GDOS, token của chính người dùng, dịch lỗi. Native = fetch giả.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { GOI_NATIVE } from './chuyen-tiep.controller.js'
import { quyenCanCho } from './chuyen-tiep.js'
import { XAC_THUC_NATIVE, XacThucNativeGia } from './xac-thuc-native.js'

const GHI = { 'X-GDOS': '1' }
const NATIVE = 'https://native.thu'
const MA = '3f1c2a4e-9b7d-4c21-8e5f-0a1b2c3d4e5f'

interface LoiGoi {
  url: string
  method: string
  headers: Record<string, string>
  body: string | Buffer | undefined
}
let daGoi: LoiGoi[] = []
/** Phản hồi Native lần lượt; hết hàng đợi thì trả 200 `{ok:true}`. */
let hangCho: Response[] = []
const fetchGia = (url: string | URL, init: RequestInit = {}) => {
  daGoi.push({
    url: String(url),
    method: init.method ?? 'GET',
    headers: init.headers as Record<string, string>,
    body: init.body as string | Buffer | undefined,
  })
  return Promise.resolve(hangCho.shift() ?? Response.json({ ok: true }))
}

let db: CoSoThu
let app: INestApplication

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
  const cv = await vao('chuyenvien.a')
  expect(
    (await cv.post('/api/native/lien-ket').set(GHI).send({ tenDangNhap: 'cv.a', matKhau: 'mk-thu' })).status,
  ).toBe(200)
}, 60_000)

afterAll(async () => {
  await app.close()
  await db.pg.close()
})

beforeEach(() => {
  daGoi = []
  hangCho = []
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

describe('danh sách cho phép', () => {
  it('mỗi đường dẫn gắn đúng quyền; đường lạ, mã lạ, đi ngược thư mục → không cho', () => {
    expect(quyenCanCho('GET', '/document-templates')).toBe('VAN_BAN.READ')
    expect(quyenCanCho('POST', '/compose')).toBe('VAN_BAN.CREATE')
    expect(quyenCanCho('POST', `/task-assignments/assign/${MA}`)).toBe('VAN_BAN.ASSIGN')
    expect(quyenCanCho('PATCH', `/task-assignments/${MA}/status`)).toBe('VAN_BAN.ASSIGN')
    expect(quyenCanCho('DELETE', `/document-templates/${MA}`)).toBe('VAN_BAN.DELETE')
    expect(quyenCanCho('GET', '/summarize')).toBeNull()
    expect(quyenCanCho('GET', '/integrations')).toBeNull()
    expect(quyenCanCho('GET', '/document-templates/../integrations')).toBeNull()
    expect(quyenCanCho('GET', '/document-templates/abc')).toBeNull()
    expect(quyenCanCho('PUT', '/document-templates')).toBeNull()
  })
})

describe('/api/native/document/*', () => {
  it('chuyển tiếp GET bằng token của chính người dùng; bỏ tham số lạ', async () => {
    hangCho = [Response.json({ data: [], total: 0 })]
    const cv = await vao('chuyenvien.a')
    const res = await cv.get('/api/native/document/document-templates?page=2&status=DANG_DUNG&x=1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [], total: 0 })
    expect(daGoi).toHaveLength(1)
    expect(daGoi[0]!.url).toBe(`${NATIVE}/api/document/document-templates?page=2&status=DANG_DUNG`)
    expect(daGoi[0]!.headers.Authorization).toMatch(/^Bearer .+/)
  })

  it('POST JSON: gửi đúng thân sang Native', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv
      .post('/api/native/document/compose')
      .set(GHI)
      .send({ template_id: MA, values: { a: '1' } })
    expect(res.status).toBe(200)
    expect(daGoi[0]!.method).toBe('POST')
    expect(JSON.parse(String(daGoi[0]!.body))).toEqual({ template_id: MA, values: { a: '1' } })
  })

  it('multipart: chuyển nguyên khối, giữ ranh giới', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv
      .post('/api/native/document/compose/extract-text')
      .set(GHI)
      .attach('file', Buffer.from('Nội dung thử'), 'thu.txt')
    expect(res.status).toBe(200)
    expect(daGoi[0]!.headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=/)
    expect(Buffer.isBuffer(daGoi[0]!.body)).toBe(true)
    expect((daGoi[0]!.body as Buffer).toString('utf8')).toContain('Nội dung thử')
  })

  it('đường không nằm trong danh sách → 404, không gọi Native', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/native/document/summarize')).status).toBe(404)
    expect((await cv.get('/api/native/document/integrations')).status).toBe(404)
    expect(daGoi).toHaveLength(0)
  })

  it('thiếu quyền GDOS → 403; chưa liên kết Native → 403 kèm hướng dẫn', async () => {
    const ct = await vao('chutich.a')
    expect((await ct.post('/api/native/document/compose').set(GHI).send({})).status).toBe(403)
    const b = await vao('canbo.b')
    const res = await b.get('/api/native/document/document-templates')
    expect(res.status).toBe(403)
    expect((res.body as { message: string }).message).toMatch(/liên kết/)
    expect(daGoi).toHaveLength(0)
  })

  it('Native 401 → làm mới token đúng một lần rồi gửi lại', async () => {
    hangCho = [new Response('', { status: 401 }), Response.json({ ok: 1 })]
    const cv = await vao('chuyenvien.a')
    const res = await cv.get('/api/native/document/processing-units/select')
    expect(res.status).toBe(200)
    expect(daGoi).toHaveLength(2)
  })

  it('Native 401 hai lần → 403 (không phải 401, để web không tưởng hết phiên GDOS)', async () => {
    hangCho = [new Response('', { status: 401 }), new Response('', { status: 401 })]
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/native/document/processing-units/select')).status).toBe(403)
  })

  it('lỗi Native: 422 dịch câu, 5xx → 502 không lộ chi tiết', async () => {
    hangCho = [Response.json({ detail: [{ msg: 'field required' }] }, { status: 422 })]
    const cv = await vao('chuyenvien.a')
    const a = await cv.post('/api/native/document/document-templates').set(GHI).send({})
    expect(a.status).toBe(422)
    expect((a.body as { message: string }).message).toBe('Dữ liệu chưa hợp lệ: field required')
    hangCho = [new Response('Traceback: db password=...', { status: 500 })]
    const b = await cv.get('/api/native/document/task-assignments/flat')
    expect(b.status).toBe(502)
    expect(JSON.stringify(b.body)).not.toContain('Traceback')
  })

  it('ghi không kèm header chống giả mạo → bị chặn', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.post('/api/native/document/compose').send({})).status).toBe(403)
    expect(daGoi).toHaveLength(0)
  })
})
