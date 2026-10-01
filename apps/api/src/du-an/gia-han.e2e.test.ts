/**
 * Dự án — xin gia hạn bước qua luồng phê duyệt (cấu hình ở Tầng 2), và phân tích nguyên
 * nhân – giải pháp của vướng mắc. Đầu cuối: HTTP → guard → service → Postgres (PGlite) + RLS.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { CauHinhHeThong, HoSoDuAn, TaiKhoanDanhBa } from '@gdos/shared'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { donVi, phanCong, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { bamMatKhau } from '../xac-thuc/mat-khau.js'

const DN = '00000000-0000-4000-8000-0000000000d2'
const GHI = { 'X-GDOS': '1' }

let db: CoSoThu
let app: INestApplication
let hs: HoSoDuAn

async function vao(ten: string) {
  const agent = request.agent(app.getHttpServer() as Parameters<typeof request.agent>[0])
  const res = await agent
    .post('/api/xac-thuc/dang-nhap')
    .set(GHI)
    .send({ tenDangNhap: ten, matKhau: MAU.MAT_KHAU })
  expect(res.status).toBe(200)
  return agent
}
type NguoiDung = Awaited<ReturnType<typeof vao>>

const buocThu = (h: HoSoDuAn, n: number) => h.buoc.filter((b) => !b.laNhom)[n]!
const congNgay = (ngay: string, so: number) =>
  new Date(Date.parse(`${ngay}T00:00:00Z`) + so * 864e5).toISOString().slice(0, 10)

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  await db.chuBang
    .insert(donVi)
    .values({ id: DN, ma: 'DN-02', ten: 'Công ty Thử Nghiệm', cap: 'doanh-nghiep', chaId: MAU.TINH })
  const [nt] = await db.chuBang
    .insert(taiKhoan)
    .values({
      tenDangNhap: 'nhathau.gh',
      hoTen: 'Nhà thầu thử',
      donViId: DN,
      matKhauBam: await bamMatKhau(MAU.MAT_KHAU),
    })
    .returning({ id: taiKhoan.id })
  await db.chuBang
    .insert(phanCong)
    .values({ taiKhoanId: nt!.id, donViId: DN, vai: 'CHUYEN_VIEN', phamVi: ['du-an'] })

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
  const tao = await cv.post('/api/du-an').set(GHI).send({
    ten: 'Dự án thử gia hạn',
    donViId: MAU.XA_A,
    quyTrinhMa: 'mua-sam',
    loaiChi: 'dtpt',
    tongMuc: 900,
    ngayBatDau: '2026-10-01',
  })
  expect(tao.status).toBe(201)
  hs = tao.body as HoSoDuAn
  const [tk] = (await cv.get('/api/danh-ba?tim=nhathau.gh')).body as TaiKhoanDanhBa[]
  expect(
    (
      await cv
        .post(`/api/du-an/${hs.id}/thanh-vien`)
        .set(GHI)
        .send({ taiKhoanId: tk!.id, vaiTro: 'nha-thau' })
    ).status,
  ).toBe(200)
}, 60_000)

afterAll(async () => {
  await app.close()
  await db.pg.close()
})

const xin = (ai: NguoiDung, buocId: string, hanMoi: string, lyDo = 'Chờ báo giá của nhà cung cấp') =>
  ai
    .post(`/api/du-an/${hs.id}/buoc/${buocId}/xin-gia-han`)
    .set(GHI)
    .send({ hanMoi, lyDo, canCu: 'Tờ trình 12/TTr' })
const duyet = (ai: NguoiDung, yeuCauId: string, dongY: boolean, yKien?: string) =>
  ai.post(`/api/du-an/${hs.id}/gia-han/${yeuCauId}/duyet`).set(GHI).send({ dongY, yKien })

describe('xin gia hạn — luồng mặc định một cấp (lãnh đạo đơn vị)', () => {
  it('hồ sơ cho biết luồng đang áp dụng và ai được xin', async () => {
    const cv = await vao('chuyenvien.a')
    const h = (await cv.get(`/api/du-an/${hs.id}`)).body as HoSoDuAn
    expect(h.luongGiaHan).toEqual({ bat: true, cap: [{ ten: 'Lãnh đạo đơn vị phê duyệt', vai: 'lanh-dao' }] })
    expect(h.giaHan).toEqual([])
    expect(h.quyen.xinGiaHan).toBe(true)
  })

  it('nhà thầu xin: hạn chưa đổi; hạn mới phải sau hạn cũ; một bước một yêu cầu chờ', async () => {
    const nt = await vao('nhathau.gh')
    const b = buocThu(hs, 2)
    expect((await xin(nt, b.id, b.han!)).status).toBe(400)
    expect((await xin(nt, b.id, 'khong-phai-ngay')).status).toBe(400)
    const nhom = hs.buoc.find((x) => x.laNhom)!
    expect((await xin(nt, nhom.id, '2027-01-01')).status).toBe(400)

    const r = await xin(nt, b.id, congNgay(b.han!, 7))
    expect(r.status).toBe(200)
    const h = r.body as HoSoDuAn
    expect(h.buoc.find((x) => x.id === b.id)!.han).toBe(b.han)
    expect(h.giaHan).toHaveLength(1)
    expect(h.giaHan[0]).toMatchObject({
      buocId: b.id,
      hanCu: b.han,
      hanMoi: congNgay(b.han!, 7),
      trangThai: 'cho-duyet',
      nguoiXinTen: 'Nhà thầu thử',
      capHienTai: 1,
      daQua: [],
      duocDuyet: false,
      duocRut: true,
    })
    expect((await xin(nt, b.id, congNgay(b.han!, 9))).status).toBe(409)
  })

  it('chuyên viên không duyệt được cấp của lãnh đạo; nhà thầu không duyệt được; từ chối phải có lý do', async () => {
    const cv = await vao('chuyenvien.a')
    const h = (await cv.get(`/api/du-an/${hs.id}`)).body as HoSoDuAn
    const yc = h.giaHan[0]!
    expect(yc.duocDuyet).toBe(false)
    const r = await duyet(cv, yc.id, true)
    expect(r.status).toBe(403)
    expect(String((r.body as { message: string }).message)).toContain('Lãnh đạo')
    expect((await duyet(await vao('nhathau.gh'), yc.id, true)).status).toBe(403)
    const ct = await vao('chutich.a')
    expect((await duyet(ct, yc.id, false)).status).toBe(400)
  })

  it('lãnh đạo duyệt: hạn bước đổi, các bước sau dời theo, kế hoạch chốt phiên bản mới', async () => {
    const ct = await vao('chutich.a')
    const truoc = (await ct.get(`/api/du-an/${hs.id}`)).body as HoSoDuAn
    const yc = truoc.giaHan[0]!
    expect(yc.duocDuyet).toBe(true)
    const b = buocThu(truoc, 2)
    const sauB = buocThu(truoc, 3)

    const r = await duyet(ct, yc.id, true, 'Đồng ý')
    expect(r.status).toBe(200)
    const h = r.body as HoSoDuAn
    expect(h.giaHan[0]).toMatchObject({ trangThai: 'da-duyet', capHienTai: null, duocDuyet: false })
    expect(h.giaHan[0]!.daQua).toEqual([
      expect.objectContaining({ cap: 1, dongY: true, yKien: 'Đồng ý', nguoiTen: 'Chủ tịch xã An Hòa' }),
    ])
    expect(h.buoc.find((x) => x.id === b.id)).toMatchObject({ han: yc.hanMoi, hanGhiDe: yc.hanMoi })
    expect(h.buoc.find((x) => x.id === sauB.id)!.han).toBe(congNgay(sauB.han!, 7))
    expect(h.phienBan).toHaveLength(truoc.phienBan.length + 1)
    expect(h.phienBan[0]).toMatchObject({ soNgayLui: 7, canCu: 'Tờ trình 12/TTr' })
    expect(h.phienBan[0]!.lyDo).toContain(`Gia hạn bước ${b.stt}`)
    // Đã kết thúc thì không duyệt lại.
    expect((await duyet(ct, yc.id, true)).status).toBe(400)
    hs = h
  })

  it('từ chối: hạn giữ nguyên; người gửi rút được yêu cầu đang chờ, người khác thì không', async () => {
    const nt = await vao('nhathau.gh')
    const b = buocThu(hs, 4)
    const h1 = (await xin(nt, b.id, congNgay(b.han!, 5))).body as HoSoDuAn
    const ct = await vao('chutich.a')
    const tc = (await duyet(ct, h1.giaHan[0]!.id, false, 'Chưa đủ căn cứ')).body as HoSoDuAn
    expect(tc.giaHan[0]).toMatchObject({ trangThai: 'tu-choi' })
    expect(tc.buoc.find((x) => x.id === b.id)!.han).toBe(b.han)
    expect(tc.phienBan).toHaveLength(hs.phienBan.length)

    const h2 = (await xin(nt, b.id, congNgay(b.han!, 5))).body as HoSoDuAn
    const yc = h2.giaHan[0]!
    const cv = await vao('chuyenvien.a')
    expect((await cv.post(`/api/du-an/${hs.id}/gia-han/${yc.id}/rut`).set(GHI)).status).toBe(403)
    const rut = await nt.post(`/api/du-an/${hs.id}/gia-han/${yc.id}/rut`).set(GHI)
    expect(rut.status).toBe(200)
    expect((rut.body as HoSoDuAn).giaHan[0]).toMatchObject({ trangThai: 'da-rut', duocRut: false })
    expect((await duyet(ct, yc.id, true)).status).toBe(400)
  })
})

describe('cấu hình luồng phê duyệt (Tầng 2)', () => {
  const HAI_CAP = {
    bat: true,
    choTuDuyet: false,
    cap: [
      { ten: 'Cán bộ phụ trách thẩm định', vai: 'can-bo' },
      { ten: 'Lãnh đạo phê duyệt', vai: 'lanh-dao' },
    ],
  }

  it('chỉ quản trị đơn vị gốc sửa được; luồng sai bị từ chối', async () => {
    const qt = await vao('quantri.tinh')
    const xem = (await qt.get('/api/cau-hinh')).body as CauHinhHeThong
    expect(xem.luongDuyet['gia-han-buoc'].cap).toHaveLength(1)
    const put = (ai: NguoiDung, ma: string, than: object) =>
      ai.put(`/api/cau-hinh/luong-duyet/${ma}`).set(GHI).send(than)
    expect((await put(qt, 'gia-han-buoc', { ...HAI_CAP, cap: [] })).status).toBe(400)
    expect((await put(qt, 'gia-han-buoc', { ...HAI_CAP, cap: [{ ten: 'x', vai: 'giam-doc' }] })).status).toBe(
      400,
    )
    expect((await put(qt, 'khong-co', HAI_CAP)).status).toBe(400)
    expect((await put(await vao('chuyenvien.a'), 'gia-han-buoc', HAI_CAP)).status).toBe(403)
    expect((await put(await vao('quantri'), 'gia-han-buoc', HAI_CAP)).status).toBe(403)
    const luu = await put(qt, 'gia-han-buoc', HAI_CAP)
    expect(luu.status).toBe(200)
    expect((luu.body as CauHinhHeThong).luongDuyet['gia-han-buoc']).toEqual(HAI_CAP)
  })

  it('hai cấp: cán bộ thẩm định rồi lãnh đạo phê duyệt; người gửi không tự duyệt', async () => {
    // Bỏ nhớ đệm cấu hình 10 giây của dịch vụ bằng cách đọc lại qua hồ sơ sau khi lưu.
    const cv = await vao('chuyenvien.a')
    const b = buocThu(hs, 5)
    const r = await xin(cv, b.id, congNgay(b.han!, 3), 'Cán bộ tự xin')
    expect(r.status).toBe(200)
    const yc = (r.body as HoSoDuAn).giaHan[0]!
    expect(yc.cacCap).toHaveLength(2)
    expect(yc.duocDuyet).toBe(false) // người gửi, không tự duyệt
    expect((await duyet(cv, yc.id, true)).status).toBe(403)

    // Nhà thầu gửi yêu cầu khác → cán bộ duyệt cấp 1, lãnh đạo duyệt cấp 2.
    const nt = await vao('nhathau.gh')
    const c = buocThu(hs, 6)
    const yc2 = ((await xin(nt, c.id, congNgay(c.han!, 4))).body as HoSoDuAn).giaHan[0]!
    const ct = await vao('chutich.a')
    // Lãnh đạo (không có quyền cập nhật) chưa duyệt được cấp 1.
    expect((await duyet(ct, yc2.id, true)).status).toBe(403)
    const c1 = (await duyet(cv, yc2.id, true, 'Đủ hồ sơ')).body as HoSoDuAn
    expect(c1.giaHan.find((y) => y.id === yc2.id)).toMatchObject({ trangThai: 'cho-duyet', capHienTai: 2 })
    expect(c1.buoc.find((x) => x.id === c.id)!.han).toBe(c.han)
    const c2 = (await duyet(ct, yc2.id, true)).body as HoSoDuAn
    const xong = c2.giaHan.find((y) => y.id === yc2.id)!
    expect(xong.trangThai).toBe('da-duyet')
    expect(xong.daQua.map((d) => [d.cap, d.tenCap, d.dongY])).toEqual([
      [1, 'Cán bộ phụ trách thẩm định', true],
      [2, 'Lãnh đạo phê duyệt', true],
    ])
    expect(c2.buoc.find((x) => x.id === c.id)!.han).toBe(congNgay(c.han!, 4))
  })

  it('tắt luồng: không nhận yêu cầu mới', async () => {
    const qt = await vao('quantri.tinh')
    const tat = await qt
      .put('/api/cau-hinh/luong-duyet/gia-han-buoc')
      .set(GHI)
      .send({ ...HAI_CAP, bat: false })
    expect(tat.status).toBe(200)
    const nt = await vao('nhathau.gh')
    const b = buocThu(hs, 8)
    const r = await xin(nt, b.id, congNgay(b.han!, 2))
    expect(r.status).toBe(400)
    expect(String((r.body as { message: string }).message)).toContain('đang tắt')
  })
})

describe('vướng mắc: phân tích nguyên nhân và giải pháp', () => {
  it('nêu kèm phân tích, sửa phân tích sau, xóa từng trường; nhóm lạ bị từ chối', async () => {
    const cv = await vao('chuyenvien.a')
    const neu = await cv.post(`/api/du-an/${hs.id}/vuong-mac`).set(GHI).send({
      noiDung: 'Nhà cung cấp chậm báo giá',
      nhomNguyenNhan: 'nha-thau',
      nguyenNhan: 'Chỉ một đơn vị gửi báo giá',
      mucDo: 'cao',
    })
    expect(neu.status).toBe(201)
    const vm = (neu.body as HoSoDuAn).vuongMac[0]!
    expect(vm).toMatchObject({
      nhomNguyenNhan: 'nha-thau',
      nguyenNhan: 'Chỉ một đơn vị gửi báo giá',
      giaiPhap: null,
      mucDo: 'cao',
    })

    const sua = await cv.patch(`/api/du-an/${hs.id}/vuong-mac/${vm.id}`).set(GHI).send({
      giaiPhap: 'Mời thêm hai đơn vị báo giá',
      donViXuLy: 'Phòng Kinh tế',
      hanXuLy: '2026-11-15',
      nguyenNhan: '',
    })
    expect(sua.status).toBe(200)
    expect((sua.body as HoSoDuAn).vuongMac[0]).toMatchObject({
      nhomNguyenNhan: 'nha-thau',
      nguyenNhan: null,
      giaiPhap: 'Mời thêm hai đơn vị báo giá',
      donViXuLy: 'Phòng Kinh tế',
      hanXuLy: '2026-11-15',
    })
    const sai = await cv
      .patch(`/api/du-an/${hs.id}/vuong-mac/${vm.id}`)
      .set(GHI)
      .send({ nhomNguyenNhan: 'la' })
    expect(sai.status).toBe(400)
    // Nhà thầu (ngoài đơn vị chủ đầu tư) không sửa phân tích.
    const nt = await vao('nhathau.gh')
    expect(
      (await nt.patch(`/api/du-an/${hs.id}/vuong-mac/${vm.id}`).set(GHI).send({ giaiPhap: 'x' })).status,
    ).toBe(403)
  })
})
