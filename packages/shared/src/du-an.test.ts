import { describe, expect, it } from 'vitest'
import {
  congNgay,
  homNay,
  kiemMaDuAn,
  soNgayGiua,
  thongKeTienDo,
  tinhHan,
  trangThaiBuoc,
  type GiaiDoan,
} from './du-an.js'

const b = (them: Partial<Parameters<typeof trangThaiBuoc>[0]> = {}) => ({
  laNhom: false,
  laNhap: false,
  boQua: false,
  choXacNhan: null,
  ngayHoanThanh: null,
  han: '2026-10-20',
  ...them,
})

describe('ngày', () => {
  it('cộng ngày qua tháng, qua năm; đếm ngày giữa hai mốc', () => {
    expect(congNgay('2026-09-28', 5)).toBe('2026-10-03')
    expect(congNgay('2026-12-30', 3)).toBe('2027-01-02')
    expect(soNgayGiua('2026-09-30', '2026-10-10')).toBe(10)
    expect(soNgayGiua('2026-10-10', '2026-09-30')).toBe(-10)
  })

  it('hôm nay theo giờ Việt Nam: 17h UTC đã là ngày hôm sau', () => {
    expect(homNay(Date.parse('2026-09-30T17:30:00Z'))).toBe('2026-10-01')
    expect(homNay(Date.parse('2026-09-30T16:30:00Z'))).toBe('2026-09-30')
  })
})

describe('tính hạn — chuỗi như PMS', () => {
  it('hạn = hạn bước trước + số ngày; ghi đè thì lấy ghi đè và các bước sau nối tiếp từ đó', () => {
    const han = tinhHan(
      [
        { soNgay: 5, hanGhiDe: null, laNhap: false },
        { soNgay: 3, hanGhiDe: '2026-10-20', laNhap: false },
        { soNgay: 2, hanGhiDe: null, laNhap: false },
      ],
      '2026-10-01',
    )
    expect(han).toEqual(['2026-10-06', '2026-10-20', '2026-10-22'])
  })

  it('bước nháp không có hạn và không đẩy bước sau', () => {
    const han = tinhHan(
      [
        { soNgay: 5, hanGhiDe: null, laNhap: false },
        { soNgay: 30, hanGhiDe: null, laNhap: true },
        { soNgay: 2, hanGhiDe: null, laNhap: false },
      ],
      '2026-10-01',
    )
    expect(han).toEqual(['2026-10-06', null, '2026-10-08'])
  })
})

describe('trạng thái bước', () => {
  const hn = '2026-10-10'
  it('thứ tự ưu tiên: bỏ qua → chờ xác nhận → xong → quá hạn → sắp hạn → trong hạn', () => {
    expect(trangThaiBuoc(b({ boQua: true, ngayHoanThanh: hn }), hn)).toBe('bo-qua')
    expect(trangThaiBuoc(b({ choXacNhan: { ngay: hn } }), hn)).toBe('cho-xac-nhan')
    expect(trangThaiBuoc(b({ ngayHoanThanh: hn, han: '2026-01-01' }), hn)).toBe('xong')
    expect(trangThaiBuoc(b({ han: '2026-10-09' }), hn)).toBe('qua-han')
    expect(trangThaiBuoc(b({ han: '2026-10-20' }), hn)).toBe('sap-han')
    expect(trangThaiBuoc(b({ han: '2026-10-21' }), hn)).toBe('trong-han')
  })
})

describe('thống kê tiến độ', () => {
  const buoc = (gd: GiaiDoan, stt: string, them: Partial<ReturnType<typeof b>> = {}) => ({
    ...b(them),
    giaiDoan: gd,
    stt,
    ten: `Bước ${stt}`,
  })

  it('bỏ nhóm, nháp, bước bỏ qua; sức khỏe theo bước xấu nhất; chỉ ra bước đang tắc', () => {
    const tk = thongKeTienDo(
      [
        buoc('I', '1', { laNhom: true }),
        buoc('I', '1.1', { ngayHoanThanh: '2026-10-01' }),
        buoc('I', '1.2', { han: '2026-10-05' }),
        buoc('II', '2.1', { boQua: true }),
        buoc('II', '2.2', { laNhap: true }),
        buoc('II', '2.3', { han: '2026-12-01' }),
      ],
      '2026-10-10',
    )
    expect(tk).toMatchObject({ tong: 3, xong: 1, quaHan: 1, trongHan: 1, phanTram: 33 })
    expect(tk.sucKhoe).toBe('qua-han')
    expect(tk.treNhat).toBe(5)
    expect(tk.giaiDoan).toBe('I')
    expect(tk.buocHienTai).toEqual({ stt: '1.2', ten: 'Bước 1.2' })
  })

  it('xong hết → sức khỏe "xong", không còn bước đang tắc', () => {
    const tk = thongKeTienDo([buoc('III', '9', { ngayHoanThanh: '2026-10-01' })], '2026-10-10')
    expect(tk).toMatchObject({ sucKhoe: 'xong', phanTram: 100, giaiDoan: null, buocHienTai: null })
  })
})

describe('mã dự án', () => {
  it('nhận chữ, số, - _ . /; từ chối dấu, khoảng trắng, quá dài', () => {
    expect(kiemMaDuAn('DA-2026/001')).toBeNull()
    expect(kiemMaDuAn('DA 001')).not.toBeNull()
    expect(kiemMaDuAn('DỰ-ÁN')).not.toBeNull()
    expect(kiemMaDuAn('x'.repeat(41))).not.toBeNull()
  })
})

describe('khoảng bước & ngày kết thúc', () => {
  it('bước bắt đầu khi bước trước đến hạn; nháp không có khoảng', async () => {
    const { khoangBuoc, ngayKetThucDuKien } = await import('./du-an.js')
    const k = khoangBuoc(
      [
        { soNgay: 5, hanGhiDe: null, laNhap: false },
        { soNgay: 9, hanGhiDe: null, laNhap: true },
        { soNgay: 3, hanGhiDe: null, laNhap: false },
      ],
      '2026-10-01',
    )
    expect(k).toEqual([
      { tu: '2026-10-01', den: '2026-10-06' },
      null,
      { tu: '2026-10-06', den: '2026-10-09' },
    ])
    expect(
      ngayKetThucDuKien([
        { han: '2026-10-06', laNhap: false },
        { han: '2027-01-01', laNhap: true },
        { han: '2026-10-09', laNhap: false },
      ]),
    ).toBe('2026-10-09')
  })
})

describe('tài chính dự án', () => {
  it('giải ngân = tổng các đợt; % theo tổng mức và theo kế hoạch vốn tới năm nay', async () => {
    const { tinhTaiChinh } = await import('./du-an.js')
    const tc = tinhTaiChinh(
      1000,
      [
        { nam: 2026, keHoach: 400 },
        { nam: 2027, keHoach: 600 },
      ],
      [{ soTien: 150 }, { soTien: 50 }],
      2026,
    )
    expect(tc).toEqual({
      keHoach: 1000,
      keHoachDenNay: 400,
      daGiaiNgan: 200,
      phanTramTongMuc: 20,
      phanTramKeHoach: 50,
    })
    expect(tinhTaiChinh(0, [], [], 2026).phanTramTongMuc).toBe(0)
  })
})
