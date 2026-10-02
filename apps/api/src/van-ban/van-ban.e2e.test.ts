/**
 * Xử lý văn bản qua FOXAI Native (ADR-0009) — chạy với NativeGia. HTTP thật → PGlite.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type {
  KetNoiDong,
  KetQuaKiemTraKetNoi,
  LienKetNativeDong,
  VanBanChiTiet,
  VanBanDong,
} from '@gdos/shared'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { lienKetNative, taiKhoan } from '../db/schema/index.js'
import {
  KET_NOI_NATIVE,
  NativeChuaNoi,
  NativeGia,
  NativeThat,
  tuDto,
  type VanBanTrenNative,
} from '../native/ket-noi-native.js'
import { VanBanService } from './van-ban.service.js'
import { LienKetNativeService } from '../native/lien-ket.service.js'
import {
  MaHoaBiMat,
  XAC_THUC_NATIVE,
  XacThucNativeGia,
  XacThucNativeHttp,
} from '../native/xac-thuc-native.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'

const GHI = { 'X-GDOS': '1' }
const VAN_BAN =
  'Ủy ban nhân dân xã An Hòa báo cáo tình hình. Tiến độ đạt 80%. Còn vướng mặt bằng. Đề nghị tỉnh hỗ trợ kinh phí. Hạn hoàn thành tháng 12.'
let db: CoSoThu
let app: INestApplication

/** Bản giả đếm số lần làm mới — kiểm tra refresh token xoay vòng không bị gọi trùng. */
class DemLamMoi extends XacThucNativeGia {
  soLan = 0
  override lamMoi(r: string) {
    this.soLan++
    return super.lamMoi(r)
  }
}
const xacThuc = new DemLamMoi()

/** Native giả có sẵn MỘT văn bản trong tài khoản người dùng (tạo từ GDOS cũ trước đây). */
class NativeCoSan extends NativeGia {
  override dsTomTat(): Promise<VanBanTrenNative[]> {
    return Promise.resolve([
      {
        nativeId: 'n-100',
        ten: '912/CV-UBND — Công văn thử kéo về',
        loai: 'Công văn',
        nguon: 'QLVB',
        nguoiTao: 'Chủ tịch UBND',
        taoLuc: '2026-09-25T02:00:00Z',
        trangThai: 'xong',
        soKyTuGoc: 700,
        soKyTuTomTat: 300,
      },
    ])
  }
  override docTomTat(nativeId: string) {
    if (nativeId !== 'n-100') return super.docTomTat(nativeId)
    return Promise.resolve({
      nativeId,
      trangThai: 'xong' as const,
      soKyTuGoc: 700,
      soKyTuTomTat: 300,
      noiDungGoc: 'Nội dung gốc trên Native.',
      tomTat: 'Tóm tắt do AI của Native.',
      moHinh: 'mo-hinh-thu',
    })
  }
}

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CAU_HINH)
    .useValue(docCauHinh({ NODE_ENV: 'test' }))
    .overrideProvider(CoSoDuLieu)
    .useValue({ db: db.coSo, kiemTra: () => Promise.resolve('ok') })
    .overrideProvider(KET_NOI_NATIVE)
    .useValue(new NativeCoSan())
    .overrideProvider(XAC_THUC_NATIVE)
    .useValue(xacThuc)
    .compile()
  app = mod.createNestApplication()
  app.setGlobalPrefix('api')
  await app.init()
  // Chỉ chuyên viên xã A tự liên kết tài khoản Native (bản giả nhận mọi mật khẩu).
  const cv = await vao('chuyenvien.a')
  const lk = await cv.post('/api/native/lien-ket').set(GHI).send({ tenDangNhap: 'cv.a', matKhau: 'mk-thu' })
  expect(lk.status).toBe(200)
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

const guiTep = (agent: request.Agent, ten = 'bao-cao.txt', noiDung = VAN_BAN) =>
  agent.post('/api/van-ban').set(GHI).field('loai', 'Báo cáo').attach('tep', Buffer.from(noiDung), ten)

describe('tóm tắt văn bản (Native giả)', () => {
  let id: string

  it('tải lên → Native nhận → đọc lại: đang xử lý rồi xong, có tóm tắt và nội dung gốc', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await guiTep(cv)
    expect(res.status).toBe(201)
    const vb = res.body as VanBanChiTiet
    id = vb.id
    // Đọc lại ngay sau khi gửi: Native đã nhận, đang xử lý.
    expect(vb).toMatchObject({ ten: 'bao-cao', loai: 'Báo cáo', nguon: 'tai-len', trangThai: 'dang-xu-ly' })
    const xong = (await cv.get(`/api/van-ban/${id}`)).body as VanBanChiTiet
    expect(xong.trangThai).toBe('xong')
    expect(xong.tomTat).toContain('Tiến độ đạt 80%')
    expect(xong.noiDungGoc).toBe(VAN_BAN)
    expect(xong.tyLeRutGon).toBeGreaterThan(0)
    expect(xong.quyen).toEqual({ xuLy: true, sua: true, xoa: true })
  })

  it('sửa tóm tắt: GDOS giữ bản đã hiệu chỉnh; tải tệp gốc về đúng nội dung', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv
      .patch(`/api/van-ban/${id}/tom-tat`)
      .set(GHI)
      .send({ tomTat: 'Tiến độ 80%, vướng mặt bằng.' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      tomTat: 'Tiến độ 80%, vướng mặt bằng.',
      daHieuChinh: true,
      trangThai: 'xong',
    })
    const tep = await cv.get(`/api/van-ban/${id}/tep`).buffer(true)
    expect(tep.status).toBe(200)
    expect(tep.headers['content-disposition']).toContain('bao-cao.txt')
  })

  it('chạy lại: về hàng chờ rồi tóm tắt lại', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv.post(`/api/van-ban/${id}/chay-lai`).set(GHI)
    expect(res.status).toBe(200)
    const ds = (await cv.get('/api/van-ban')).body as VanBanDong[]
    expect(ds.map((d) => d.id)).toContain(id)
  })

  it('chưa liên kết Native → không gửi được (403); tệp lạ, loại lạ → 400', async () => {
    const ct = await vao('chutich.a')
    // Lãnh đạo không có quyền CREATE văn bản; chuyên viên xã B chưa liên kết Native.
    expect((await guiTep(ct)).status).toBe(403)
    const b = await vao('canbo.b')
    const res = await guiTep(b)
    expect(res.status).toBe(403)
    expect((res.body as { message: string }).message).toMatch(/chưa liên kết FOXAI Native/)
    const cv = await vao('chuyenvien.a')
    expect((await guiTep(cv, 'a.exe')).status).toBe(400)
    expect(
      (await cv.post('/api/van-ban').set(GHI).field('loai', 'Lạ').attach('tep', Buffer.from('x'), 'a.txt'))
        .status,
    ).toBe(400)
  })

  it('xã khác không thấy văn bản của xã An Hòa (RLS)', async () => {
    const b = await vao('canbo.b')
    expect((await b.get('/api/van-ban')).body).toEqual([])
    expect((await b.get(`/api/van-ban/${id}`)).status).toBe(404)
  })

  it('Tầng 2: danh sách kết nối và kiểm tra (quản trị); chuyên viên không vào được', async () => {
    const qt = await vao('quantri')
    const ds = (await qt.get('/api/ket-noi')).body as KetNoiDong[]
    expect(ds[0]).toMatchObject({ ma: 'foxai-native', cheDo: 'gia' })
    const kt = (await qt.post('/api/ket-noi/foxai-native/kiem-tra').set(GHI)).body as KetQuaKiemTraKetNoi
    expect(kt.ok).toBe(true)
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/ket-noi')).status).toBe(403)
  })
})

describe('bản kết nối', () => {
  it('chưa nối: gọi là 503 "chưa kết nối"', async () => {
    const n = new NativeChuaNoi(null, 'Chưa cấu hình NATIVE_URL.')
    await expect(n.guiTomTat()).rejects.toThrow(/Chưa kết nối FOXAI Native/)
    expect((await n.kiemTra()).ok).toBe(false)
  })

  it('bản thật gọi đúng đặc tả Document Service: Bearer, multipart, đổi trạng thái', async () => {
    const goi: { url: string; init: RequestInit }[] = []
    const fetchGia = ((url: string, init: RequestInit) => {
      goi.push({ url, init })
      return Promise.resolve(
        new Response(JSON.stringify({ id: 'n-1', status: 'PENDING', original_char_count: 10 }), {
          status: 202,
        }),
      )
    }) as unknown as typeof fetch
    const n = new NativeThat('https://native.vd', { layToken: () => Promise.resolve('tok') }, fetchGia)
    const kq = await n.guiTomTat(
      {
        ten: 'CV 1',
        loai: 'Công văn',
        tenTep: 'cv.pdf',
        mime: 'application/pdf',
        noiDung: Buffer.from('x'),
        tuDong: true,
      },
      { taiKhoanId: 't', nativeUserId: 'u', hoTen: 'A', nguCanh: { taiKhoanId: 't', donViIds: [] } },
    )
    expect(kq).toMatchObject({ nativeId: 'n-1', trangThai: 'cho', soKyTuGoc: 10 })
    expect(goi[0]!.url).toBe('https://native.vd/api/document/summarize/file')
    expect((goi[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    const du = goi[0]!.init.body as FormData
    expect([du.get('document_name'), du.get('document_type'), du.get('auto_summarize')]).toEqual([
      'CV 1',
      'Công văn',
      'true',
    ])
    expect(tuDto({ id: 'x', status: 'COMPLETED', summary_content: 'ok' })).toMatchObject({
      trangThai: 'xong',
      tomTat: 'ok',
    })
    expect(tuDto({ id: 'x', status: 'LA' }).trangThai).toBe('loi')
  })

  it('cấu hình: NATIVE_GIA cấm ở production; NATIVE_URL phải http(s)', () => {
    const coBan = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://x',
      AUTH_SECRET: 'a'.repeat(40),
      KHO_TEP_THU_MUC: '/tmp/t',
    }
    expect(() => docCauHinh({ ...coBan, NATIVE_GIA: '1' })).toThrow(/NATIVE_GIA/)
    expect(() => docCauHinh({ ...coBan, NATIVE_URL: 'http://native.vd' })).toThrow(/https/)
    expect(docCauHinh({ ...coBan, NATIVE_URL: 'https://native.vd/' }).native.url).toBe('https://native.vd')
    expect(() => docCauHinh({ NODE_ENV: 'test', NATIVE_URL: 'ftp://x' })).toThrow(/http/)
  })
})

describe('bản giả', () => {
  it('tệp DOCX: không gắn nhãn bản giả hai lần', async () => {
    const { tomTatGia } = await import('../native/ket-noi-native.js')
    const t = tomTatGia('[Bản giả — chưa nối FOXAI Native] Bản giả không đọc được nội dung tệp DOCX.')
    expect(t.match(/\[Bản giả/g)).toHaveLength(1)
  })
})

describe('liên kết tài khoản FOXAI Native (ADR-0009)', () => {
  it('trạng thái: đã liên kết, native_user_id ghi lên tài khoản; token lưu ĐÃ MÃ HÓA, không lưu mật khẩu', async () => {
    const cv = await vao('chuyenvien.a')
    const tt = (await cv.get('/api/native/lien-ket')).body as LienKetNativeDong
    expect(tt).toMatchObject({ coTheLienKet: true, daLienKet: true, nativeUserId: 'gia-cv.a' })
    const [tk] = await db.chuBang.select().from(taiKhoan).where(eq(taiKhoan.tenDangNhap, 'chuyenvien.a'))
    expect(tk!.nativeUserId).toBe('gia-cv.a')
    const [lk] = await db.chuBang.select().from(lienKetNative).where(eq(lienKetNative.taiKhoanId, tk!.id))
    expect(lk!.refreshMaHoa).not.toContain('gia-r-')
    expect(JSON.stringify(lk)).not.toContain('mk-thu')
  })

  it('mỗi người chỉ thấy liên kết của mình (RLS)', async () => {
    const ct = await vao('chutich.a')
    expect(((await ct.get('/api/native/lien-ket')).body as LienKetNativeDong).daLienKet).toBe(false)
  })

  it('nhiều yêu cầu cùng lúc khi token hết hạn: chỉ làm mới MỘT lần (refresh token xoay vòng)', async () => {
    const dv = app.get(LienKetNativeService)
    const [tk] = await db.chuBang.select().from(taiKhoan).where(eq(taiKhoan.tenDangNhap, 'chuyenvien.a'))
    ;(dv as unknown as { boNho: Map<string, unknown> }).boNho.clear()
    const ai = {
      taiKhoanId: tk!.id,
      nativeUserId: 'gia-cv.a',
      hoTen: 'CV',
      nguCanh: { taiKhoanId: tk!.id, donViIds: [MAU.XA_A] },
    }
    const truoc = xacThuc.soLan
    const ds = await Promise.all([dv.layToken(ai), dv.layToken(ai), dv.layToken(ai)])
    expect(new Set(ds).size).toBe(1)
    expect(xacThuc.soLan - truoc).toBe(1)
  })

  it('hủy liên kết: không gửi văn bản được nữa; liên kết lại thì được', async () => {
    const cv = await vao('chuyenvien.a')
    const huy = (await cv.post('/api/native/lien-ket/huy').set(GHI)).body as LienKetNativeDong
    expect(huy.daLienKet).toBe(false)
    expect((await guiTep(cv)).status).toBe(403)
    expect(
      (await cv.post('/api/native/lien-ket').set(GHI).send({ tenDangNhap: 'cv.a', matKhau: '' })).status,
    ).toBe(400)
    await cv.post('/api/native/lien-ket').set(GHI).send({ tenDangNhap: 'cv.a', matKhau: 'mk-thu' })
    expect((await guiTep(cv)).status).toBe(201)
  })

  it('đăng nhập Native thật: đúng đường dẫn cổng v3, sai mật khẩu → 400; mã hóa đổi khóa → không giải được', async () => {
    const goi: string[] = []
    const fetchGia = ((url: string, init: RequestInit) => {
      goi.push(`${url} ${init.body as string}`)
      return Promise.resolve(new Response('{}', { status: 401 }))
    }) as unknown as typeof fetch
    await expect(new XacThucNativeHttp('https://native.vd', fetchGia).dangNhap('a', 'b')).rejects.toThrow(
      /Sai tên đăng nhập/,
    )
    expect(goi[0]).toContain('https://native.vd/api/auth/login')
    expect(goi[0]).toContain('"username":"a"')
    const m = new MaHoaBiMat('khoa-mot'.repeat(5))
    expect(m.giai(m.ma('bi-mat'))).toBe('bi-mat')
    expect(new MaHoaBiMat('khoa-hai'.repeat(5)).giai(m.ma('bi-mat'))).toBeNull()
  })
})

describe('kéo văn bản đã có trên Native về (như màn của GDOS cũ)', () => {
  it('xem danh sách: văn bản của tài khoản Native hiện ra, giữ người tạo và nguồn bên Native', async () => {
    const cv = await vao('chuyenvien.a')
    ;(Reflect.get(app.get(VanBanService), 'keoVeLuc') as Map<string, number>).clear()
    const ds = (await cv.get('/api/van-ban')).body as VanBanDong[]
    const vb = ds.find((d) => d.ten.startsWith('912/CV-UBND'))!
    expect(vb).toMatchObject({
      nguoiTao: 'Chủ tịch UBND',
      nguon: 'qlvb',
      trangThai: 'xong',
      tyLeRutGon: 57.1,
    })
    expect(vb.taoLuc.slice(0, 10)).toBe('2026-09-25')
    // Mở ra: GDOS lấy nội dung gốc và bản tóm tắt từ Native.
    const ct = (await cv.get(`/api/van-ban/${vb.id}`)).body as VanBanChiTiet
    expect([ct.noiDungGoc, ct.tomTat]).toEqual(['Nội dung gốc trên Native.', 'Tóm tắt do AI của Native.'])
  })

  it('xã khác (chưa liên kết) không thấy; xóa rồi thì lần kéo sau không kéo lại', async () => {
    const b = await vao('canbo.b')
    expect(((await b.get('/api/van-ban')).body as VanBanDong[]).some((d) => d.ten.startsWith('912/CV'))).toBe(
      false,
    )
    const cv = await vao('chuyenvien.a')
    const vb = ((await cv.get('/api/van-ban')).body as VanBanDong[]).find((d) => d.ten.startsWith('912/CV'))!
    expect((await cv.post(`/api/van-ban/${vb.id}/xoa`).set(GHI)).status).toBe(200)
    ;(Reflect.get(app.get(VanBanService), 'keoVeLuc') as Map<string, number>).clear()
    const sau = (await cv.get('/api/van-ban')).body as VanBanDong[]
    expect(sau.some((d) => d.ten.startsWith('912/CV'))).toBe(false)
  })
})
