import type { NhatKyDong } from '@gdos/shared'
import { describe, expect, it } from 'vitest'
import { doiTuongCua, nguoiLamCua, thayDoiCua } from './nhat-ky'

const dong = (them: Partial<NhatKyDong>): NhatKyDong => ({
  id: 1,
  luc: '2026-09-30T01:00:00Z',
  taiKhoanId: null,
  nguoiLam: null,
  donViTen: 'Xã Mẫu',
  hanhDong: 'UPDATE',
  bang: 'tai_khoan',
  banGhiId: 'x',
  giaTriCu: null,
  giaTriMoi: null,
  ...them,
})

describe('đọc nhật ký', () => {
  it('sửa: chỉ liệt kê trường đổi, bỏ cột kỹ thuật, dịch giá trị', () => {
    const d = dong({
      giaTriCu: { id: 'x', ho_ten: 'A', trang_thai: 'hoat-dong', updated_at: '2026-09-30T01:00:00+00:00' },
      giaTriMoi: { id: 'x', ho_ten: 'A', trang_thai: 'khoa', updated_at: '2026-09-30T02:00:00+00:00' },
    })
    expect(thayDoiCua(d)).toEqual([{ truong: 'Trạng thái', cu: 'Hoạt động', moi: 'Đã khóa' }])
    expect(doiTuongCua(d)).toBe('A')
  })

  it('thêm mới: bỏ trường rỗng; vai và phạm vi ra tên dễ đọc', () => {
    const d = dong({
      hanhDong: 'INSERT',
      bang: 'phan_cong',
      giaTriMoi: { vai: 'LANH_DAO', pham_vi: ['nhat-ky'], deleted_at: null },
    })
    expect(thayDoiCua(d)).toEqual([
      { truong: 'Vai', cu: '—', moi: 'Lãnh đạo' },
      { truong: 'Phạm vi', cu: '—', moi: 'Nhật ký thao tác' },
    ])
    expect(doiTuongCua(d)).toBe('Vai Lãnh đạo')
  })

  it('đổi mật khẩu thì ghi rõ, không bao giờ có giá trị mật khẩu', () => {
    const d = dong({ hanhDong: 'DOI_MAT_KHAU', giaTriCu: { ho_ten: 'A' }, giaTriMoi: { ho_ten: 'A' } })
    expect(thayDoiCua(d)[0]).toEqual({ truong: 'Mật khẩu', cu: '••••', moi: 'đã đổi' })
  })

  it('người làm: tên; ngoài phạm vi; hệ thống', () => {
    expect(nguoiLamCua(dong({ taiKhoanId: 'a', nguoiLam: 'B' }))).toBe('B')
    expect(nguoiLamCua(dong({ taiKhoanId: 'a' }))).toBe('Tài khoản ngoài phạm vi')
    expect(nguoiLamCua(dong({}))).toBe('Hệ thống')
  })
})
