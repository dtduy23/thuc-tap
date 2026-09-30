/**
 * Đăng nhập đầu cuối: HTTP thật (supertest) → Nest → guard → dịch vụ → Postgres
 * thật (PGlite) với đủ RLS và hàm SECURITY DEFINER.
 */
import { Controller, Get, type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { isNotNull, sql } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { phienDangNhap } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu, type TenMau } from '../test/co-so-thu.js'
import { CanQuyen, ChiCanDangNhap, NguoiDung, type NguoiDungPhien } from './bao-ve.js'

/** Controller chỉ có trong test — để thử guard với từng kiểu khai quyền. */
@Controller('thu')
class DieuKhienThu {
  @Get('tai-khoan')
  @CanQuyen('QT_TAI_KHOAN.READ')
  taiKhoan() {
    return { ok: true }
  }

  @Get('nhat-ky')
  @CanQuyen('NHAT_KY.READ')
  nhatKy() {
    return { ok: true }
  }

  @Get('pham-vi')
  @ChiCanDangNhap()
  phamVi(@NguoiDung() nd: NguoiDungPhien) {
    return nd.donViIds
  }

  @Get('quen-khai')
  quenKhai() {
    return { ok: true }
  }
}

let db: CoSoThu
let app: INestApplication

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const mod = await Test.createTestingModule({ imports: [AppModule], controllers: [DieuKhienThu] })
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

const may = () => request(app.getHttpServer() as Parameters<typeof request>[0])
const GHI = { 'X-GDOS': '1' }

/** Đăng nhập, trả agent giữ cookie như trình duyệt. */
async function dangNhap(ten: TenMau, matKhau: string = MAU.MAT_KHAU) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent.post('/api/xac-thuc/dang-nhap').set(GHI).send({ tenDangNhap: ten, matKhau })
  return { agent, res }
}

const cookie = (res: request.Response, ten: string) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${ten}=`))
const giaTri = (c: string | undefined) => c?.split(';')[0]?.split('=')[1] ?? ''

describe('đăng nhập', () => {
  it('thiếu header X-GDOS thì chặn — chống giả mạo request từ trang khác', async () => {
    const res = await may()
      .post('/api/xac-thuc/dang-nhap')
      .send({ tenDangNhap: 'chutich.a', matKhau: MAU.MAT_KHAU })
    expect(res.status).toBe(403)
  })

  it('sai mật khẩu và sai tên trả CÙNG một câu — không dò được tên nào có thật', async () => {
    const saiMk = (await dangNhap('chutich.a', 'mat-khau-sai-roi')).res
    const saiTen = (await dangNhap('khong.ton.tai' as TenMau)).res
    expect(saiMk.status).toBe(401)
    expect(saiTen.status).toBe(401)
    expect(saiMk.body).toEqual(saiTen.body)
  })

  it('đúng thì đặt hai cookie HttpOnly, đúng đường dẫn, đúng SameSite', async () => {
    const { res } = await dangNhap('chutich.a')
    expect(res.status).toBe(200)
    const ve = cookie(res, 'gdos_ve')!
    const phien = cookie(res, 'gdos_phien')!
    expect(ve).toMatch(/HttpOnly/i)
    expect(ve).toMatch(/Path=\/api(;|$)/)
    expect(ve).toMatch(/SameSite=Lax/i)
    expect(phien).toMatch(/HttpOnly/i)
    expect(phien).toMatch(/Path=\/api\/xac-thuc/)
    expect(phien).toMatch(/SameSite=Strict/i)
  })

  it('không trả bất cứ thứ gì về mật khẩu', async () => {
    const { res } = await dangNhap('chutich.a')
    expect(JSON.stringify(res.body)).not.toMatch(/mat_?khau|argon2/i)
    expect(res.body).toMatchObject({ tenDangNhap: 'chutich.a', hoTen: 'Chủ tịch xã An Hòa' })
  })

  it('sai 5 lần thì khóa tạm — mật khẩu đúng cũng không vào được', async () => {
    for (let i = 0; i < 5; i++) expect((await dangNhap('khoa.thu', 'sai-lan-nua-roi')).res.status).toBe(401)
    const { res } = await dangNhap('khoa.thu')
    expect(res.status).toBe(423)
    expect((res.body as { message: string }).message).toMatch(/tạm khóa/)
  })

  it('tài khoản bị quản trị khóa: sai mật khẩu vẫn chỉ báo sai — người lạ không biết tài khoản bị khóa', async () => {
    expect((await dangNhap('bikhoa', 'doan-bua-thoi-ma')).res.status).toBe(401)
    const { res } = await dangNhap('bikhoa')
    expect(res.status).toBe(403)
  })
})

describe('guard — mặc định chặn', () => {
  it('chưa đăng nhập thì 401', async () => {
    expect((await may().get('/api/xac-thuc/toi')).status).toBe(401)
  })

  it('vé bị sửa tay thì 401', async () => {
    const res = await may().get('/api/xac-thuc/toi').set('Cookie', 'gdos_ve=gia.mao')
    expect(res.status).toBe(401)
  })

  it('route quên khai quyền thì 500 — lỗi lộ ngay, không lặng lẽ cho qua', async () => {
    const { agent } = await dangNhap('quantri')
    expect((await agent.get('/api/thu/quen-khai')).status).toBe(500)
  })

  it('Chủ tịch xem được nhật ký, KHÔNG vào được quản trị tài khoản', async () => {
    const { agent } = await dangNhap('chutich.a')
    expect((await agent.get('/api/thu/nhat-ky')).status).toBe(200)
    expect((await agent.get('/api/thu/tai-khoan')).status).toBe(403)
  })

  it('Cờ quản trị vào được quản trị tài khoản, KHÔNG xem được nhật ký nghiệp vụ', async () => {
    const { agent } = await dangNhap('quantri')
    expect((await agent.get('/api/thu/tai-khoan')).status).toBe(200)
    expect((await agent.get('/api/thu/nhat-ky')).status).toBe(403)
  })

  it('Chuyên viên không xem được nhật ký', async () => {
    const { agent } = await dangNhap('chuyenvien.a')
    expect((await agent.get('/api/thu/nhat-ky')).status).toBe(403)
  })

  it('/toi trả đúng tập quyền — web dựng cây bằng chính tập này', async () => {
    const { agent } = await dangNhap('chutich.a')
    const { quyen } = (await agent.get('/api/xac-thuc/toi')).body as { quyen: string[] }
    expect(quyen).toContain('NHAT_KY.READ')
    expect(quyen).not.toContain('QT_TAI_KHOAN.READ')
  })
})

describe('phạm vi dữ liệu', () => {
  it('tài khoản cấp xã chỉ có xã mình', async () => {
    const { agent } = await dangNhap('chutich.a')
    expect((await agent.get('/api/thu/pham-vi')).body).toEqual([MAU.XA_A])
  })

  it('tài khoản cấp tỉnh có tỉnh và mọi xã trực thuộc', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    expect(((await agent.get('/api/thu/pham-vi')).body as string[]).sort()).toEqual(
      [MAU.TINH, MAU.XA_A, MAU.XA_B].sort(),
    )
  })
})

describe('làm mới phiên — xoay vòng', () => {
  it('mỗi lần làm mới cấp token mới; token cũ dùng lại ngay (hai tab cùng lúc) thì chỉ bị từ chối', async () => {
    const { agent, res } = await dangNhap('chuyenvien.a')
    const cu = giaTri(cookie(res, 'gdos_phien'))
    const lan1 = await agent.post('/api/xac-thuc/lam-moi').set(GHI)
    expect(lan1.status).toBe(200)
    expect(giaTri(cookie(lan1, 'gdos_phien'))).not.toBe(cu)

    const dungLai = await may().post('/api/xac-thuc/lam-moi').set(GHI).set('Cookie', `gdos_phien=${cu}`)
    expect(dungLai.status).toBe(401)
    // Chưa quá 10 giây: không phạt — agent vẫn làm mới được.
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(200)
  })

  it('token cũ bị dùng lại SAU 10 giây → coi là bị đánh cắp → thu hồi MỌI phiên', async () => {
    const { agent, res } = await dangNhap('canbo.b')
    const cu = giaTri(cookie(res, 'gdos_phien'))
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(200)
    // Giả lập 1 phút trôi qua kể từ lúc token cũ bị thu hồi.
    await db.chuBang
      .update(phienDangNhap)
      .set({ thuHoiLuc: sql`now() - interval '1 minute'` })
      .where(isNotNull(phienDangNhap.thuHoiLuc))

    const keGian = await may().post('/api/xac-thuc/lam-moi').set(GHI).set('Cookie', `gdos_phien=${cu}`)
    expect(keGian.status).toBe(401)
    // Người thật cũng bị đá ra — buộc đăng nhập lại, kẻ gian mất phiên đã đánh cắp.
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(401)
  })

  it('đăng xuất thì token làm mới hết dùng được và cookie bị xóa', async () => {
    const { agent } = await dangNhap('chutich.a')
    const ra = await agent.post('/api/xac-thuc/dang-xuat').set(GHI)
    expect(ra.status).toBe(204)
    expect(cookie(ra, 'gdos_ve')).toMatch(/Expires=Thu, 01 Jan 1970/)
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(401)
  })
})

describe('đổi mật khẩu', () => {
  it('sai mật khẩu hiện tại hoặc mật khẩu mới quá ngắn thì 400', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    const sai = await agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: 'khong-dung', matKhauMoi: 'mat-khau-moi-du-dai' })
    expect(sai.status).toBe(400)
    const ngan = await agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: MAU.MAT_KHAU, matKhauMoi: 'ngan' })
    expect(ngan.status).toBe(400)
  })

  it('đổi xong: mật khẩu cũ hết dùng, phiên ở máy KHÁC bị đá ra, phiên hiện tại vẫn giữ', async () => {
    const mayKhac = (await dangNhap('lanhdao.tinh')).agent
    const { agent } = await dangNhap('lanhdao.tinh')
    const doi = await agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: MAU.MAT_KHAU, matKhauMoi: 'mat-khau-moi-du-dai' })
    expect(doi.status).toBe(204)

    expect((await dangNhap('lanhdao.tinh')).res.status).toBe(401)
    expect((await dangNhap('lanhdao.tinh', 'mat-khau-moi-du-dai')).res.status).toBe(200)
    expect((await mayKhac.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(401)
    expect((await agent.post('/api/xac-thuc/lam-moi').set(GHI)).status).toBe(200)
  })
})
