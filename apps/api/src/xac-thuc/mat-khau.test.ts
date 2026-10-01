import { describe, expect, it } from 'vitest'
import { bamMatKhau, kiemMatKhau, kiemTraMatKhauMoi, layBamGia } from './mat-khau.js'

describe('bamMatKhau / kiemMatKhau', () => {
  it('băm rồi kiểm lại đúng', async () => {
    const h = await bamMatKhau('mot-mat-khau-dai')
    expect(h).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/)
    expect(await kiemMatKhau('mot-mat-khau-dai', h)).toBe(true)
  })

  it('sai mật khẩu thì false', async () => {
    const h = await bamMatKhau('mot-mat-khau-dai')
    expect(await kiemMatKhau('mot-mat-khau-khac', h)).toBe(false)
  })

  it('cùng mật khẩu, hai lần băm cho hai chuỗi khác nhau (muối ngẫu nhiên)', async () => {
    expect(await bamMatKhau('trung-nhau-123')).not.toBe(await bamMatKhau('trung-nhau-123'))
  })

  it('chuỗi băm hỏng hoặc bị sửa thì false, không ném lỗi', async () => {
    const h = await bamMatKhau('mot-mat-khau-dai')
    expect(await kiemMatKhau('mot-mat-khau-dai', 'khong-phai-phc')).toBe(false)
    expect(await kiemMatKhau('mot-mat-khau-dai', h.slice(0, -4) + 'AAAA')).toBe(false)
  })

  it('bản băm giả hợp lệ để kiểm, và không khớp mật khẩu nào đoán được', async () => {
    expect(await kiemMatKhau('', await layBamGia())).toBe(false)
  })
})

describe('kiemTraMatKhauMoi', () => {
  it('đòi độ dài tối thiểu — mặc định 8, quản trị đặt khác được', () => {
    expect(kiemTraMatKhauMoi('ngan', 'canbo')).toMatch(/ít nhất 8/)
    expect(kiemTraMatKhauMoi('du-dai-roi-day', 'canbo', 20)).toMatch(/ít nhất 20/)
    expect(kiemTraMatKhauMoi('du-dai-roi-day', 'canbo')).toBeNull()
  })

  it('không cho chứa tên đăng nhập', () => {
    expect(kiemTraMatKhauMoi('CanBo.An-2026', 'canbo.an')).toMatch(/tên đăng nhập/)
  })
})
