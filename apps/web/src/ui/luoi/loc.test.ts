import { describe, expect, it } from 'vitest'
import { apThuTu, docSo, keoTha, khop, locVaSap, type CotLuoi } from './loc'

interface D {
  ten: string
  tien: number
  ngay: string
  tt: string
}
const COT: CotLuoi<D>[] = [
  { id: 'ten', nhan: 'Tên', kieu: 'chu', giaTri: (d) => d.ten },
  { id: 'tien', nhan: 'Tiền', kieu: 'so', giaTri: (d) => d.tien },
  { id: 'ngay', nhan: 'Ngày', kieu: 'ngay', giaTri: (d) => d.ngay },
  {
    id: 'tt',
    nhan: 'Trạng thái',
    kieu: 'danh-muc',
    giaTri: (d) => d.tt,
    luaChon: [
      { giaTri: 'mo', nhan: 'Đang mở' },
      { giaTri: 'dong', nhan: 'Đã đóng' },
    ],
  },
]
const DL: D[] = [
  { ten: 'Xã An Hòa', tien: 100, ngay: '2026-01-05', tt: 'mo' },
  { ten: 'Xã Bình Minh', tien: 250, ngay: '2026-03-10', tt: 'dong' },
  { ten: 'Phường Hòa Bình', tien: 50, ngay: '2026-06-01', tt: 'mo' },
]

describe('lọc theo cột', () => {
  it('chữ: 6 toán tử, không dấu, không hoa thường', () => {
    expect(khop('Xã An Hòa', { kieu: 'chu', tt: 'chua', gt: 'hoa' })).toBe(true)
    expect(khop('Xã An Hòa', { kieu: 'chu', tt: 'khong-chua', gt: 'hoa' })).toBe(false)
    expect(khop('Xã An Hòa', { kieu: 'chu', tt: 'bat-dau', gt: 'xa' })).toBe(true)
    expect(khop('Xã An Hòa', { kieu: 'chu', tt: 'ket-thuc', gt: 'HÒA' })).toBe(true)
    expect(khop('abc', { kieu: 'chu', tt: 'bang', gt: 'ABC' })).toBe(true)
    expect(khop('abc', { kieu: 'chu', tt: 'khong-bang', gt: 'abc' })).toBe(false)
  })

  it('số: 5 toán tử, đọc được 1.234,5', () => {
    expect(docSo('1.234,5')).toBe(1234.5)
    expect(docSo('1234.5')).toBe(1234.5)
    expect(khop(250, { kieu: 'so', tt: 'lon-hon', gt: '100' })).toBe(true)
    expect(khop(100, { kieu: 'so', tt: 'lon-hon-bang', gt: '100' })).toBe(true)
    expect(khop(null, { kieu: 'so', tt: 'bang', gt: '0' })).toBe(false)
  })

  it('ngày: khoảng từ–đến, tính cả hai đầu; danh mục: chọn nhiều', () => {
    const kq = locVaSap(DL, COT, { ngay: { kieu: 'ngay', tu: '2026-03-10', den: '2026-06-01' } }, '', null)
    expect(kq.map((d) => d.ten)).toEqual(['Xã Bình Minh', 'Phường Hòa Bình'])
    const dm = locVaSap(DL, COT, { tt: { kieu: 'danh-muc', chon: ['dong'] } }, '', null)
    expect(dm.map((d) => d.ten)).toEqual(['Xã Bình Minh'])
  })

  it('tìm tổng quét mọi cột (kể cả nhãn danh mục); sắp tăng/giảm', () => {
    expect(locVaSap(DL, COT, {}, 'da dong', null).map((d) => d.ten)).toEqual(['Xã Bình Minh'])
    expect(locVaSap(DL, COT, {}, '', { id: 'tien', tang: false }).map((d) => d.tien)).toEqual([250, 100, 50])
    expect(locVaSap(DL, COT, {}, '', { id: 'ten', tang: true })[0]!.ten).toBe('Phường Hòa Bình')
  })

  it('lọc nhanh theo cột đã ẩn, còn ô tìm chỉ dùng các cột đang hiện', () => {
    const hien = COT.filter((c) => c.id !== 'tt')
    const loc = { tt: { kieu: 'danh-muc' as const, chon: ['dong'] } }
    expect(locVaSap(DL, hien, loc, 'binh minh', null, COT)).toEqual([DL[1]])
    expect(locVaSap(DL, hien, loc, 'da dong', null, COT)).toEqual([])
  })
})

describe('thứ tự cột', () => {
  it('thiết lập cũ không làm mất cột mới; id bỏ đi thì loại', () => {
    expect(apThuTu(['a', 'b', 'c', 'moi'], ['c', 'a', 'cu'])).toEqual(['c', 'a', 'b', 'moi'])
  })
  it('kéo thả: về trước và ra sau', () => {
    expect(keoTha(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c'])
    expect(keoTha(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
  })
})
