import type { CaLaoThu, HoSoBhytThu, TrangThaiBhytThu } from '@gdos/shared'

type DongBhyt = Omit<HoSoBhytThu, 'trangThai' | 'loi'> & { hieuLuc: boolean; trung: boolean }

export const HO_SO_BHYT_MAU: DongBhyt[] = Array.from({ length: 8 }, (_, i) => ({
  ma: `BHYT-THU-${String(i + 1).padStart(2, '0')}`,
  ngay: `2026-11-${String(4 + i).padStart(2, '0')}`,
  maThe: i === 1 ? null : `THE-MAU-${i + 1}`,
  maDichVu: i === 2 ? null : 'DV-MAU-XQ',
  hieuLuc: i !== 3,
  trung: i === 4,
}))

export function hoSoBhytMau(hoSo: DongBhyt, trangThai: string): HoSoBhytThu {
  const daSua = trangThai.endsWith(':da-sua')
  const maThe = daSua ? (hoSo.maThe ?? `THE-MAU-${hoSo.ma.slice(-2)}`) : hoSo.maThe
  const maDichVu = daSua ? (hoSo.maDichVu ?? 'DV-MAU-XQ') : hoSo.maDichVu
  const loi = daSua
    ? []
    : [
        !maThe && 'Thiếu mã thẻ BHYT',
        !maDichVu && 'Thiếu mã dịch vụ',
        !hoSo.hieuLuc && 'Thẻ mẫu hết hiệu lực tại ngày dịch vụ',
        hoSo.trung && 'Trùng lượt dịch vụ trong bộ hồ sơ mẫu',
      ].filter((x): x is string => typeof x === 'string')
  return {
    ma: hoSo.ma,
    ngay: hoSo.ngay,
    maThe,
    maDichVu,
    trangThai: trangThai.split(':')[0] as TrangThaiBhytThu,
    loi,
  }
}

/** Dãy ngày cố định để trạng thái đã lưu vẫn trùng lịch khi mở lại bản diễn tập. */
export const CA_LAO_MAU: CaLaoThu[] = Array.from({ length: 6 }, (_, i) => ({
  ma: `LAO-THU-${String(i + 1).padStart(2, '0')}`,
  maIcd: ['A15.0', 'A16.0'][i % 2]!,
  batDau: `2026-10-${String(i + 8).padStart(2, '0')}`,
  theoDoi: i % 2 ? 'Tổ theo dõi lưu động' : 'Tổ theo dõi ngoại trú',
  hoanTat: false,
  dongBoLuc: null,
  lanTheoDoi: [14 + i, 19 + i, 24 + i].map((ngay) => ({ ngay: `2026-11-${ngay}`, ketQua: null })),
}))
