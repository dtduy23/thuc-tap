import type { DuAnDong, KpiDuAn } from '@gdos/shared'
import { describe, expect, it } from 'vitest'
import { chiSoDuAn, tongQuanDuAn, type DuAnTongHop } from './dieu-hanh.js'

const kpi = (diem: number): KpiDuAn => ({
  diem,
  xepLoai: diem >= 85 ? 'A' : diem >= 70 ? 'B' : diem >= 50 ? 'C' : 'D',
  dungHan: 100,
  treBinhQuan: 0,
  dieuChinh: 0,
  giaiNgan: 100,
})

function da(
  id: string,
  them: Partial<DuAnDong> & { sk?: DuAnDong['thongKe']['sucKhoe']; gd?: DuAnDong['thongKe']['giaiDoan'] },
  diem = 80,
): DuAnTongHop {
  const { sk = 'trong-han', gd = 'I', ...con } = them
  return {
    d: {
      id,
      ma: id,
      ten: `Dự án ${id}`,
      trangThai: 'dang-thuc-hien',
      donViId: 'x',
      donViTen: 'Xã A',
      hinhThuc: 'dau-tu',
      loaiChi: 'dtpt',
      nhomDuAn: null,
      linhVucId: null,
      linhVucTen: 'CNTT',
      tongMuc: 100,
      ngayBatDau: '2026-01-01',
      capNhatNgay: null,
      quyTrinhMa: null,
      canBo: null,
      vuongMacMo: 0,
      daGiaiNgan: 25,
      thongKe: {
        tong: 10,
        xong: 5,
        quaHan: sk === 'qua-han' ? 1 : 0,
        sapHan: 0,
        trongHan: 4,
        choXacNhan: 0,
        phanTram: 50,
        sucKhoe: sk,
        treNhat: sk === 'qua-han' ? 12 : 0,
        giaiDoan: gd,
        buocHienTai: { stt: '1', ten: 'Bước' },
      },
      ...con,
    },
    kpi: kpi(diem),
  }
}

describe('Tổng quan dự án', () => {
  it('toàn cảnh: đếm theo tình trạng, bỏ dự án hủy; ma trận giai đoạn; quá hạn xếp theo số ngày trễ', () => {
    const k = tongQuanDuAn(
      [
        da('a', { sk: 'qua-han' }),
        da('b', { sk: 'qua-han', gd: 'II' }),
        da('c', {}),
        da('d', { trangThai: 'huy' }),
      ],
      'toan',
    )
    expect(k.so.find((s) => s.nhan === 'Tổng dự án')?.giaTri).toBe('3')
    expect(k.so.find((s) => s.nhan === 'Quá hạn')?.giaTri).toBe('2')
    expect(k.so.find((s) => s.nhan === 'Giải ngân')?.giaTri).toBe('25%')
    const maTran = k.bang[0]!
    expect(maTran.dong[0]!.o).toEqual(['I — Chuẩn bị đầu tư', 1, 0, 1, 0, 2])
    expect(k.bang[1]!.dong.map((d) => d.o[0])).toEqual(['Dự án a', 'Dự án b'])
  })

  it('theo đơn vị: gom đúng nhóm, đơn vị nhiều quá hạn lên trước', () => {
    const k = tongQuanDuAn(
      [
        da('a', { donViTen: 'Xã B' }),
        da('b', { donViTen: 'Xã A', sk: 'qua-han' }),
        da('c', { donViTen: 'Xã A' }),
      ],
      'don-vi',
    )
    expect(k.bang[0]!.dong.map((d) => [d.o[0], d.o[1], d.o[2]])).toEqual([
      ['Xã A', 2, 1],
      ['Xã B', 1, 0],
    ])
  })
})

describe('Bộ chỉ số dự án', () => {
  it('KPI từng dự án xếp điểm cao trước; xếp hạng chủ đầu tư và nhà thầu theo KPI bình quân', () => {
    const ds = [
      da('a', { donViTen: 'Xã A' }, 90),
      da('b', { donViTen: 'Xã A' }, 40),
      da('c', { donViTen: 'Xã B' }, 70),
    ]
    expect(chiSoDuAn(ds, 'tat-ca', []).bang[0]!.dong.map((d) => d.o[2])).toEqual([90, 70, 40])
    const xh = chiSoDuAn(ds, 'xep-hang', [
      { duAnId: 'a', tenDonVi: 'Công ty X' },
      { duAnId: 'c', tenDonVi: 'Công ty Y' },
    ])
    expect(xh.bang[0]!.dong.map((d) => [d.o[1], d.o[3]])).toEqual([
      ['Xã B', 70],
      ['Xã A', 65],
    ])
    expect(xh.bang[1]!.dong.map((d) => d.o[1])).toEqual(['Công ty X', 'Công ty Y'])
  })
})
