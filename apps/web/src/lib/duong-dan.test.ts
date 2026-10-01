import { describe, expect, it } from 'vitest'
import { duongDanNoiBo } from './duong-dan'

describe('duongDanNoiBo', () => {
  it('nhận đường dẫn nội bộ', () => {
    expect(duongDanNoiBo('/tk-ds')).toBe('/tk-ds')
    expect(duongDanNoiBo('/tk-ds?x=1')).toBe('/tk-ds?x=1')
  })

  it('từ chối URL ra ngoài — chống chuyển hướng lừa đảo', () => {
    for (const x of ['https://trang-gia.vn', '//trang-gia.vn', '/\\trang-gia.vn', 'javascript:alert(1)'])
      expect(duongDanNoiBo(x)).toBeUndefined()
  })

  it('không quay về chính màn đăng nhập', () => {
    expect(duongDanNoiBo('/dang-nhap')).toBeUndefined()
  })

  it('không phải chuỗi thì bỏ', () => {
    expect(duongDanNoiBo(undefined)).toBeUndefined()
    expect(duongDanNoiBo(['/a'])).toBeUndefined()
  })
})
