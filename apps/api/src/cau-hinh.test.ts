import { describe, expect, it } from 'vitest'
import { docCauHinh } from './cau-hinh.js'

describe('docCauHinh', () => {
  it('máy dev chưa có DATABASE_URL vẫn khởi động được', () => {
    const ch = docCauHinh({ NODE_ENV: 'development' })
    expect(ch.duongDanDb).toBeUndefined()
    expect(ch.cong).toBe(4100)
  })

  it('production thiếu DATABASE_URL thì DỪNG, không chạy với giá trị dự phòng', () => {
    expect(() => docCauHinh({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/)
  })

  it('DATABASE_URL toàn khoảng trắng coi như chưa đặt', () => {
    expect(() => docCauHinh({ NODE_ENV: 'production', DATABASE_URL: '   ' })).toThrow(/DATABASE_URL/)
  })

  it('từ chối NODE_ENV lạ thay vì đoán', () => {
    expect(() => docCauHinh({ NODE_ENV: 'prod' })).toThrow(/NODE_ENV/)
  })

  it('từ chối cổng không hợp lệ', () => {
    expect(() => docCauHinh({ API_PORT: 'abc' })).toThrow(/API_PORT/)
    expect(() => docCauHinh({ API_PORT: '70000' })).toThrow(/API_PORT/)
  })

  it('bỏ qua biến PORT chung — công cụ bên ngoài đặt nó cho cả nhóm tiến trình', () => {
    expect(docCauHinh({ PORT: '5174' }).cong).toBe(4100)
  })
})
