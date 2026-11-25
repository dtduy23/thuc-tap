import type { CaLaoThu, HoSoBhytThu, TrangThaiBhytThu } from '@gdos/shared'

type DongBhyt = Omit<HoSoBhytThu, 'trangThai' | 'loi'> & { hieuLuc: boolean; trung: boolean }

export const HO_SO_BHYT_MAU: DongBhyt[] = Array.from({ length: 8 }, (_, i) => ({
  ma: `BHYT-THU-${String(i + 1).padStart(2, '0')}`,
  ngay: `2026-11-${String(4 + i).padStart(2, '0')}`,
  maThe: i === 1 ? null : `THE-MAU-${i + 1}`,
  maDichVu: i === 2 ? null : 'DV-MAU-XQ',
  hieuLuc: i !== 3,
  trung: i === 4,
  hoTen: [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Văn Cường',
    'Phạm Thị Dung',
    'Hoàng Văn Em',
    'Vũ Thị Giang',
    'Đặng Văn Hải',
    'Bùi Thị Lan',
  ][i]!,
  namSinh: 1965 + ((i * 7) % 35),
  khoa: [
    'Khoa Khám bệnh',
    'Khoa Lao 1',
    'Khoa Hô hấp',
    'Hồi sức – Cấp cứu',
    'Khoa Lao 2',
    'Khoa Khám bệnh',
    'Khoa Hô hấp',
    'Khoa Lao 1',
  ][i]!,
  tongChiPhi: [1850000, 3420000, 950000, 6800000, 2100000, 1450000, 4200000, 2800000][i]!,
  tienBhyt: [1480000, 2736000, 760000, 5440000, 1680000, 1160000, 3360000, 2240000][i]!,
  mucDoRuiRo: i === 1 || i === 2 || i === 3 || i === 4 ? 'cao' : i === 0 ? 'trung-binh' : 'thap',
  goiYAI:
    i === 1
      ? 'Bổ sung mã thẻ BHYT hợp lệ từ cơ sở dữ liệu tra cứu cổng BHXH'
      : i === 2
        ? 'Áp dụng mã dịch vụ chuẩn danh mục Bộ Y tế: DV-MAU-XQ'
        : i === 3
          ? 'Gia hạn thẻ BHYT hoặc chuyển thu viện phí đối tượng ngoài danh mục'
          : i === 4
            ? 'Hủy chỉ định trùng lặp kỹ thuật trong cùng ngày dịch vụ'
            : 'Hồ sơ hợp lệ theo Quyết định 130/QĐ-BYT, sẵn sàng ký số gửi cổng',
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
    hoTen: hoSo.hoTen,
    namSinh: hoSo.namSinh,
    khoa: hoSo.khoa,
    tongChiPhi: hoSo.tongChiPhi,
    tienBhyt: hoSo.tienBhyt,
    mucDoRuiRo: hoSo.mucDoRuiRo,
    goiYAI: daSua
      ? 'Hồ sơ đã được chuẩn hóa dữ liệu hợp lệ theo Quyết định 130/QĐ-BYT, sẵn sàng trình duyệt.'
      : hoSo.goiYAI,
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
  hoTen: ['Nguyễn Văn Hòa', 'Trần Thị Mai', 'Lê Hữu Nam', 'Phạm Thanh Phong', 'Đỗ Thị Quyên', 'Võ Minh Trí'][
    i
  ]!,
  namSinh: [1978, 1985, 1962, 1994, 1970, 1988][i]!,
  gioiTinh: i % 2 === 0 ? 'Nam' : 'Nữ',
  phanLoai:
    i === 0
      ? 'Mới'
      : i === 1
        ? 'Mới'
        : i === 2
          ? 'Tái phát'
          : i === 3
            ? 'Sau bỏ trị'
            : i === 4
              ? 'Kháng thuốc (MDR/RR)'
              : 'Mới',
  theBenh: i % 2 === 0 ? 'Lao phổi AFB(+)' : 'Lao phổi AFB(-)',
  phacDo: i === 4 ? '2RHZE/4RHE (Lao kháng thuốc)' : '2RHZE/4RH (Phác đồ A1)',
  tuanThuDots: [95, 90, 85, 80, 92, 98][i]!,
  ketQuaXnDom: [
    { thang: 2, ketQua: i === 3 ? 'Dương tính' : 'Âm tính', ngayXn: `2026-11-${10 + i}` },
    { thang: 5, ketQua: 'Âm tính' as const, ngayXn: `2027-02-${10 + i}` },
    { thang: 6, ketQua: 'Âm tính' as const, ngayXn: `2027-03-${10 + i}` },
  ],
}))
