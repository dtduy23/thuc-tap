import { describe, expect, it } from 'vitest'
import { kiemNguong, kiemTrangDau, trangDauCua, type TrangDau } from './cau-hinh.js'

const TD: TrangDau = { LANH_DAO: 'ct-tong-quan', CHUYEN_VIEN: 'da-cua-toi', THANH_TRA: '', QUAN_TRI: 'tk-ds' }
const moDuoc = () => true

describe('trang mặc định theo vai', () => {
  it('nhiều vai: lãnh đạo trước chuyên viên; quản trị chỉ dùng khi không có vai nghiệp vụ nào đặt trang', () => {
    expect(trangDauCua(TD, ['CHUYEN_VIEN', 'LANH_DAO'], false, moDuoc)).toBe('ct-tong-quan')
    expect(trangDauCua(TD, ['CHUYEN_VIEN'], true, moDuoc)).toBe('da-cua-toi')
    expect(trangDauCua(TD, ['THANH_TRA'], true, moDuoc)).toBe('tk-ds')
    expect(trangDauCua(TD, [], true, moDuoc)).toBe('tk-ds')
    expect(trangDauCua(TD, ['THANH_TRA'], false, moDuoc)).toBe('')
  })

  it('không có quyền mở trang đã đặt → thử vai kế tiếp, hết thì về trang chủ', () => {
    expect(trangDauCua(TD, ['LANH_DAO', 'CHUYEN_VIEN'], false, (id) => id !== 'ct-tong-quan')).toBe(
      'da-cua-toi',
    )
    expect(trangDauCua(TD, ['LANH_DAO'], false, () => false)).toBe('')
  })

  it('kiểm: chỉ nhận mã chức năng có trong cây, đủ bốn nhóm, không nhóm lạ', () => {
    const hopLe = new Set(['ct-tong-quan', 'da-cua-toi', 'tk-ds'])
    expect(kiemTrangDau(TD, hopLe)).toEqual([])
    expect(kiemTrangDau({ ...TD, LANH_DAO: 'la' }, hopLe)).toHaveLength(1)
    expect(kiemTrangDau({ LANH_DAO: '' }, hopLe).length).toBeGreaterThan(0)
    expect(kiemTrangDau({ ...TD, KHAC: '' }, hopLe)).toHaveLength(1)
  })
})

describe('ngưỡng cảnh báo', () => {
  it('số nguyên trong khoảng cho phép', () => {
    expect(kiemNguong({ sapHanNgay: 10, lauCapNhatNgay: 15 })).toEqual([])
    expect(kiemNguong({ sapHanNgay: 61, lauCapNhatNgay: 15 })).toHaveLength(1)
    expect(kiemNguong({ sapHanNgay: 1.5, lauCapNhatNgay: 2 })).toHaveLength(2)
  })
})
