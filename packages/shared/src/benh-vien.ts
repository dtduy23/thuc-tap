import { BO_CHI_TIEU } from './chi-tieu.js'

export const CHI_TIEU_BENH_VIEN = BO_CHI_TIEU.filter((c) => c.linhVuc === 'benh-vien')
export const MA_CONG_SUAT_GIUONG = 'BV-CONG-SUAT'

export const BAO_CAO_BENH_VIEN = [
  {
    id: 'so-y-te',
    ten: 'Sở Y tế',
    mo: 'Khám chữa bệnh, giường bệnh và cận lâm sàng',
    chiTieu: ['BV-01', 'BV-02', 'BV-03', 'BV-04', 'BV-05', MA_CONG_SUAT_GIUONG, 'BV-06', 'BV-07'],
  },
  { id: 'bhxh', ten: 'BHXH', mo: 'Tình hình gửi và trả hồ sơ BHYT', chiTieu: ['BV-08', 'BV-09'] },
  { id: 'vitimes', ten: 'VITIMES', mo: 'Tình hình ghi nhận và điều trị lao', chiTieu: ['BV-10', 'BV-11'] },
] as const

export type NguonBenhVien = 'gia-lap' | 'da-nap'

export interface SoLieuBenhVien {
  ma: string
  giaTri: number
  nguon: string
}

export interface KyBenhVien {
  ky: string
  soLieu: SoLieuBenhVien[]
}

export interface BangDieuHanhBenhVien {
  donVi: string
  nguon: NguonBenhVien
  cacKy: KyBenhVien[]
}

export function dongChiTieuBenhVien(ky: KyBenhVien) {
  const soLieu = new Map(ky.soLieu.map((d) => [d.ma, d]))
  const suDung = soLieu.get('BV-04')
  const khaDung = soLieu.get('BV-05')
  const congSuat =
    suDung && khaDung && khaDung.giaTri > 0 ? Math.round((suDung.giaTri / khaDung.giaTri) * 1000) / 10 : null
  return [
    ...CHI_TIEU_BENH_VIEN.map((c) => ({
      ma: c.ma,
      ten: c.ten,
      donVi: c.donVi,
      giaTri: soLieu.get(c.ma)?.giaTri ?? null,
      nguon: soLieu.get(c.ma)?.nguon ?? null,
    })),
    {
      ma: MA_CONG_SUAT_GIUONG,
      ten: 'Công suất sử dụng giường',
      donVi: '%',
      giaTri: congSuat,
      nguon: congSuat === null ? null : `Tính từ BV-04 (${suDung?.nguon}) và BV-05 (${khaDung?.nguon})`,
    },
  ]
}
