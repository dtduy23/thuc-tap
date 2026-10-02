import { describe, expect, it } from 'vitest'
import {
  THE_THUC_RONG,
  chuanHoaKhoa,
  ghepKhung,
  giaTriHienThi,
  htmlPhanDau,
  htmlPhanKy,
  khoaDuyNhat,
  khoaMoCoi,
} from './the-thuc-nd30'

describe('mã trường', () => {
  it('nhãn tiếng Việt → snake_case không dấu, bắt đầu bằng chữ', () => {
    expect(chuanHoaKhoa('Họ và tên')).toBe('ho_va_ten')
    expect(chuanHoaKhoa('Số ngày nghỉ (dự kiến)')).toBe('so_ngay_nghi_du_kien')
    expect(chuanHoaKhoa('Đơn vị')).toBe('don_vi')
    expect(chuanHoaKhoa('2 bên')).toBe('f_2_ben')
    expect(chuanHoaKhoa('  ')).toBe('truong')
  })

  it('không trùng mã đã có', () => {
    expect(khoaDuyNhat('Kính gửi', ['kinh_gui'])).toBe('kinh_gui_2')
    expect(khoaDuyNhat('Kính gửi', ['kinh_gui', 'kinh_gui_2'])).toBe('kinh_gui_3')
  })

  it('chỗ chèn mồ côi — {{key}} không còn trường khai báo', () => {
    const truong = [{ key: 'ho_ten', label: 'Họ tên' }]
    expect(khoaMoCoi('<p>{{ho_ten}} {{ ngay }} {{ngay}}</p>', truong)).toEqual(['ngay'])
  })
})

describe('thể thức NĐ30', () => {
  const tho = {
    ...THE_THUC_RONG,
    cq: 'Sở <b>Khoa học</b>',
    so: '12',
    kyhieu: 'SKHCN',
    cv: 'giám đốc',
    ky: 'A',
  }

  it('thoát HTML mọi giá trị người dùng nhập, viết hoa cơ quan và chức vụ', () => {
    const dau = htmlPhanDau('Công văn', 'CV', tho)
    expect(dau).toContain('SỞ &lt;B&gt;KHOA HỌC&lt;/B&gt;')
    expect(dau).not.toContain('<b>Khoa')
    expect(dau).toContain('Số: 12/CV-SKHCN')
    expect(htmlPhanKy(tho)).toContain('GIÁM ĐỐC')
  })

  it('không khai cơ quan → để trần thân, không ghép khung', () => {
    expect(ghepKhung('<p>x</p>', THE_THUC_RONG, 'Mẫu', 'M')).toBe('<p>x</p>')
    expect(ghepKhung('<p>x</p>', tho, 'Mẫu', 'M')).toContain('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')
  })

  it('trường ngày: ISO → dd/mm/yyyy (khớp Native)', () => {
    const truong = [
      { key: 'ngay', label: 'Ngày', type: 'DATE' as const },
      { key: 'so', label: 'Số' },
    ]
    expect(giaTriHienThi({ ngay: '2026-09-30', so: '2026-09-30' }, truong)).toEqual({
      ngay: '30/09/2026',
      so: '2026-09-30',
    })
  })
})
