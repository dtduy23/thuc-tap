import { describe, expect, it } from 'vitest'
import { dinhNghiaCho, giaTriOcr, type ChungTuOcr, type DinhNghiaOcr } from './ocr.js'

const ct = (duLieu: ChungTuOcr['duLieu'], bang: ChungTuOcr['bang'] = {}): ChungTuOcr => ({
  id: '1',
  maLoai: 'HOADON',
  tenLoai: 'Hóa đơn',
  tenTep: 'a.pdf',
  trangThai: 'da-xu-ly',
  doTinCay: null,
  duLieu,
  bang,
  taoLuc: null,
  capNhatLuc: null,
  layVeLuc: '2026-10-01T00:00:00.000Z',
})

describe('giaTriOcr', () => {
  it('giữ chữ / số / đúng-sai; rỗng thành null; đối tượng lồng thành chuỗi JSON', () => {
    expect(giaTriOcr('a')).toBe('a')
    expect(giaTriOcr(0)).toBe(0)
    expect(giaTriOcr(false)).toBe(false)
    expect(giaTriOcr('')).toBeNull()
    expect(giaTriOcr(undefined)).toBeNull()
    expect(giaTriOcr({ a: [1] })).toBe('{"a":[1]}')
  })
})

describe('dinhNghiaCho', () => {
  const dn: DinhNghiaOcr = {
    truong: [{ khoa: 'so', nhan: 'Số hóa đơn', kieu: 'chu', batBuoc: true }],
    bang: [
      { khoa: 'hang', ten: 'Dòng hàng', cot: [{ khoa: 'ten', nhan: 'Tên', kieu: 'chu', batBuoc: false }] },
    ],
  }

  it('giữ định nghĩa của loại; trường, bảng, cột chỉ có trong dữ liệu thì nối vào cuối', () => {
    const kq = dinhNghiaCho(dn, [
      ct({ so: 'HD-1', tien: 100 }, { hang: [{ ten: 'Giấy', sl: 2 }], phu: [{ x: 'y' }] }),
      ct({ so: 'HD-2', ghiChu: 'gấp' }),
    ])
    expect(kq.truong.map((t) => [t.khoa, t.nhan, t.kieu])).toEqual([
      ['so', 'Số hóa đơn', 'chu'],
      ['tien', 'tien', 'so'],
      ['ghiChu', 'ghiChu', 'chu'],
    ])
    expect(kq.bang.map((b) => [b.khoa, b.cot.map((c) => c.khoa)])).toEqual([
      ['hang', ['ten', 'sl']],
      ['phu', ['x']],
    ])
    // Không sửa vào định nghĩa gốc.
    expect(dn.truong).toHaveLength(1)
    expect(dn.bang[0]!.cot).toHaveLength(1)
  })

  it('chưa có định nghĩa (loại chưa chụp) vẫn dựng được từ dữ liệu', () => {
    expect(dinhNghiaCho(undefined, [ct({ a: 'x' })]).truong.map((t) => t.khoa)).toEqual(['a'])
    expect(dinhNghiaCho(undefined, [])).toEqual({ truong: [], bang: [] })
  })
})
