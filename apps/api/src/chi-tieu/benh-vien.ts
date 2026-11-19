import {
  dongChiTieuBenhVien,
  kyHien,
  type BAO_CAO_BENH_VIEN,
  type BangDieuHanhBenhVien,
  type KyBenhVien,
  type KetQuaBaoCao,
} from '@gdos/shared'

/** Sáu tháng lịch liên tiếp, kể cả tháng không có số, để biểu đồ không nối nhầm kỳ. */
export function cacKyBenhVien(ky: string): string[] {
  const nam = Number(ky.slice(0, 4))
  const thang = Number(ky.slice(5))
  return Array.from({ length: 6 }, (_, i) =>
    new Date(Date.UTC(nam, thang - 6 + i, 1)).toISOString().slice(0, 7),
  )
}

export function giaLapBenhVien(cacKy: string[]): BangDieuHanhBenhVien {
  return {
    donVi: 'Bệnh viện minh họa',
    nguon: 'gia-lap',
    cacKy: cacKy.map((ky) => {
      const nam = Number(ky.slice(0, 4))
      const thang = Number(ky.slice(5))
      const bienDong = (nam * 12 + thang) % 17
      const khaDung = 140 * new Date(Date.UTC(nam, thang, 0)).getUTCDate()
      return {
        ky,
        soLieu: [
          2900 + bienDong * 75,
          380 + bienDong * 9,
          370 + bienDong * 8,
          Math.round(khaDung * (0.68 + bienDong / 100)),
          khaDung,
          7400 + bienDong * 210,
          980 + bienDong * 34,
          1700 + bienDong * 53,
          15 + ((bienDong * 3) % 25),
          14 + (bienDong % 8),
          90 + bienDong * 2,
        ].map((giaTri, i) => ({ ma: `BV-${String(i + 1).padStart(2, '0')}`, giaTri, nguon: 'Giả lập' })),
      }
    }),
  }
}

export function baoCaoBenhVien(
  bang: BangDieuHanhBenhVien,
  ky: KyBenhVien,
  mau: (typeof BAO_CAO_BENH_VIEN)[number],
): KetQuaBaoCao {
  const dong = dongChiTieuBenhVien(ky)
  const tieuDe = `Bản nháp báo cáo ${mau.ten}`
  const nhanNguon = bang.nguon === 'gia-lap' ? 'DỮ LIỆU GIẢ LẬP' : 'Số liệu đã nạp'
  return {
    ma: mau.id,
    tieuDe,
    phuDe: `${bang.donVi} · ${kyHien(ky.ky)} · ${nhanNguon}`,
    tenTep: `ban-nhap-${mau.id}-${ky.ky}${bang.nguon === 'gia-lap' ? '-gia-lap' : ''}`,
    coTong: false,
    ghiChu: 'Bản nháp tổng hợp phục vụ đối soát. Cần đối chiếu với biểu mẫu chính thức trước khi gửi.',
    cot: [
      { nhan: 'Chỉ tiêu', kieu: 'chu' },
      { nhan: 'Đơn vị tính', kieu: 'chu' },
      { nhan: 'Giá trị', kieu: 'so', khongCong: true, hienPhanLe: true },
      { nhan: 'Nguồn số liệu', kieu: 'chu', rong: 38 },
    ],
    dong: mau.chiTieu.map((ma) => {
      const c = dong.find((d) => d.ma === ma)!
      return { cap: 0, o: [c.ten, c.donVi, c.giaTri, c.nguon ?? 'Chưa có số liệu'] }
    }),
  }
}
