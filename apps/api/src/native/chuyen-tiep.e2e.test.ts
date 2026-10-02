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
    expect(quyenCanCho('document', 'GET', '/document-templates')).toEqual(['VAN_BAN.READ'])
    expect(quyenCanCho('document', 'POST', '/compose')).toEqual(['VAN_BAN.CREATE'])
    expect(quyenCanCho('document', 'POST', `/task-assignments/assign/${MA}`)).toEqual(['VAN_BAN.ASSIGN'])
    expect(quyenCanCho('document', 'PATCH', `/task-assignments/${MA}/status`)).toEqual(['VAN_BAN.ASSIGN'])
    expect(quyenCanCho('document', 'DELETE', `/document-templates/${MA}`)).toEqual(['VAN_BAN.DELETE'])
    expect(quyenCanCho('document', 'GET', '/summarize')).toBeNull()
    expect(quyenCanCho('document', 'GET', '/integrations')).toBeNull()
    expect(quyenCanCho('document', 'GET', '/document-templates/../integrations')).toBeNull()
    expect(quyenCanCho('document', 'GET', '/document-templates/abc')).toBeNull()
    expect(quyenCanCho('document', 'PUT', '/document-templates')).toBeNull()
    // Nhiệm vụ và danh bạ
    expect(quyenCanCho('document', 'GET', '/tasks/dashboard')).toEqual(['NHIEM_VU.READ'])
    expect(quyenCanCho('document', 'POST', '/tasks')).toEqual(['NHIEM_VU.ASSIGN', 'NHIEM_VU.CREATE'])
    expect(quyenCanCho('document', 'PUT', `/tasks/${MA}/participants`)).toEqual([
      'NHIEM_VU.ASSIGN',
      'NHIEM_VU.UPDATE',
    ])
    expect(quyenCanCho('document', 'DELETE', `/tasks/${MA}`)).toEqual(['NHIEM_VU.ASSIGN', 'NHIEM_VU.DELETE'])
    expect(quyenCanCho('directory', 'GET', '/users')).toEqual(['NHIEM_VU.READ'])
    expect(quyenCanCho('directory', 'POST', '/users')).toBeNull()
    expect(quyenCanCho('directory', 'GET', '/document-templates')).toBeNull()
    expect(quyenCanCho('document', 'GET', '/users')).toBeNull()
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

  it('nhiệm vụ: danh bạ đi sang /api/directory; PUT người tham gia; quyền "một trong hai"', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/native/directory/users?search=an&pageSize=20&x=1')).status).toBe(200)
    expect(daGoi[0]!.url).toBe(`${NATIVE}/api/directory/users?search=an&pageSize=20`)
    // Chuyên viên (CREATE/UPDATE) giao việc và đổi người được; lãnh đạo (ASSIGN) cũng được.
    const put = await cv
      .put(`/api/native/document/tasks/${MA}/participants`)
      .set(GHI)
      .send({ participants: [] })
    expect(put.status).toBe(200)
    expect(daGoi[1]!.method).toBe('PUT')
    expect(JSON.parse(String(daGoi[1]!.body))).toEqual({ participants: [] })
    const ct = await vao('chutich.a')
    expect((await ct.post('/api/native/document/tasks').set(GHI).field('title', 'x')).status).toBe(403)
    // ↑ chủ tịch chưa liên kết Native → 403 ở bước lấy token, nhưng đã QUA bước quyền (ASSIGN).
    expect((await ct.get('/api/native/directory/roles')).status).toBe(404)
  })

  it('ghi không kèm header chống giả mạo → bị chặn', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.post('/api/native/document/compose').send({})).status).toBe(403)
    expect(daGoi).toHaveLength(0)
  })
})

describe('Trợ lý AI: /api/native/{context,assistant,index}/*', () => {
  const BOT = 'cmbot0123456789abcdef'

  it('danh sách cho phép: trò chuyện cần READ, cấu hình bot cần CREATE / UPDATE / DELETE', () => {
    expect(quyenCanCho('context', 'GET', '/v1/chatbots')).toEqual(['TRO_LY.READ'])
    expect(quyenCanCho('context', 'POST', '/v1/chatbots')).toEqual(['TRO_LY.CREATE'])
    expect(quyenCanCho('context', 'PATCH', `/v1/chatbots/${BOT}`)).toEqual(['TRO_LY.UPDATE'])
    expect(quyenCanCho('context', 'DELETE', `/v1/chatbots/${BOT}`)).toEqual(['TRO_LY.DELETE'])
    expect(quyenCanCho('context', 'POST', `/v1/chatbots/${BOT}/xoay-khoa-nhung`)).toEqual(['TRO_LY.UPDATE'])
    expect(quyenCanCho('context', 'POST', `/v1/chatbots/${BOT}/conversations/${MA}/messages`)).toEqual([
      'TRO_LY.READ',
    ])
    expect(quyenCanCho('assistant', 'POST', '/ask/stream')).toEqual(['TRO_LY.READ'])
    expect(quyenCanCho('index', 'GET', '/v1/collections/collections')).toEqual(['TRO_LY.READ'])
    // Ngoài danh sách: sửa phân quyền nguồn, công cụ API, xóa bộ tri thức, đường leo thư mục.
    expect(quyenCanCho('context', 'PUT', '/v1/permissions/sources/abc')).toBeNull()
    expect(quyenCanCho('context', 'GET', '/v1/sources')).toBeNull()
    expect(quyenCanCho('context', 'GET', '/v1/chatbots/../sources')).toBeNull()
    expect(quyenCanCho('index', 'DELETE', `/v1/collections/collections/${MA}`)).toBeNull()
    expect(quyenCanCho('assistant', 'GET', '/models')).toBeNull()
  })

  it('chuyển tiếp danh sách bot; giữ tham số active_only', async () => {
    hangCho = [Response.json([{ id: BOT, name: 'Bot thử' }])]
    const cv = await vao('chuyenvien.a')
    const res = await cv.get('/api/native/context/v1/chatbots?active_only=true&x=1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: BOT, name: 'Bot thử' }])
    expect(daGoi[0]!.url).toBe(`${NATIVE}/api/context/v1/chatbots?active_only=true`)
  })

  it('câu trả lời dạng dòng sự kiện (SSE) đi nguyên vẹn, đúng kiểu nội dung', async () => {
    const dong =
      'event: van\ndata: {"t":"Xin "}\n\nevent: van\ndata: {"t":"chào"}\n\nevent: done\ndata: {}\n\n'
    hangCho = [new Response(dong, { headers: { 'content-type': 'text/event-stream; charset=utf-8' } })]
    const cv = await vao('chuyenvien.a')
    const res = await cv
      .post('/api/native/assistant/ask/stream')
      .set(GHI)
      .send({ question: 'Xin chào', chatbotId: BOT })
      .buffer(true)
      .parse((r, xong) => {
        let d = ''
        r.on('data', (c: Buffer) => (d += c.toString('utf8')))
        r.on('end', () => xong(null, d))
      })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/event-stream/)
    expect(res.headers['x-accel-buffering']).toBe('no')
    expect(res.body).toBe(dong)
    expect(JSON.parse(String(daGoi[0]!.body))).toEqual({ question: 'Xin chào', chatbotId: BOT })
  })

  it('lỗi bọc kiểu context-service { error: { message } } được dịch ra câu', async () => {
    hangCho = [Response.json({ error: { code: 'BAD', message: 'Tên bot đã có' } }, { status: 409 })]
    const cv = await vao('chuyenvien.a')
    const res = await cv.post('/api/native/context/v1/chatbots').set(GHI).send({ name: 'Bot' })
    expect(res.status).toBe(409)
    expect((res.body as { message: string }).message).toMatch(/Tên bot đã có/)
  })

  it('lãnh đạo trò chuyện được nhưng không cấu hình được bot', async () => {
    const ct = await vao('chutich.a')
    expect((await ct.post('/api/native/context/v1/chatbots').set(GHI).send({})).status).toBe(403)
    expect((await ct.patch(`/api/native/context/v1/chatbots/${BOT}`).set(GHI).send({})).status).toBe(403)
    expect((await ct.get('/api/native/dia-chi')).status).toBe(403)
    expect(daGoi).toHaveLength(0)
  })

  it('địa chỉ Native cho đoạn mã nhúng: chỉ người cấu hình bot đọc được', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv.get('/api/native/dia-chi')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ diaChi: NATIVE })
  })
})
