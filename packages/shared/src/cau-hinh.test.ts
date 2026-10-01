import { describe, expect, it } from 'vitest'
import { CHINH_SACH_MAC_DINH, kiemChinhSach, kiemNhanDien, NHAN_DIEN_MAC_DINH } from './cau-hinh.js'

describe('cấu hình hệ thống', () => {
  it('bộ mặc định hợp lệ theo chính luật của nó', () => {
    expect(kiemChinhSach(CHINH_SACH_MAC_DINH)).toEqual([])
    expect(kiemNhanDien(NHAN_DIEN_MAC_DINH)).toEqual([])
  })

  it('từ chối số ngoài khoảng, số lẻ, thiếu tham số, tham số lạ', () => {
    expect(kiemChinhSach({ ...CHINH_SACH_MAC_DINH, soLanSaiToiDa: 1 })).toHaveLength(1)
    expect(kiemChinhSach({ ...CHINH_SACH_MAC_DINH, veHanPhut: 12.5 })).toHaveLength(1)
    const { matKhauToiThieu: _bo, ...thieu } = CHINH_SACH_MAC_DINH
    expect(kiemChinhSach(thieu)).toHaveLength(1)
    expect(kiemChinhSach({ ...CHINH_SACH_MAC_DINH, la: 1 })).toHaveLength(1)
  })

  it('tên hệ thống không được trống; chữ quá dài bị chặn', () => {
    expect(kiemNhanDien({ ...NHAN_DIEN_MAC_DINH, tenHeThong: '  ' })).toHaveLength(1)
    expect(kiemNhanDien({ ...NHAN_DIEN_MAC_DINH, moTa: 'x'.repeat(201) })).toHaveLength(1)
  })
})
