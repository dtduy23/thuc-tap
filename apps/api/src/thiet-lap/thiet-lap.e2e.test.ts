/**
 * Cấu hình hệ thống — đầu cuối: đổi chính sách trên API thì đăng nhập, vé, mật
 * khẩu đổi theo ngay; chỉ quản trị ở đơn vị gốc sửa được (database tự kiểm).
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  CHINH_SACH_MAC_DINH,
  NHAN_DIEN_MAC_DINH,
  type CauHinhCongKhai,
  type CauHinhHeThong,
  type TrangNhatKy,
} from '@gdos/shared'
import { eq, sql } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu, type TenMau } from '../test/co-so-thu.js'

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

const GHI = { 'X-GDOS': '1' }
const may = () => request(app.getHttpServer() as Parameters<typeof request>[0])

async function dangNhap(ten: TenMau, matKhau: string = MAU.MAT_KHAU) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent.post('/api/xac-thuc/dang-nhap').set(GHI).send({ tenDangNhap: ten, matKhau })
  return { agent, res }
}

const congKhai = async () => (await may().get('/api/cau-hinh/cong-khai')).body as CauHinhCongKhai

describe('đọc cấu hình', () => {
  it('công khai, không cần đăng nhập: tên cơ quan trống thì lấy tên đơn vị gốc', async () => {
    const res = await may().get('/api/cau-hinh/cong-khai')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      nhanDien: { ...NHAN_DIEN_MAC_DINH, tenCoQuan: 'Tỉnh Mẫu' },
      matKhauToiThieu: CHINH_SACH_MAC_DINH.matKhauToiThieu,
    })
  })

  it('quản trị đơn vị gốc sửa được; quản trị cấp xã chỉ xem; không có cờ quản trị thì 403', async () => {
    const tinh = (await (await dangNhap('quantri.tinh')).agent.get('/api/cau-hinh')).body as CauHinhHeThong
    expect(tinh).toMatchObject({ baoMat: CHINH_SACH_MAC_DINH, coTheSua: true, tenDonViGoc: 'Tỉnh Mẫu' })
    const xa = (await (await dangNhap('quantri')).agent.get('/api/cau-hinh')).body as CauHinhHeThong
    expect(xa.coTheSua).toBe(false)
    expect((await (await dangNhap('chutich.a')).agent.get('/api/cau-hinh')).status).toBe(403)
  })
})

describe('sửa chính sách bảo mật', () => {
  it('quản trị cấp xã sửa → 403; gọi thẳng hàm trong database cũng bị từ chối', async () => {
    const { agent } = await dangNhap('quantri')
    const res = await agent.put('/api/cau-hinh/bao-mat').set(GHI).send(CHINH_SACH_MAC_DINH)
    expect(res.status).toBe(403)

    const [qt] = await db.chuBang
      .select({ id: taiKhoan.id })
      .from(taiKhoan)
      .where(eq(taiKhoan.tenDangNhap, 'quantri'))
    await expect(
      trongPhamVi(db.coSo, { taiKhoanId: qt!.id, donViIds: [MAU.XA_A] }, (tx) =>
        tx.execute(sql`select cau_hinh_ghi('bao-mat', '{"soLanSaiToiDa": 3}'::jsonb)`),
      ),
    ).rejects.toThrow()
  })

  it('giá trị ngoài khoảng, thiếu, lạ → 400', async () => {
    const { agent } = await dangNhap('quantri.tinh')
    for (const than of [
      { ...CHINH_SACH_MAC_DINH, soLanSaiToiDa: 0 },
      { ...CHINH_SACH_MAC_DINH, phienHanNgay: 9999 },
      { soLanSaiToiDa: 5 },
      { ...CHINH_SACH_MAC_DINH, thuLa: 1 },
    ])
      expect((await agent.put('/api/cau-hinh/bao-mat').set(GHI).send(than)).status).toBe(400)
  })

  it('đổi xong có hiệu lực ngay: số lần sai, hạn vé, độ dài mật khẩu', async () => {
    const { agent } = await dangNhap('quantri.tinh')
    const moi = { ...CHINH_SACH_MAC_DINH, soLanSaiToiDa: 3, veHanPhut: 5, matKhauToiThieu: 12 }
    const res = await agent.put('/api/cau-hinh/bao-mat').set(GHI).send(moi)
    expect(res.status).toBe(200)
    expect((res.body as CauHinhHeThong).baoMat).toEqual(moi)

    // Sai 3 lần là khóa tạm.
    for (let i = 0; i < 3; i++) expect((await dangNhap('khoa.thu', 'sai-mat-khau-roi')).res.status).toBe(401)
    expect((await dangNhap('khoa.thu')).res.status).toBe(423)

    // Vé mới sống đúng 5 phút.
    const vao = await dangNhap('chutich.a')
    const ve = ([] as string[])
      .concat(vao.res.headers['set-cookie'] ?? [])
      .find((c) => c.startsWith('gdos_ve='))
    expect(ve).toMatch(/Max-Age=300/)

    // Mật khẩu mới phải từ 12 ký tự.
    expect((await congKhai()).matKhauToiThieu).toBe(12)
    const doi = await vao.agent
      .post('/api/xac-thuc/doi-mat-khau')
      .set(GHI)
      .send({ matKhauCu: MAU.MAT_KHAU, matKhauMoi: 'muoi-ky-tu' })
    expect(doi.status).toBe(400)
    expect((doi.body as { message: string }).message).toMatch(/ít nhất 12/)
  })
})

describe('sửa tên & nhận diện', () => {
  it('lưu xong màn đăng nhập hiện ngay; tên hệ thống trống thì 400', async () => {
    const { agent } = await dangNhap('quantri.tinh')
    const nd = { tenCoQuan: '  UBND Tỉnh Mẫu ', tenHeThong: 'Hệ thống thử', moTa: '' }
    expect((await agent.put('/api/cau-hinh/nhan-dien').set(GHI).send(nd)).status).toBe(200)
    expect((await congKhai()).nhanDien).toEqual({
      tenCoQuan: 'UBND Tỉnh Mẫu',
      tenHeThong: 'Hệ thống thử',
      moTa: '',
    })
    const rong = await agent
      .put('/api/cau-hinh/nhan-dien')
      .set(GHI)
      .send({ ...nd, tenHeThong: ' ' })
    expect(rong.status).toBe(400)
  })

  it('mọi lần sửa cấu hình đều vào nhật ký thao tác, kèm người sửa', async () => {
    const { agent } = await dangNhap('lanhdao.tinh')
    const { dong } = (await agent.get('/api/nhat-ky?bang=cau_hinh')).body as TrangNhatKy
    expect(dong.map((d) => d.giaTriMoi?.khoa).sort()).toEqual(['bao-mat', 'nhan-dien'])
    expect(dong.every((d) => d.nguoiLam === 'Quản trị cấp tỉnh')).toBe(true)
  })
})
