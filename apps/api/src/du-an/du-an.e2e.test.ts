/**
 * Dự án — đầu cuối: HTTP thật → guard → service → Postgres thật (PGlite) với RLS,
 * trigger, hàm SECURITY DEFINER. Luồng chính của PMS: tạo dự án từ quy trình mẫu,
 * ghi nhận bước, nhà thầu gửi → chủ đầu tư xác nhận.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type {
  DuAnDong,
  GiaTriDanhMuc,
  HoSoDuAn,
  QuyTrinhMauDong,
  TaiKhoanDanhBa,
  TrangNhatKy,
} from '@gdos/shared'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { donVi, phanCong, taiKhoan } from '../db/schema/index.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { bamMatKhau } from '../xac-thuc/mat-khau.js'

const DN = '00000000-0000-4000-8000-0000000000d1'
const GHI = { 'X-GDOS': '1' }

let db: CoSoThu
let app: INestApplication

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  // Nhà thầu: đơn vị doanh nghiệp dưới tỉnh, vai Chuyên viên phân công phân hệ Dự án.
  await db.chuBang
    .insert(donVi)
    .values({ id: DN, ma: 'DN-01', ten: 'Công ty Thử Nghiệm', cap: 'doanh-nghiep', chaId: MAU.TINH })
  const [nt] = await db.chuBang
    .insert(taiKhoan)
    .values({
      tenDangNhap: 'nhathau.dn',
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

const CO_BAN = {
  ten: 'Dự án thử nghiệm mua sắm thiết bị',
  donViId: MAU.XA_A,
  quyTrinhMa: 'mua-sam',
  loaiChi: 'dtpt',
  nhomDuAn: 'C',
  tongMuc: 1500,
  ngayBatDau: '2026-10-01',
}

let hs: HoSoDuAn

describe('tra cứu dùng chung', () => {
  it('6 quy trình mẫu, lĩnh vực, danh bạ tìm được nhà thầu ở đơn vị ngoài phạm vi', async () => {
    const cv = await vao('chuyenvien.a')
    const qt = (await cv.get('/api/quy-trinh-mau')).body as QuyTrinhMauDong[]
    expect(qt).toHaveLength(6)
    expect(qt.find((q) => q.ma === 'mua-sam')?.soBuoc).toBeGreaterThan(10)
    const lv = (await cv.get('/api/danh-muc?loai=linh-vuc')).body as GiaTriDanhMuc[]
    expect(lv.map((l) => l.ma)).toContain('cntt')
    expect((await cv.get('/api/danh-muc?loai=bang-luong')).status).toBe(400)
    const db = (await cv.get('/api/danh-ba?tim=nhathau&cap=doanh-nghiep')).body as TaiKhoanDanhBa[]
    expect(db.map((d) => d.tenDangNhap)).toEqual(['nhathau.dn'])
  })
})

describe('tạo dự án', () => {
  it('chép quy trình mẫu sang, tính hạn nối chuỗi, tự sinh mã, người tạo là cán bộ phụ trách', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv.post('/api/du-an').set(GHI).send(CO_BAN)
    expect(res.status).toBe(201)
    hs = res.body as HoSoDuAn
    expect(hs.ma).toMatch(/^DA-2026-\d{4}$/)
    expect(hs.hinhThuc).toBe('mua-sam')
    expect(hs.donViTen).toBe('Xã An Hòa')
    expect(hs.canBo?.hoTen).toBe('Chuyên viên xã An Hòa')
    expect(hs.buoc.length).toBeGreaterThan(10)
    const thuong = hs.buoc.filter((b) => !b.laNhom)
    expect(thuong.every((b) => b.han)).toBe(true)
    // Hạn không bao giờ lùi theo thứ tự bước (chuỗi cộng dồn, chưa có ghi đè).
    const han = hs.buoc.map((b) => b.han!)
    expect([...han].sort()).toEqual(han)
    expect(hs.quyen).toEqual({ sua: true, xacNhan: true, thanhVien: true, gui: false })
  })

  it('chặn: chủ đầu tư ngoài phạm vi, doanh nghiệp làm chủ đầu tư, quy trình lạ, mã trùng', async () => {
    const cv = await vao('chuyenvien.a')
    expect(
      (
        await cv
          .post('/api/du-an')
          .set(GHI)
          .send({ ...CO_BAN, donViId: MAU.XA_B })
      ).status,
    ).toBe(400)
    const tinh = await vao('quantri.tinh')
    // Quản trị tỉnh không có phân công nghiệp vụ → không tạo được dự án.
    expect((await tinh.post('/api/du-an').set(GHI).send(CO_BAN)).status).toBe(403)
    expect(
      (
        await cv
          .post('/api/du-an')
          .set(GHI)
          .send({ ...CO_BAN, quyTrinhMa: 'khong-co' })
      ).status,
    ).toBe(400)
    expect(
      (
        await cv
          .post('/api/du-an')
          .set(GHI)
          .send({ ...CO_BAN, ma: hs.ma })
      ).status,
    ).toBe(409)
    expect(
      (
        await cv
          .post('/api/du-an')
          .set(GHI)
          .send({ ...CO_BAN, ma: 'có dấu' })
      ).status,
    ).toBe(400)
  })

  it('xã khác không thấy; tỉnh thấy', async () => {
    const b = await vao('canbo.b')
    expect((await b.get(`/api/du-an/${hs.id}`)).status).toBe(404)
    expect(((await b.get('/api/du-an')).body as DuAnDong[]).map((d) => d.id)).not.toContain(hs.id)
    const tinh = await vao('lanhdao.tinh')
    expect(((await tinh.get('/api/du-an')).body as DuAnDong[]).map((d) => d.id)).toContain(hs.id)
  })
})

describe('ghi nhận bước', () => {
  const buocThuong = () => hs.buoc.filter((b) => !b.laNhom)

  it('hoàn thành → tiến độ tăng; bỏ hoàn thành → về như cũ', async () => {
    const cv = await vao('chuyenvien.a')
    const b = buocThuong()[0]!
    const res = await cv
      .post(`/api/du-an/${hs.id}/buoc/${b.id}/hoan-thanh`)
      .set(GHI)
      .send({ ngay: '2026-10-03', soVanBan: 'Tờ trình số 01/TTr' })
    expect(res.status).toBe(200)
    const moi = res.body as HoSoDuAn
    expect(moi.buoc.find((x) => x.id === b.id)).toMatchObject({
      ngayHoanThanh: '2026-10-03',
      soVanBan: 'Tờ trình số 01/TTr',
    })
    expect(moi.thongKe.xong).toBe(1)
    const lai = (await cv.post(`/api/du-an/${hs.id}/buoc/${b.id}/bo-hoan-thanh`).set(GHI)).body as HoSoDuAn
    expect(lai.thongKe.xong).toBe(0)
  })

  it('nhóm bước không ghi nhận được; bỏ qua phải có lý do; khôi phục được', async () => {
    const cv = await vao('chuyenvien.a')
    const nhom = hs.buoc.find((b) => b.laNhom)!
    expect(
      (await cv.post(`/api/du-an/${hs.id}/buoc/${nhom.id}/hoan-thanh`).set(GHI).send({ ngay: '2026-10-03' }))
        .status,
    ).toBe(400)
    const b = buocThuong()[1]!
    expect((await cv.post(`/api/du-an/${hs.id}/buoc/${b.id}/bo-qua`).set(GHI).send({})).status).toBe(400)
    const bq = (
      await cv
        .post(`/api/du-an/${hs.id}/buoc/${b.id}/bo-qua`)
        .set(GHI)
        .send({ lyDo: 'Không áp dụng cho gói này' })
    ).body as HoSoDuAn
    expect(bq.buoc.find((x) => x.id === b.id)).toMatchObject({
      boQua: true,
      lyDoBoQua: 'Không áp dụng cho gói này',
    })
    const kp = (await cv.post(`/api/du-an/${hs.id}/buoc/${b.id}/khoi-phuc`).set(GHI)).body as HoSoDuAn
    expect(kp.buoc.find((x) => x.id === b.id)?.boQua).toBe(false)
  })

  it('đổi số ngày một bước → hạn các bước sau lùi theo', async () => {
    const cv = await vao('chuyenvien.a')
    const ds = buocThuong()
    const b = ds[0]!
    const sau = ds[ds.length - 1]!
    const res = await cv
      .patch(`/api/du-an/${hs.id}/buoc/${b.id}`)
      .set(GHI)
      .send({ soNgay: b.soNgay + 10 })
    const moi = res.body as HoSoDuAn
    const hanCu = hs.buoc.find((x) => x.id === sau.id)!.han!
    const hanMoi = moi.buoc.find((x) => x.id === sau.id)!.han!
    expect(Date.parse(hanMoi) - Date.parse(hanCu)).toBe(10 * 864e5)
    hs = moi
  })
})

describe('nhà thầu gửi → chủ đầu tư xác nhận', () => {
  it('chủ đầu tư thêm nhà thầu làm thành viên', async () => {
    const cv = await vao('chuyenvien.a')
    const [nt] = (await cv.get('/api/danh-ba?tim=nhathau')).body as TaiKhoanDanhBa[]
    const res = await cv
      .post(`/api/du-an/${hs.id}/thanh-vien`)
      .set(GHI)
      .send({ taiKhoanId: nt!.id, vaiTro: 'nha-thau' })
    expect(res.status).toBe(200)
    expect((res.body as HoSoDuAn).thanhVien).toEqual([
      expect.objectContaining({ hoTen: 'Nhà thầu thử', donViTen: 'Công ty Thử Nghiệm', vaiTro: 'nha-thau' }),
    ])
    expect(
      (
        await cv
          .post(`/api/du-an/${hs.id}/thanh-vien`)
          .set(GHI)
          .send({ taiKhoanId: nt!.id, vaiTro: 'nha-thau' })
      ).status,
    ).toBe(409)
  })

  it('nhà thầu thấy đúng dự án mình tham gia, tên chủ đầu tư; chỉ được gửi, không được sửa', async () => {
    const nt = await vao('nhathau.dn')
    const ds = (await nt.get('/api/du-an')).body as DuAnDong[]
    expect(ds.map((d) => d.id)).toEqual([hs.id])
    const h = (await nt.get(`/api/du-an/${hs.id}`)).body as HoSoDuAn
    expect(h.donViTen).toBe('Xã An Hòa')
    expect(h.quyen).toEqual({ sua: false, xacNhan: false, thanhVien: false, gui: true })
    const b = hs.buoc.filter((x) => !x.laNhom)[2]!
    // Có quyền vai DU_AN.UPDATE (Chuyên viên) nhưng KHÔNG phải đơn vị chủ đầu tư → 403.
    expect(
      (await nt.post(`/api/du-an/${hs.id}/buoc/${b.id}/hoan-thanh`).set(GHI).send({ ngay: '2026-10-05' }))
        .status,
    ).toBe(403)
    const gui = await nt
      .post(`/api/du-an/${hs.id}/buoc/${b.id}/gui`)
      .set(GHI)
      .send({ ngay: '2026-10-05', ghiChu: 'Đã giao hàng' })
    expect(gui.status).toBe(200)
    expect((gui.body as HoSoDuAn).buoc.find((x) => x.id === b.id)).toMatchObject({
      ngayHoanThanh: null,
      choXacNhan: { ngay: '2026-10-05', ghiChu: 'Đã giao hàng', nguoiGuiTen: 'Nhà thầu thử' },
    })
  })

  it('chủ đầu tư thấy trong "Chờ xác nhận"; xác nhận → bước xong theo ngày nhà thầu báo', async () => {
    const cv = await vao('chuyenvien.a')
    const cho = (await cv.get('/api/du-an?loc=cho-xac-nhan')).body as DuAnDong[]
    expect(cho.map((d) => d.id)).toEqual([hs.id])
    expect(cho[0]!.thongKe.choXacNhan).toBe(1)
    const b = hs.buoc.filter((x) => !x.laNhom)[2]!
    const res = await cv.post(`/api/du-an/${hs.id}/buoc/${b.id}/xac-nhan`).set(GHI).send({ dongY: true })
    expect((res.body as HoSoDuAn).buoc.find((x) => x.id === b.id)).toMatchObject({
      ngayHoanThanh: '2026-10-05',
      choXacNhan: null,
      ghiChu: 'Đã giao hàng',
    })
    expect(((await cv.get('/api/du-an?loc=cho-xac-nhan')).body as DuAnDong[]).length).toBe(0)
  })

  it('lãnh đạo đơn vị (không nhập liệu) xác nhận được, nhưng không tự ghi nhận bước', async () => {
    const nt = await vao('nhathau.dn')
    const b = hs.buoc.filter((x) => !x.laNhom)[3]!
    await nt.post(`/api/du-an/${hs.id}/buoc/${b.id}/gui`).set(GHI).send({ ngay: '2026-10-06' })
    const ct = await vao('chutich.a')
    expect(
      (await ct.post(`/api/du-an/${hs.id}/buoc/${b.id}/hoan-thanh`).set(GHI).send({ ngay: '2026-10-06' }))
        .status,
    ).toBe(403)
    const tra = await ct.post(`/api/du-an/${hs.id}/buoc/${b.id}/xac-nhan`).set(GHI).send({ dongY: false })
    expect(tra.status).toBe(200)
    expect((tra.body as HoSoDuAn).buoc.find((x) => x.id === b.id)).toMatchObject({
      ngayHoanThanh: null,
      choXacNhan: null,
    })
  })

  it('người không phải thành viên gửi → bị từ chối', async () => {
    const b = await vao('canbo.b')
    const buoc = hs.buoc.filter((x) => !x.laNhom)[4]!
    expect(
      (await b.post(`/api/du-an/${hs.id}/buoc/${buoc.id}/gui`).set(GHI).send({ ngay: '2026-10-06' })).status,
    ).toBe(404)
  })
})

describe('sửa thông tin, nhật ký', () => {
  it('đổi ngày bắt đầu → mọi hạn dời theo; ghi "cập nhật gần nhất"', async () => {
    const cv = await vao('chuyenvien.a')
    const res = await cv
      .patch(`/api/du-an/${hs.id}`)
      .set(GHI)
      .send({ ngayBatDau: '2026-10-11', tienDoMoTa: 'Đang mua sắm' })
    const moi = res.body as HoSoDuAn
    const dau = hs.buoc.find((b) => !b.laNhom && !b.ngayHoanThanh && !b.hanGhiDe)!
    expect(Date.parse(moi.buoc.find((b) => b.id === dau.id)!.han!) - Date.parse(dau.han!)).toBe(10 * 864e5)
    expect(moi.tienDoMoTa).toBe('Đang mua sắm')
    expect(moi.capNhatNgay).toBeTruthy()
  })

  it('tạo dự án và xác nhận bước đều vào nhật ký thao tác', async () => {
    const ct = await vao('chutich.a')
    const { dong } = (await ct.get('/api/nhat-ky?bang=du_an&gioiHan=50')).body as TrangNhatKy
    expect(dong.some((d) => d.hanhDong === 'INSERT' && d.nguoiLam === 'Chuyên viên xã An Hòa')).toBe(true)
  })
})

describe('kế hoạch & điều chỉnh', () => {
  it('tạo dự án có sẵn phiên bản 1 — kế hoạch gốc, hạn đã chốt khớp hạn hiện tại', async () => {
    const cv = await vao('chuyenvien.a')
    const h = (
      await cv
        .post('/api/du-an')
        .set(GHI)
        .send({ ...CO_BAN, ma: 'DA-KH-01' })
    ).body as HoSoDuAn
    expect(h.phienBan).toHaveLength(1)
    expect(h.phienBan[0]).toMatchObject({ so: 1, lyDo: 'Kế hoạch gốc theo quy trình mẫu', soNgayLui: 0 })
    const b = h.buoc.find((x) => !x.laNhom)!
    expect(h.hanDaChot[b.id]).toBe(b.han)
    hs = h
  })

  it('thêm bước tự khai → vào dạng NHÁP: không hạn, không tính tiến độ; chèn đúng sau bước chọn', async () => {
    const cv = await vao('chuyenvien.a')
    const truoc = hs.buoc.filter((x) => !x.laNhom)[0]!
    const tongTruoc = hs.thongKe.tong
    const res = await cv
      .post(`/api/du-an/${hs.id}/buoc`)
      .set(GHI)
      .send({ giaiDoan: truoc.giaiDoan, sauBuocId: truoc.id, ten: 'Khảo sát bổ sung hiện trạng', soNgay: 7 })
    expect(res.status).toBe(201)
    const moi = res.body as HoSoDuAn
    const i = moi.buoc.findIndex((x) => x.id === truoc.id)
    expect(moi.buoc[i + 1]).toMatchObject({
      ten: 'Khảo sát bổ sung hiện trạng',
      laNhap: true,
      batBuoc: false,
      han: null,
    })
    expect(moi.thongKe.tong).toBe(tongTruoc)
    hs = moi
  })

  it('chốt kế hoạch: nháp thành chính thức, hạn sau dời theo, phiên bản 2 ghi số ngày lùi', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.post(`/api/du-an/${hs.id}/chot-ke-hoach`).set(GHI).send({})).status).toBe(400) // thiếu lý do
    const res = await cv
      .post(`/api/du-an/${hs.id}/chot-ke-hoach`)
      .set(GHI)
      .send({ lyDo: 'Bổ sung bước khảo sát', canCu: 'Công văn số 12/CV' })
    const moi = res.body as HoSoDuAn
    expect(moi.buoc.some((x) => x.laNhap)).toBe(false)
    expect(moi.phienBan[0]).toMatchObject({
      so: 2,
      lyDo: 'Bổ sung bước khảo sát',
      canCu: 'Công văn số 12/CV',
      soNgayLui: 7,
    })
    expect(moi.phienBan[0]!.nguoiChot).toBe('Chuyên viên xã An Hòa')
    const buocMoi = moi.buoc.find((x) => x.ten === 'Khảo sát bổ sung hiện trạng')!
    expect(buocMoi.han).toBeTruthy()
    expect(moi.hanDaChot[buocMoi.id]).toBe(buocMoi.han)
    hs = moi
  })

  it('sửa hạn sau khi chốt → hạn hiện tại lệch với hạn đã chốt (chưa có phiên bản mới)', async () => {
    const cv = await vao('chuyenvien.a')
    const b = hs.buoc.filter((x) => !x.laNhom)[0]!
    const moi = (
      await cv
        .patch(`/api/du-an/${hs.id}/buoc/${b.id}`)
        .set(GHI)
        .send({ soNgay: b.soNgay + 3 })
    ).body as HoSoDuAn
    const cuoi = moi.buoc.filter((x) => !x.laNhom).at(-1)!
    expect(moi.phienBan).toHaveLength(2)
    expect(Date.parse(cuoi.han!) - Date.parse(moi.hanDaChot[cuoi.id]!)).toBe(3 * 864e5)
    hs = moi
  })

  it('bước tự thêm: đổi tên được, xóa được; bước theo quy trình: không đổi tên, không xóa', async () => {
    const cv = await vao('chuyenvien.a')
    const tuThem = hs.buoc.find((x) => !x.batBuoc)!
    const mau = hs.buoc.find((x) => x.batBuoc && !x.laNhom)!
    expect(
      (await cv.patch(`/api/du-an/${hs.id}/buoc/${mau.id}`).set(GHI).send({ ten: 'Đổi tên' })).status,
    ).toBe(400)
    expect((await cv.post(`/api/du-an/${hs.id}/buoc/${mau.id}/xoa`).set(GHI)).status).toBe(400)
    const doi = (
      await cv.patch(`/api/du-an/${hs.id}/buoc/${tuThem.id}`).set(GHI).send({ ten: 'Khảo sát hiện trạng' })
    ).body as HoSoDuAn
    expect(doi.buoc.find((x) => x.id === tuThem.id)?.ten).toBe('Khảo sát hiện trạng')
    const xoa = (await cv.post(`/api/du-an/${hs.id}/buoc/${tuThem.id}/xoa`).set(GHI)).body as HoSoDuAn
    expect(xoa.buoc.find((x) => x.id === tuThem.id)).toBeUndefined()
    hs = xoa
  })

  it('nhà thầu không thêm bước, không chốt kế hoạch; xã khác không thấy phiên bản', async () => {
    const cv = await vao('chuyenvien.a')
    const [nt] = (await cv.get('/api/danh-ba?tim=nhathau')).body as TaiKhoanDanhBa[]
    await cv.post(`/api/du-an/${hs.id}/thanh-vien`).set(GHI).send({ taiKhoanId: nt!.id, vaiTro: 'nha-thau' })
    const n = await vao('nhathau.dn')
    expect(
      (await n.post(`/api/du-an/${hs.id}/buoc`).set(GHI).send({ giaiDoan: 'I', ten: 'Lén' })).status,
    ).toBe(403)
    expect((await n.post(`/api/du-an/${hs.id}/chot-ke-hoach`).set(GHI).send({ lyDo: 'x' })).status).toBe(403)
    const h = (await n.get(`/api/du-an/${hs.id}`)).body as HoSoDuAn
    expect(h.phienBan.length).toBe(2) // thành viên xem được lịch sử kế hoạch
  })
})
