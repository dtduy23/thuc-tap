import { describe, expect, it } from 'vitest'
import { DANH_SACH_MODULE } from './dang-ky.js'
import { kiemTraCay, locTheoQuyen } from './phan-he.js'
import { tinhQuyen } from './vai-tro.js'

describe('registry GDOS', () => {
  it('hợp lệ theo mọi luật của cây phân hệ', () => {
    expect(kiemTraCay(DANH_SACH_MODULE)).toEqual([])
  })

  it('cờ quản trị đứng một mình thấy Tầng 2 nhưng không thấy nhật ký nghiệp vụ', () => {
    const cay = locTheoQuyen(DANH_SACH_MODULE, tinhQuyen(DANH_SACH_MODULE, [], true))
    expect(cay.map((t) => t.so)).toEqual([2])
  })

  it('Chủ tịch xã thấy nhật ký thao tác, không thấy Tầng 2', () => {
    const cay = locTheoQuyen(
      DANH_SACH_MODULE,
      tinhQuyen(DANH_SACH_MODULE, [{ vai: 'LANH_DAO', phamVi: 'tat-ca' }], false),
    )
    expect(cay.map((t) => t.so)).toEqual([1])
    expect(cay[0]!.nhom.map((n) => n.ma)).toEqual(['giam-sat'])
  })
})
