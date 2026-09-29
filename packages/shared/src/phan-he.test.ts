import { describe, expect, it } from 'vitest'
import { NHOM, TANG, kiemTraCay, locTheoQuyen, quyenCua, type ModuleDef } from './phan-he.js'

const mau = (ghiDe: Partial<ModuleDef> = {}): ModuleDef => ({
  id: 'du-an',
  nhan: 'Dự án',
  nhom: 'tac-nghiep',
  maQuyen: 'PROJECT',
  nguon: 'db',
  mo: 'Danh mục dự án.',
  con: [
    { id: 'da-tat-ca', nhan: 'Tất cả dự án' },
    { id: 'da-tao', nhan: 'Tạo dự án mới', hanhDong: 'CREATE' },
  ],
  ...ghiDe,
})

describe('khung cố định', () => {
  it('có đúng hai tầng', () => {
    expect(TANG.map((t) => t.so)).toEqual([1, 2])
  })

  it('Tầng 2 có đúng ba nhóm — "một cửa, đúng ba nhóm"', () => {
    expect(NHOM.filter((n) => n.tang === 2)).toHaveLength(3)
  })

  it('không có nhóm "ngăn kéo" kiểu mở rộng / khác / tiện ích', () => {
    const cam = /mo-rong|khac|tien-ich|nang-cao/
    expect(NHOM.filter((n) => cam.test(n.ma))).toEqual([])
  })
})

describe('quyenCua', () => {
  it('ghép mã phân hệ với hành động, mặc định READ', () => {
    const m = mau()
    expect(quyenCua(m, m.con[0]!)).toBe('PROJECT.READ')
    expect(quyenCua(m, m.con[1]!)).toBe('PROJECT.CREATE')
  })
})

describe('kiemTraCay', () => {
  it('cây hợp lệ không có lỗi', () => {
    expect(kiemTraCay([mau()])).toEqual([])
  })

  it('bắt mã trùng giữa module và chức năng', () => {
    const loi = kiemTraCay([mau({ con: [{ id: 'du-an', nhan: 'Trùng mã cha' }] })])
    expect(loi.some((l) => l.includes('bị trùng'))).toBe(true)
  })

  it('bắt module cấp 3 không có chức năng cấp 4 nào', () => {
    expect(kiemTraCay([mau({ con: [] })])).toContain('module du-an: phải có ít nhất một chức năng cấp 4')
  })

  it('bắt mã có dấu hoặc viết hoa', () => {
    expect(kiemTraCay([mau({ id: 'Dự-Án' })]).length).toBeGreaterThan(0)
  })

  it('bắt mã quyền sai dạng', () => {
    expect(kiemTraCay([mau({ maQuyen: 'project' })]).length).toBeGreaterThan(0)
    expect(kiemTraCay([mau({ maQuyen: 'PROJECT.READ' })]).length).toBeGreaterThan(0)
  })

  it('module Tầng 2 bắt buộc mã quyền QT_', () => {
    const loi = kiemTraCay([
      mau({
        id: 'qt-tai-khoan',
        nhom: 'qt-nguoi-dung',
        maQuyen: 'USER',
        con: [{ id: 'tk-ds', nhan: 'Danh sách' }],
      }),
    ])
    expect(loi).toContain('module qt-tai-khoan: nằm ở Tầng 2 thì mã quyền phải bắt đầu QT_')
  })

  it('màn nghiệp vụ không được nấp sau mã quyền QT_', () => {
    const loi = kiemTraCay([mau({ maQuyen: 'QT_DU_AN' })])
    expect(loi).toContain('module du-an: nằm ở Tầng 1 thì không được dùng mã quyền QT_')
  })
})

describe('locTheoQuyen', () => {
  const cay = [
    mau(),
    mau({
      id: 'qt-tai-khoan',
      nhan: 'Tài khoản',
      nhom: 'qt-nguoi-dung',
      maQuyen: 'QT_NGUOI_DUNG',
      con: [{ id: 'tk-ds', nhan: 'Danh sách tài khoản' }],
    }),
  ]

  it('thiếu hành động ở cấp 4 chỉ ẩn đúng chức năng đó, anh em vẫn còn', () => {
    const ket = locTheoQuyen(cay, new Set(['PROJECT.READ']))
    expect(ket[0]!.nhom[0]!.modules[0]!.con.map((c) => c.id)).toEqual(['da-tat-ca'])
  })

  it('không có cờ quản trị thì mất cả tiêu đề Tầng 2', () => {
    const ket = locTheoQuyen(cay, new Set(['PROJECT.READ', 'PROJECT.CREATE']))
    expect(ket.map((t) => t.so)).toEqual([1])
  })

  it('không có quyền nào thì cây rỗng, không có nhóm rỗng nào sót lại', () => {
    expect(locTheoQuyen(cay, new Set())).toEqual([])
  })

  it('có quyền Tầng 2 thì thấy đủ hai tầng', () => {
    const ket = locTheoQuyen(cay, new Set(['PROJECT.READ', 'QT_NGUOI_DUNG.READ']))
    expect(ket.map((t) => t.so)).toEqual([1, 2])
  })
})
