import { BO_CHI_TIEU } from './chi-tieu.js'
import type { BaoCaoDef, CheDoSoLieu } from './dong-gop.js'

export const CHI_TIEU_BENH_VIEN = BO_CHI_TIEU.filter((c) => c.linhVuc === 'benh-vien')
export const MA_CONG_SUAT_GIUONG = 'BV-CONG-SUAT'

export const BAO_CAO_BENH_VIEN = [
  {
    id: 'so-y-te',
    maBaoCao: 'bao-cao-benh-vien-so-y-te',
    ten: 'Sở Y tế',
    mo: 'Khám chữa bệnh, giường bệnh và cận lâm sàng',
    chiTieu: ['BV-01', 'BV-02', 'BV-03', 'BV-04', 'BV-05', MA_CONG_SUAT_GIUONG, 'BV-06', 'BV-07'],
  },
  {
    id: 'bhxh',
    maBaoCao: 'ho-so-bhyt-giao-ban',
    ten: 'BHXH',
    mo: 'Tình hình gửi và trả hồ sơ BHYT',
    chiTieu: ['BV-08', 'BV-09'],
  },
  {
    id: 'vitimes',
    maBaoCao: 'dieu-tri-lao-giao-ban',
    ten: 'VITIMES',
    mo: 'Tình hình ghi nhận và điều trị lao',
    chiTieu: ['BV-10', 'BV-11'],
  },
] as const

export function dinhNghiaBaoCaoBenhVien(mau: (typeof BAO_CAO_BENH_VIEN)[number]): BaoCaoDef {
  return {
    id: mau.maBaoCao,
    ten: `Bản nháp báo cáo ${mau.ten}`,
    mo: mau.mo,
    loai: 'dinh-ky',
    hanhDong: 'EXPORT',
    thamSo: ['ky-bao-cao', 'nguon-so-lieu'],
  }
}

export const BAO_CAO_PHIM_THU = [
  { mau: 'bao-cao', id: 'phim-x-quang-bao-cao', ten: 'Báo cáo khoa học thử nghiệm' },
  { mau: 'bien-ban', id: 'phim-x-quang-bien-ban', ten: 'Dự thảo biên bản Hội đồng' },
  { mau: 'phan-loai', id: 'phim-x-quang-phan-loai', ten: 'Phiếu chuẩn bị phân loại thiết bị' },
  { mau: 'dao-tao', id: 'phim-x-quang-dao-tao', ten: 'Phiếu đào tạo và phản hồi' },
  { mau: 'bo-nhan', id: 'phim-x-quang-bo-nhan', ten: 'Bộ nhãn lịch sử đã duyệt' },
] as const

export type NguonBenhVien = CheDoSoLieu

export interface SoLieuBenhVien {
  ma: string
  giaTri: number
  nguon: string
  loaiNguon: 'da-nap' | 'gia-lap'
  capNhatLuc?: string
}

export interface KyBenhVien {
  ky: string
  soLieu: SoLieuBenhVien[]
  /** Dùng khi chế độ Tự động chỉ có một trong hai số ngày giường đã nạp. */
  congSuatGiaLap?: number
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
  const cungLoai = suDung && khaDung && suDung.loaiNguon === khaDung.loaiNguon
  const congSuat = cungLoai
    ? khaDung.giaTri > 0
      ? Math.round((suDung.giaTri / khaDung.giaTri) * 1000) / 10
      : null
    : (ky.congSuatGiaLap ?? null)
  return [
    ...CHI_TIEU_BENH_VIEN.map((c) => ({
      ma: c.ma,
      ten: c.ten,
      donVi: c.donVi,
      giaTri: soLieu.get(c.ma)?.giaTri ?? null,
      nguon: soLieu.get(c.ma)?.nguon ?? null,
      loaiNguon: soLieu.get(c.ma)?.loaiNguon ?? null,
      capNhatLuc: soLieu.get(c.ma)?.capNhatLuc ?? null,
    })),
    {
      ma: MA_CONG_SUAT_GIUONG,
      ten: 'Công suất sử dụng giường',
      donVi: '%',
      giaTri: congSuat,
      nguon:
        congSuat === null
          ? null
          : cungLoai
            ? `Tính từ BV-04 (${suDung?.nguon}) và BV-05 (${khaDung?.nguon})`
            : 'Giả lập · tính từ hai số ngày giường mẫu',
      loaiNguon: congSuat === null ? null : cungLoai ? suDung.loaiNguon : 'gia-lap',
      capNhatLuc: null,
    },
  ]
}
