/**
 * Nguồn dữ liệu vào: nạp số liệu chỉ tiêu qua API (nguồn giả) và Excel → kho → Điều hành.
 * Số trong test là bịa.
 */
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  dongChiTieuBenhVien,
  MA_CONG_SUAT_GIUONG,
  type BangChiTieu,
  type BangDieuHanhBenhVien,
  type KetQuaKiemNap,
  type KetQuaThuNguon,
  type LanNap,
  type NguonApi,
  type SoLieuDaNap,
} from '@gdos/shared'
import ExcelJS from 'exceljs'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AppModule } from '../app.module.js'
import { CAU_HINH, docCauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { MAU, napMau, taoCoSoThu, type CoSoThu } from '../test/co-so-thu.js'
import { GOI_NGUON_NGOAI, kiemDiaChiNguon, laIpCam, type PhanHoiNgoai } from './goi-ngoai.js'

const GHI = { 'X-GDOS': '1' }
const NGUON = 'https://mot-cua.thu/api/so-lieu'

let daGoi: { diaChi: string; headers: Record<string, string> }[] = []
let phanHoi: PhanHoiNgoai = { ma: 200, than: '{}' }
const goiGia = (diaChi: string, headers: Record<string, string>) => {
  daGoi.push({ diaChi, headers })
  return Promise.resolve(phanHoi)
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

async function tepExcel(hang: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Số liệu')
  ws.addRow(['Mã chỉ tiêu', 'Kỳ (MM/YYYY)', 'Giá trị', 'Tên chỉ tiêu'])
  for (const h of hang) ws.addRow(h)
  return Buffer.from(await wb.xlsx.writeBuffer())
}

beforeAll(async () => {
  db = await taoCoSoThu()
  await napMau(db)
  const mod = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(CAU_HINH)
    .useValue(docCauHinh({ NODE_ENV: 'test' }))
    .overrideProvider(CoSoDuLieu)
    .useValue({ db: db.coSo, kiemTra: () => Promise.resolve('ok') })
    .overrideProvider(GOI_NGUON_NGOAI)
    .useValue(goiGia)
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

describe('chặn địa chỉ nguồn (SSRF)', () => {
  it('không cho gọi vào chính máy chủ, link-local, metadata; production chỉ https', () => {
    for (const ip of [
      '127.0.0.1',
      '127.8.8.8',
      '0.0.0.0',
      '169.254.169.254',
      '::1',
      '::ffff:127.0.0.1',
      'fe80::1',
    ])
      expect(laIpCam(ip)).toBe(true)
    for (const ip of ['10.0.0.5', '192.168.1.10', '8.8.8.8']) expect(laIpCam(ip)).toBe(false)
    expect(() => kiemDiaChiNguon('http://localhost:3000/x', false)).toThrow()
    expect(() => kiemDiaChiNguon('http://a.localhost/x', false)).toThrow()
    expect(() => kiemDiaChiNguon('http://[::1]/x', false)).toThrow()
    expect(() => kiemDiaChiNguon('http://169.254.169.254/latest', false)).toThrow()
    expect(() => kiemDiaChiNguon('ftp://a.vn/x', false)).toThrow()
    expect(() => kiemDiaChiNguon('https://u:p@a.vn/x', false)).toThrow()
    expect(() => kiemDiaChiNguon('http://a.vn/x', true)).toThrow()
    expect(kiemDiaChiNguon('http://10.0.0.5/x', false).hostname).toBe('10.0.0.5')
    expect(kiemDiaChiNguon('https://a.vn/x', true).hostname).toBe('a.vn')
  })
})

describe('quyền', () => {
  it('chỉ quản trị vào được Nguồn dữ liệu vào', async () => {
    const cv = await vao('chuyenvien.a')
    expect((await cv.get('/api/nguon-vao/api')).status).toBe(403)
    expect((await cv.get('/api/nguon-vao/so-lieu')).status).toBe(403)
    expect((await cv.get('/api/nguon-vao/excel/mau')).status).toBe(403)
    expect((await cv.post('/api/nguon-vao/excel').set(GHI)).status).toBe(403)
  })
})

describe('kênh Excel', () => {
  it('tệp mẫu đọc lại được; hàng trống giá trị bị bỏ qua', async () => {
    const qt = await vao('quantri')
    const mau = await qt
      .get('/api/nguon-vao/excel/mau')
      .buffer(true)
      .parse((res, cb) => {
        const phan: Buffer[] = []
        res.on('data', (c: Buffer) => phan.push(c))
        res.on('end', () => cb(null, Buffer.concat(phan)))
      })
    expect(mau.status).toBe(200)
    // Mẫu chưa điền số nào → báo rõ, không coi là hợp lệ.
    const r = await qt
      .post('/api/nguon-vao/excel/kiem-tra')
      .set(GHI)
      .attach('tep', mau.body as Buffer, 'mau.xlsx')
    expect(r.status).toBe(400)
    expect(String((r.body as { message: string }).message)).toContain('chưa có dòng nào')
  })

  it('có dòng sai → kiểm chỉ ra từng lỗi, nạp bị từ chối, kho không đổi', async () => {
    const qt = await vao('quantri')
    const tep = await tepExcel([
      ['TTHC-01', '09/2026', 1300],
      ['KHONG-CO', '09/2026', 5],
      ['KPI-01', '09/2026', 90],
      ['TTHC-06', '09/2026', 120],
      ['TTHC-02', 'thang chin', 10],
      ['TTHC-01', 'T9/2026', 7],
      ['TTHC-03', '09/2026', 'abc'],
    ])
    const k = (await qt.post('/api/nguon-vao/excel/kiem-tra').set(GHI).attach('tep', tep, 'so.xlsx'))
      .body as KetQuaKiemNap
    expect([k.soHopLe, k.soLoi]).toEqual([1, 6])
    const loi = Object.fromEntries(k.dong.map((d) => [d.hang, d.loi.join('|')]))
    expect(loi[3]).toContain('Không có chỉ tiêu')
    expect(loi[4]).toContain('KPI tự tính')
    expect(loi[5]).toContain('0 đến 100')
    expect(loi[6]).toContain('Kỳ không đọc được')
    expect(loi[7]).toContain('Trùng')
    expect(loi[8]).toContain('không phải số')
    expect((await qt.post('/api/nguon-vao/excel').set(GHI).attach('tep', tep, 'so.xlsx')).status).toBe(400)
    expect((await qt.get('/api/nguon-vao/so-lieu')).body).toEqual([])
    expect(
      (await qt.post('/api/nguon-vao/excel').set(GHI).attach('tep', Buffer.from('x'), 'so.txt')).status,
    ).toBe(400)
  })

  it('nạp nhiều kỳ → số lên Điều hành với nhãn nguồn Excel; đơn vị khác không thấy', async () => {
    const qt = await vao('quantri')
    const tep = await tepExcel([
      ['TTHC-01', '08/2026', 1100],
      ['TTHC-01', '09/2026', '1.300'],
      ['tthc-06', '2026-09', '96,5'],
    ])
    const l = (await qt.post('/api/nguon-vao/excel').set(GHI).attach('tep', tep, 'thang-9.xlsx'))
      .body as LanNap
    expect(l).toMatchObject({
      kenh: 'excel',
      tenNguon: 'thang-9.xlsx',
      trangThai: 'xong',
      soDong: 3,
      soLoi: 0,
    })
    expect(l.nguoiNap).toBe('Quản trị hệ thống')

    // Lãnh đạo cùng xã xem Điều hành: số nạp đè số minh họa, kèm kênh, kỳ, chuỗi các kỳ.
    const ct = await vao('chutich.a')
    const b = (await ct.get('/api/chi-tieu')).body as BangChiTieu
    expect(b.giaTri['TTHC-01']).toMatchObject({
      giaTri: 1300,
      nguon: 'nap',
      kenh: 'excel',
      tenNguon: 'thang-9.xlsx',
      ky: 'T9/2026',
      chuoi: [1100, 1300],
    })
    expect(b.giaTri['TTHC-06']).toMatchObject({ giaTri: 96.5, nguon: 'nap' })
    expect(b.giaTri['TTHC-04']!.nguon).toBe('minh-hoa')
    // KPI-01 = TTHC-03 ÷ TTHC-02, cả hai còn là minh họa → KPI vẫn minh họa.
    expect(b.giaTri['KPI-01']!.nguon).toBe('minh-hoa')

    // Xã khác: không thấy số của xã này (RLS + chỉ lấy đúng đơn vị mình).
    const xaB = await vao('canbo.b')
    expect(((await xaB.get('/api/chi-tieu')).body as BangChiTieu).giaTri['TTHC-01']!.nguon).toBe('minh-hoa')
    const tinh = await vao('lanhdao.tinh')
    expect(((await tinh.get('/api/chi-tieu')).body as BangChiTieu).giaTri['TTHC-01']!.nguon).toBe('minh-hoa')
  })
})

describe('kênh API', () => {
  let qt: Awaited<ReturnType<typeof vao>>
  const cauHinh = {
    ten: 'Một cửa điện tử',
    diaChi: NGUON,
    xacThuc: 'header',
    tenHeader: 'X-API-Key',
    biMat: 'khoa-thu-123',
    bat: true,
    anhXa: {
      kieu: 'truong',
      duongDan: 'data',
      truongMa: '',
      truongGiaTri: '',
      truongKy: 'ky',
      cap: [
        { truong: 'tiepNhan', maChiTieu: 'TTHC-01' },
        { truong: 'daGiaiQuyet', maChiTieu: 'TTHC-02' },
        { truong: 'dungHan', maChiTieu: 'TTHC-03' },
      ],
    },
  }

  beforeAll(async () => {
    qt = await vao('quantri')
  })

  it('cấu hình sai bị từ chối; địa chỉ nội bộ của hạ tầng bị chặn', async () => {
    const sai = async (doi: object) =>
      (
        await qt
          .post('/api/nguon-vao/api')
          .set(GHI)
          .send({ ...cauHinh, ...doi })
      ).status
    expect(await sai({ ten: '' })).toBe(400)
    expect(await sai({ diaChi: 'http://127.0.0.1:5433/' })).toBe(400)
    expect(await sai({ diaChi: 'http://169.254.169.254/latest/meta-data' })).toBe(400)
    expect(await sai({ anhXa: { ...cauHinh.anhXa, cap: [{ truong: 'a', maChiTieu: 'KPI-01' }] } })).toBe(400)
    expect(await sai({ anhXa: { ...cauHinh.anhXa, duongDan: 'a..b' } })).toBe(400)
  })

  it('lấy thử: gọi thật bằng khóa vừa nhập, xem trước, CHƯA ghi gì', async () => {
    phanHoi = {
      ma: 200,
      than: JSON.stringify({ data: { ky: '2026-10', tiepNhan: 1400, daGiaiQuyet: 1350, dungHan: 'x' } }),
    }
    const r = (await qt.post('/api/nguon-vao/api/thu').set(GHI).send(cauHinh)).body as KetQuaThuNguon
    expect(daGoi[0]).toEqual({ diaChi: NGUON, headers: { 'X-API-Key': 'khoa-thu-123' } })
    expect([r.loi, r.soHopLe, r.soLoi]).toEqual([null, 2, 1])
    expect(r.mauJson).toContain('tiepNhan')
    expect((await qt.get('/api/nguon-vao/api')).body).toEqual([])

    phanHoi = { ma: 200, than: JSON.stringify({ khac: 1 }) }
    const hong = (await qt.post('/api/nguon-vao/api/thu').set(GHI).send(cauHinh)).body as KetQuaThuNguon
    expect(hong.loi).toContain('Không thấy ĐỐI TƯỢNG')
    phanHoi = { ma: 500, than: 'loi' }
    expect(
      ((await qt.post('/api/nguon-vao/api/thu').set(GHI).send(cauHinh)).body as KetQuaThuNguon).loi,
    ).toContain('500')
  })

  it('lưu nguồn: khóa không bao giờ trả về; sửa không gửi khóa thì giữ khóa cũ', async () => {
    const tao = await qt.post('/api/nguon-vao/api').set(GHI).send(cauHinh)
    expect(tao.status).toBe(201)
    const [n] = tao.body as NguonApi[]
    expect(n).toMatchObject({ ten: 'Một cửa điện tử', coBiMat: true, lanCuoi: null })
    expect(JSON.stringify(tao.body)).not.toContain('khoa-thu-123')

    const { biMat: _bo, ...khongKhoa } = cauHinh
    const sua = await qt
      .patch(`/api/nguon-vao/api/${n!.id}`)
      .set(GHI)
      .send({ ...khongKhoa, ten: 'Một cửa' })
    expect((sua.body as NguonApi[])[0]).toMatchObject({ ten: 'Một cửa', coBiMat: true })
    // Khóa nằm ở bảng riêng, đã mã hóa — không có bản rõ trong cơ sở dữ liệu, kể cả nhật ký.
    const tho = await db.pg.query<{ s: string }>(
      `select coalesce(string_agg(ma_hoa, ','), '') || (select coalesce(string_agg(gia_tri_moi::text, ','), '') from nhat_ky_thao_tac) as s from nguon_du_lieu_bi_mat`,
    )
    expect(tho.rows[0]!.s).not.toContain('khoa-thu-123')
  })

  it('lấy ngay: ghi dòng đúng, bỏ dòng sai, để lại vết; số lên Điều hành và KPI tính theo', async () => {
    const [n] = (await qt.get('/api/nguon-vao/api')).body as NguonApi[]
    phanHoi = {
      ma: 200,
      than: JSON.stringify({ data: { ky: '2026-10', tiepNhan: 1400, daGiaiQuyet: 1350, dungHan: 1296 } }),
    }
    const l = (await qt.post(`/api/nguon-vao/api/${n!.id}/lay`).set(GHI)).body as LanNap
    expect(l).toMatchObject({ kenh: 'api', tenNguon: 'Một cửa', trangThai: 'xong', soDong: 3, soLoi: 0 })
    expect(daGoi[0]!.headers).toEqual({ 'X-API-Key': 'khoa-thu-123' })

    const b = (await (await vao('chutich.a')).get('/api/chi-tieu')).body as BangChiTieu
    // TTHC-01 có kỳ 8, 9 từ Excel và kỳ 10 từ API — kỳ mới nhất thắng, chuỗi nối cả hai kênh.
    expect(b.giaTri['TTHC-01']).toMatchObject({ giaTri: 1400, nguon: 'nap', kenh: 'api', ky: 'T10/2026' })
    expect(b.giaTri['TTHC-01']!.chuoi).toEqual([1100, 1300, 1400])
    // KPI-01 = TTHC-03 ÷ TTHC-02 = 1296 ÷ 1350 = 96 % — cả hai gốc đều là số nạp.
    expect(b.giaTri['KPI-01']).toMatchObject({ giaTri: 96, nguon: 'nap', kenh: 'api' })

    // Lần sau nguồn hỏng: không ghi gì, vết ghi lỗi, số cũ giữ nguyên.
    phanHoi = { ma: 503, than: '' }
    const hong = (await qt.post(`/api/nguon-vao/api/${n!.id}/lay`).set(GHI)).body as LanNap
    expect(hong).toMatchObject({ trangThai: 'loi', soDong: 0, soLoi: 1 })
    expect(hong.loi[0]).toContain('503')
    const ds = (await qt.get('/api/nguon-vao/api')).body as NguonApi[]
    expect(ds[0]!.lanCuoi).toMatchObject({ trangThai: 'loi' })
    expect(((await qt.get('/api/nguon-vao/lan-nap')).body as LanNap[]).map((x) => x.kenh)).toEqual([
      'api',
      'api',
      'excel',
    ])
  })

  it('bỏ một số nạp nhầm → Điều hành quay về kỳ trước; nạp lại thì số sống lại', async () => {
    const kho = (await qt.get('/api/nguon-vao/so-lieu')).body as SoLieuDaNap[]
    const t10 = kho.find((d) => d.maChiTieu === 'TTHC-01' && d.ky === '2026-10')!
    expect((await qt.post(`/api/nguon-vao/so-lieu/${t10.id}/xoa`).set(GHI)).status).toBe(200)
    const b = (await (await vao('chutich.a')).get('/api/chi-tieu')).body as BangChiTieu
    expect(b.giaTri['TTHC-01']).toMatchObject({ giaTri: 1300, kenh: 'excel', ky: 'T9/2026' })

    const tep = await tepExcel([['TTHC-01', '10/2026', 1500]])
    expect((await qt.post('/api/nguon-vao/excel').set(GHI).attach('tep', tep, 'bu.xlsx')).status).toBe(200)
    const sau = (await (await vao('chutich.a')).get('/api/chi-tieu')).body as BangChiTieu
    expect(sau.giaTri['TTHC-01']).toMatchObject({ giaTri: 1500, kenh: 'excel', ky: 'T10/2026' })
  })

  it('xóa nguồn: khóa bị xóa hẳn, số đã lấy vẫn giữ', async () => {
    const [n] = (await qt.get('/api/nguon-vao/api')).body as NguonApi[]
    expect((await qt.post(`/api/nguon-vao/api/${n!.id}/xoa`).set(GHI)).body).toEqual([])
    const con = await db.pg.query<{ n: number }>('select count(*)::int as n from nguon_du_lieu_bi_mat')
    expect(con.rows[0]!.n).toBe(0)
    expect(((await qt.get('/api/nguon-vao/so-lieu')).body as SoLieuDaNap[]).length).toBeGreaterThan(0)
    expect((await qt.post(`/api/nguon-vao/api/${n!.id}/lay`).set(GHI)).status).toBe(404)
  })
})

describe('bảng điều hành bệnh viện', () => {
  const url = '/api/chi-tieu/benh-vien'
  const ky = '2026-01'

  it('tách số giả lập khỏi kho và đánh dấu trong từng tệp báo cáo', async () => {
    const khach = request(app.getHttpServer() as Parameters<typeof request>[0])
    expect((await khach.get(url)).status).toBe(401)
    expect((await khach.get('/api/bao-cao/ho-so-bhyt-giao-ban/excel')).status).toBe(401)
    const lanhDao = await vao('chutich.a')
    expect((await lanhDao.get(url).query({ ky: '2026-13' })).status).toBe(400)
    expect((await lanhDao.get(url).query({ nguon: 'sai' })).status).toBe(400)
    const res = await lanhDao.get(url).query({ ky, nguon: 'gia-lap' })
    expect(res.status).toBe(200)
    const bang = res.body as BangDieuHanhBenhVien
    expect(bang.nguon).toBe('gia-lap')
    expect(bang.cacKy.map((k) => k.ky)).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', ky])
    const moPhong = bang.cacKy.at(-1)!.soLieu
    expect(moPhong).toHaveLength(11)
    expect(moPhong.every((n) => n.nguon === 'Giả lập')).toBe(true)
    const daNap = (await lanhDao.get(url).query({ ky, nguon: 'da-nap' })).body as BangDieuHanhBenhVien
    expect(daNap.cacKy.at(-1)?.soLieu).toEqual([])

    for (const [ma, tenTep, chiTieu] of [
      ['bao-cao-benh-vien-so-y-te', 'so-y-te', 'BV-01'],
      ['ho-so-bhyt-giao-ban', 'bhxh', 'BV-08'],
      ['dieu-tri-lao-giao-ban', 'vitimes', 'BV-10'],
    ] as const) {
      const tep = await lanhDao
        .get(`/api/bao-cao/${ma}/excel`)
        .query({ ky, nguon: 'gia-lap' })
        .buffer(true)
        .parse((res, cb) => {
          const phan: Buffer[] = []
          res.on('data', (c: Buffer) => phan.push(c))
          res.on('end', () => cb(null, Buffer.concat(phan)))
        })
      expect(tep.status).toBe(200)
      expect(tep.headers['content-disposition']).toContain(`${tenTep}-${ky}-gia-lap.xlsx`)
      const wb = new ExcelJS.Workbook()
      const buf = tep.body as Buffer
      await wb.xlsx.load(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
      const ws = wb.getWorksheet('Báo cáo')!
      expect(ws.getCell('A2').text).toContain('DỮ LIỆU GIẢ LẬP')
      expect(ws.getCell('D5').value).toBe(moPhong.find((d) => d.ma === chiTieu)!.giaTri)
    }
  })

  it('đọc số nạp đúng kỳ, giữ số không và chỉ tính công suất từ hai giá trị cùng tháng', async () => {
    const qt = await vao('quantri')
    const tep = await tepExcel([
      ['BV-01', '01/2026', 0],
      ['BV-04', '01/2026', 375],
      ['BV-05', '01/2026', 500],
      ['BV-04', '12/2025', 450],
      ['BV-05', '11/2025', 500],
    ])
    expect(
      (await qt.post('/api/nguon-vao/excel').set(GHI).attach('tep', tep, 'benh-vien-thu.xlsx')).status,
    ).toBe(200)
    const a = await vao('chutich.a')
    expect(((await a.get('/api/chi-tieu')).body as BangChiTieu).giaTri['BV-01']).toBeUndefined()
    const res = await a.get(url).query({ ky, nguon: 'da-nap' })
    expect(res.status).toBe(200)
    const { cacKy } = res.body as BangDieuHanhBenhVien
    const hienTai = dongChiTieuBenhVien(cacKy.at(-1)!)
    expect(hienTai.find((d) => d.ma === 'BV-01')).toMatchObject({
      giaTri: 0,
      nguon: 'Excel · benh-vien-thu.xlsx',
      capNhatLuc: expect.any(String) as string,
    })
    expect(hienTai.find((d) => d.ma === MA_CONG_SUAT_GIUONG)?.giaTri).toBe(75)
    expect(dongChiTieuBenhVien(cacKy.at(-2)!).find((d) => d.ma === MA_CONG_SUAT_GIUONG)?.giaTri).toBeNull()
    const tuDong = (await a.get(url).query({ ky })).body as BangDieuHanhBenhVien
    const kyTruoc = dongChiTieuBenhVien(tuDong.cacKy.at(-2)!)
    expect(tuDong.nguon).toBe('tu-dong')
    expect(tuDong.cacKy.at(-1)?.soLieu.find((d) => d.ma === 'BV-01')).toMatchObject({
      giaTri: 0,
      loaiNguon: 'da-nap',
    })
    expect(kyTruoc.find((d) => d.ma === 'BV-04')).toMatchObject({ giaTri: 450, loaiNguon: 'da-nap' })
    expect(kyTruoc.find((d) => d.ma === MA_CONG_SUAT_GIUONG)).toMatchObject({ loaiNguon: 'gia-lap' })
    const giaLap = (await a.get(url).query({ ky, nguon: 'gia-lap' })).body as BangDieuHanhBenhVien
    expect(kyTruoc.find((d) => d.ma === MA_CONG_SUAT_GIUONG)?.giaTri).toBe(
      dongChiTieuBenhVien(giaLap.cacKy.at(-2)!).find((d) => d.ma === MA_CONG_SUAT_GIUONG)?.giaTri,
    )
    const xuat = await a.get('/api/bao-cao/bao-cao-benh-vien-so-y-te').query({ ky })
    expect(xuat.status).toBe(200)
    expect(xuat.body).toMatchObject({
      tenTep: `ban-nhap-so-y-te-${ky}-co-gia-lap`,
      phuDe: expect.stringContaining('CÓ DỮ LIỆU GIẢ LẬP') as string,
    })
    const b = await vao('canbo.b')
    const khacDonVi = await b.get(url).query({ ky, nguon: 'da-nap' })
    expect(khacDonVi.status).toBe(200)
    expect((khacDonVi.body as BangDieuHanhBenhVien).cacKy.every((k) => k.soLieu.length === 0)).toBe(true)
  })
})
