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

  const DB = 'postgres://u:p@h/d'

  it('production thiếu AUTH_SECRET thì DỪNG', () => {
    expect(() => docCauHinh({ NODE_ENV: 'production', DATABASE_URL: DB })).toThrow(/AUTH_SECRET/)
  })

  it('từ chối AUTH_SECRET quá ngắn, kể cả ở máy dev', () => {
    expect(() => docCauHinh({ AUTH_SECRET: 'ngan-qua' })).toThrow(/ít nhất 32/)
  })

  it('máy dev thiếu AUTH_SECRET thì sinh khóa ngẫu nhiên, mỗi lần một khác', () => {
    expect(docCauHinh({}).khoaKyVe).not.toBe(docCauHinh({}).khoaKyVe)
  })

  it('cookie chỉ bắt buộc HTTPS ở production', () => {
    expect(docCauHinh({}).cookieAnToan).toBe(false)
    const ch = docCauHinh({
      NODE_ENV: 'production',
      DATABASE_URL: DB,
      AUTH_SECRET: 'k'.repeat(40),
      KHO_TEP_THU_MUC: '/srv/tep',
    })
    expect(ch.cookieAnToan).toBe(true)
  })

  it('database nhúng: bật được ở máy dev', () => {
    expect(docCauHinh({ DB_NHUNG: '1' }).dbNhung).toMatch(/pglite$/)
  })

  it('database nhúng: CẤM ở production', () => {
    expect(() =>
      docCauHinh({ NODE_ENV: 'production', DATABASE_URL: DB, AUTH_SECRET: 'k'.repeat(40), DB_NHUNG: '1' }),
    ).toThrow(/DB_NHUNG/)
  })

  it('database nhúng: không đặt cùng DATABASE_URL — tránh tưởng đang ghi vào Postgres thật', () => {
    expect(() => docCauHinh({ DB_NHUNG: '1', DATABASE_URL: DB })).toThrow(/không đặt cả hai/)
  })
})

describe('kho tệp', () => {
  it('production thiếu KHO_TEP_THU_MUC thì DỪNG — không tự chọn chỗ lưu tệp', () => {
    expect(() =>
      docCauHinh({ NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@h/d', AUTH_SECRET: 'k'.repeat(40) }),
    ).toThrow(/KHO_TEP_THU_MUC/)
  })
})
