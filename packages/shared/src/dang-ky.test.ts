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

  it('Chủ tịch xã thấy đủ bốn nhóm nghiệp vụ, không thấy Tầng 2', () => {
    const cay = locTheoQuyen(
      DANH_SACH_MODULE,
      tinhQuyen(DANH_SACH_MODULE, [{ vai: 'LANH_DAO', phamVi: 'tat-ca' }], false),
    )
    expect(cay.map((t) => t.so)).toEqual([1])
    expect(cay[0]!.nhom.map((n) => n.ma)).toEqual(['dieu-hanh', 'tac-nghiep', 'danh-muc', 'giam-sat'])
  })

  it('Chuyên viên không thấy Giám sát & Lưu vết, kể cả khi phân công mọi phân hệ', () => {
    const cay = locTheoQuyen(
      DANH_SACH_MODULE,
      tinhQuyen(DANH_SACH_MODULE, [{ vai: 'CHUYEN_VIEN', phamVi: 'tat-ca' }], false),
    )
    expect(cay[0]!.nhom.map((n) => n.ma)).not.toContain('giam-sat')
  })

  it('Tầng 1 dùng đủ bốn nhóm, Tầng 2 đủ ba nhóm — khung nhìn vào là thấy trọn', () => {
    const nhom = new Set(DANH_SACH_MODULE.map((m) => m.nhom))
    expect(nhom.size).toBe(7)
  })
})
