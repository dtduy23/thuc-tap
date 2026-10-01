import { describe, expect, it } from 'vitest'
import { ngay, ngayGio } from './ngay'

describe('ngày kiểu Việt Nam', () => {
  it('ngày/tháng/năm, theo giờ Việt Nam dù máy ở múi giờ nào', () => {
    expect(ngayGio('2026-09-30T17:05:09Z')).toBe('01/10/2026 00:05:09')
    expect(ngay('2026-01-02T03:00:00Z')).toBe('02/01/2026')
  })
})
