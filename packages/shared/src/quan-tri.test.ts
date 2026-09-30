import { describe, expect, it } from 'vitest'
import { kiemTenDangNhap } from './quan-tri.js'

describe('tên đăng nhập', () => {
  it('nhận chữ không dấu, số, chấm, gạch', () => {
    for (const t of ['abc', 'nguyen.van-a', 'cb_01', 'X9Z']) expect(kiemTenDangNhap(t)).toBeNull()
  })

  it('từ chối: có dấu, khoảng trắng, quá ngắn, quá dài, bắt đầu bằng dấu', () => {
    for (const t of ['hòa', 'a b', 'ab', 'a'.repeat(51), '.abc', '-abc', 'a@b'])
      expect(kiemTenDangNhap(t)).not.toBeNull()
  })
})
