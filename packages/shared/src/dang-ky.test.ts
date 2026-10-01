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

describe('đóng góp theo ADR-0007', () => {
  it('chỉ module nghiệp vụ có đóng góp; mã không trùng, mang tiền tố của module chủ', async () => {
    const { kiemTraDongGop } = await import('./dong-gop.js')
    expect(kiemTraDongGop(DANH_SACH_MODULE)).toEqual([])
  })

  it('không module nào ở nhóm xuyên suốt mang tên một nghiệp vụ (luật 3)', () => {
    const tenNghiepVu = DANH_SACH_MODULE.filter((m) => m.nhom === 'tac-nghiep').map((m) =>
      m.nhan.toLowerCase(),
    )
    const xuyenSuot = DANH_SACH_MODULE.filter((m) => m.nhom === 'dieu-hanh' || m.nhom === 'giam-sat')
    for (const m of xuyenSuot) for (const t of tenNghiepVu) expect(m.nhan.toLowerCase()).not.toContain(t)
  })

  it('người chỉ có quyền Dự án thấy đóng góp của Dự án; không quyền thì không thấy', async () => {
    const { dongGopCua } = await import('./dong-gop.js')
    const coQuyen = dongGopCua(DANH_SACH_MODULE, 'baoCao', new Set(['DU_AN.READ']))
    expect(coQuyen.map((d) => d.muc.id)).toContain('du-an-bieu-01')
    expect(coQuyen.map((d) => d.muc.id)).not.toContain('du-an-danh-sach') // cần EXPORT
    expect(dongGopCua(DANH_SACH_MODULE, 'baoCao', new Set())).toEqual([])
  })
})
