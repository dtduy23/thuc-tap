import { describe, expect, it } from 'vitest'
import { congDonNhom, luyKeNgay, phanTichVuongMac, type VuongMacDuAn } from './du-an.js'
import { hopNhatLuongDuyet, kiemLuongDuyet, LUONG_DUYET_MAC_DINH } from './phe-duyet.js'

describe('lũy kế ngày', () => {
  const buoc = [
    { han: null, ngayHoanThanh: null, laNhom: true, laNhap: false },
    { han: '2026-10-06', ngayHoanThanh: '2026-10-04', laNhom: false, laNhap: false },
    { han: '2026-10-11', ngayHoanThanh: '2026-10-15', laNhom: false, laNhap: false },
    { han: '2026-10-21', ngayHoanThanh: null, laNhom: false, laNhap: false },
    { han: null, ngayHoanThanh: null, laNhom: false, laNhap: true },
  ]

  it('kế hoạch tính tới hạn, thực tế tới ngày xong, chênh dương là chậm; nhóm và nháp không có', () => {
    expect(luyKeNgay(buoc, '2026-10-01')).toEqual([
      { keHoach: null, thucTe: null, chenh: null },
      { keHoach: 5, thucTe: 3, chenh: -2 },
      { keHoach: 10, thucTe: 14, chenh: 4 },
      { keHoach: 20, thucTe: null, chenh: null },
      { keHoach: null, thucTe: null, chenh: null },
    ])
  })
})

describe('cộng dồn số ngày của nhóm', () => {
  const b = (
    id: string,
    chaId: string | null,
    soNgay: number,
    them: Partial<Record<'laNhom' | 'laNhap' | 'boQua', boolean>> = {},
  ) => ({
    id,
    chaId,
    soNgay,
    laNhom: false,
    laNhap: false,
    boQua: false,
    ...them,
  })

  it('cộng mọi bước con ở mọi cấp; bỏ bước nháp và bước bỏ qua', () => {
    const kq = congDonNhom([
      b('g1', null, 0, { laNhom: true }),
      b('a', 'g1', 5),
      b('g2', 'g1', 0, { laNhom: true }),
      b('c', 'g2', 3),
      b('d', 'g2', 7, { boQua: true }),
      b('e', 'g2', 9, { laNhap: true }),
      b('f', null, 4),
    ])
    expect(Object.fromEntries(kq)).toEqual({ g1: 8, g2: 3 })
  })

  it('cha–con hỏng thành vòng thì không treo', () => {
    const kq = congDonNhom([
      b('x', 'y', 0, { laNhom: true }),
      b('y', 'x', 0, { laNhom: true }),
      b('z', 'x', 2),
    ])
    expect(kq.get('x')).toBeGreaterThan(0)
  })
})

describe('phân tích vướng mắc', () => {
  const vm = (them: Partial<VuongMacDuAn>): VuongMacDuAn => ({
    id: Math.random().toString(36),
    buocId: null,
    noiDung: 'x',
    ngayNeu: '2026-09-01',
    ngayGiaiQuyet: null,
    ketQua: null,
    nguoiNeu: null,
    nhomNguyenNhan: null,
    nguyenNhan: null,
    giaiPhap: null,
    donViXuLy: null,
    hanXuLy: null,
    mucDo: 'trung-binh',
    ...them,
  })

  it('đếm theo nhóm nguyên nhân, quá hạn xử lý, chưa phân tích, thời gian xử lý bình quân', () => {
    const pt = phanTichVuongMac(
      [
        vm({ nhomNguyenNhan: 'von', nguyenNhan: 'a', giaiPhap: 'b', hanXuLy: '2026-09-20' }),
        vm({ nhomNguyenNhan: 'von', ngayGiaiQuyet: '2026-09-11', ketQua: 'xong' }),
        vm({ nhomNguyenNhan: 'thu-tuc', ngayGiaiQuyet: '2026-09-21', ketQua: 'xong' }),
        vm({ nguyenNhan: 'có nguyên nhân, chưa có giải pháp' }),
      ],
      '2026-10-01',
    )
    expect(pt).toMatchObject({
      tong: 4,
      dangMo: 2,
      daGiaiQuyet: 2,
      quaHanXuLy: 1,
      chuaPhanTich: 1,
      ngayXuLyBinhQuan: 15,
    })
    expect(pt.theoNhom.map((n) => [n.nhom, n.tong, n.dangMo])).toEqual([
      ['von', 2, 1],
      [null, 1, 1],
      ['thu-tuc', 1, 0],
    ])
  })

  it('không có vướng mắc: mọi số bằng 0, bình quân không có', () => {
    expect(phanTichVuongMac([], '2026-10-01')).toMatchObject({
      tong: 0,
      ngayXuLyBinhQuan: null,
      theoNhom: [],
    })
  })
})

describe('luồng phê duyệt', () => {
  it('kiểm: phải có ít nhất một cấp, vai hợp lệ, tên không rỗng', () => {
    expect(kiemLuongDuyet(LUONG_DUYET_MAC_DINH['gia-han-buoc'])).toEqual([])
    expect(kiemLuongDuyet({ bat: true, choTuDuyet: false, cap: [] })).toHaveLength(1)
    expect(kiemLuongDuyet({ bat: true, choTuDuyet: false, cap: [{ ten: ' ', vai: 'la' }] })).toHaveLength(2)
    expect(kiemLuongDuyet(null)).toHaveLength(1)
  })

  it('hợp nhất: giá trị lưu hỏng hoặc thiếu thì dùng mặc định, không sửa vào mặc định', () => {
    expect(hopNhatLuongDuyet(undefined)).toEqual(LUONG_DUYET_MAC_DINH)
    expect(hopNhatLuongDuyet({ 'gia-han-buoc': { bat: 'x' } })).toEqual(LUONG_DUYET_MAC_DINH)
    const kq = hopNhatLuongDuyet({
      'gia-han-buoc': { bat: false, choTuDuyet: true, cap: [{ ten: ' Duyệt ', vai: 'can-bo' }] },
    })
    expect(kq['gia-han-buoc']).toEqual({
      bat: false,
      choTuDuyet: true,
      cap: [{ ten: 'Duyệt', vai: 'can-bo' }],
    })
    kq['gia-han-buoc'].cap.push({ ten: 'x', vai: 'lanh-dao' })
    expect(LUONG_DUYET_MAC_DINH['gia-han-buoc'].cap).toHaveLength(1)
  })
})
