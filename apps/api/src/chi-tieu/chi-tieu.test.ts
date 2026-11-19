import { BO_CHI_TIEU, chamChiTieu, timChiTieu } from '@gdos/shared'
import { describe, expect, it } from 'vitest'
import { ghepBangChiTieu } from './chi-tieu.service.js'
import { SO_LIEU_MINH_HOA, chuoiMinhHoa } from './so-lieu-minh-hoa.js'

const TRONG = { nhiemVu: null, duAn: null, vanBan: null }

describe('bảng chỉ tiêu điều hành', () => {
  it('mọi chỉ tiêu trong danh mục đều có giá trị trả về; mã không trùng', () => {
    const b = ghepBangChiTieu(TRONG)
    expect(new Set(BO_CHI_TIEU.map((c) => c.ma)).size).toBe(BO_CHI_TIEU.length)
    for (const c of BO_CHI_TIEU) {
      if (c.linhVuc === 'benh-vien') expect(b.giaTri[c.ma], c.ma).toBeUndefined()
      else expect(b.giaTri[c.ma], c.ma).toBeDefined()
    }
    // Số minh họa không có mã lạ ngoài danh mục.
    for (const ma of Object.keys(SO_LIEU_MINH_HOA)) expect(timChiTieu(ma), ma).toBeDefined()
  })

  it('chưa có phân hệ nguồn → minh họa, có chuỗi 10 kỳ kết thúc đúng giá trị', () => {
    const g = ghepBangChiTieu(TRONG).giaTri['TTHC-01']!
    expect(g.nguon).toBe('minh-hoa')
    expect(g.chuoi).toHaveLength(10)
    expect(g.chuoi.at(-1)).toBe(g.giaTri)
    expect(chuoiMinhHoa('TTHC-01', 1248, 0.08)).toEqual(chuoiMinhHoa('TTHC-01', 1248, 0.08))
  })

  it('số minh họa khớp nhau: lĩnh vực cộng lại bằng tiếp nhận; đã giải quyết + đang xử lý = tiếp nhận', () => {
    const v = (ma: string) => SO_LIEU_MINH_HOA[ma]![0]
    expect(['09', '10', '11', '12', '13', '14'].reduce((t, s) => t + v(`TTHC-${s}`), 0)).toBe(v('TTHC-01'))
    expect(v('TTHC-02') + v('TTHC-04')).toBe(v('TTHC-01'))
    expect(v('PAKN-02') + v('PAKN-03') + v('PAKN-04')).toBe(v('PAKN-01'))
  })

  it('KPI-04 chỉ lấy số THẬT từ Nhiệm vụ — không có thì "chưa có", không bịa', () => {
    expect(ghepBangChiTieu({ ...TRONG, lyDoNhiemVu: 'Chưa liên kết' }).giaTri['KPI-04']).toMatchObject({
      giaTri: null,
      nguon: 'chua-co',
      lyDo: 'Chưa liên kết',
    })
    const co = ghepBangChiTieu({ ...TRONG, nhiemVu: { tong: 40, quaHan: 8, hoanThanh: 1, dangLam: 6 } })
    expect(co.giaTri['KPI-04']).toMatchObject({ giaTri: 80, nguon: 'that', lienKet: 'nv-theo-doi' })
    expect(chamChiTieu(timChiTieu('KPI-04')!, 80)).toBe('chua-dat')
  })

  it('có dự án → giải ngân và công trình đang thi công là số thật, đè số minh họa', () => {
    const b = ghepBangChiTieu({
      ...TRONG,
      duAn: { tong: 5, dangThucHien: 3, quaHan: 1, tongMuc: 2000, daGiaiNgan: 500 },
    })
    expect(b.giaTri['KT-04']).toMatchObject({ giaTri: 25, nguon: 'that', phanHe: 'Dự án' })
    expect(b.giaTri['HT-06']).toMatchObject({ giaTri: 3, nguon: 'that' })
    // Không có dự án nào → giữ số minh họa.
    expect(ghepBangChiTieu(TRONG).giaTri['KT-04']!.nguon).toBe('minh-hoa')
  })

  it('chấm đạt: càng thấp càng tốt với chỉ tiêu quá hạn / thời gian', () => {
    expect(chamChiTieu(timChiTieu('PAKN-06')!, 3.4)).toBe('chua-dat')
    expect(chamChiTieu(timChiTieu('PAKN-06')!, 3)).toBe('dat')
    expect(chamChiTieu(timChiTieu('DC-01')!, 28500)).toBe('khong-cham')
    expect(chamChiTieu(timChiTieu('KPI-01')!, null)).toBe('khong-cham')
  })
})
