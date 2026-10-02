/** Quản trị › Cấu hình & Vận hành › Theo dõi vận hành — người xem là kỹ thuật. */

export interface ThanhPhanSucKhoe {
  ma: string
  ten: string
  /** ok: chạy tốt · canh-bao: chạy nhưng cần để ý (bản giả, chưa cấu hình) · loi: không dùng được. */
  trangThai: 'ok' | 'canh-bao' | 'loi'
  chiTiet: string
  msPhanHoi: number | null
}

export interface SucKhoeHeThong {
  phienBan: string
  moiTruong: string
  /** Tiến trình API khởi động lúc nào (ISO) — mỗi lần triển khai là một lần khởi động lại. */
  khoiDongLuc: string
  nodeJs: string
  boNhoMb: number
  kiemLuc: string
  thanhPhan: ThanhPhanSucKhoe[]
}

/** Một văn bản đang nằm trong hàng đợi xử lý (gửi FOXAI Native) hoặc bị lỗi cần gửi lại. */
export interface MucHangDoi {
  id: string
  ten: string
  trangThai: 'cho' | 'dang-xu-ly' | 'loi'
  donViTen: string
  nguoiTao: string | null
  /** Lần cập nhật gần nhất (ISO) — đứng lâu ở "đang xử lý" là dấu hiệu kẹt. */
  capNhatLuc: string
  soPhutCho: number
  loi: string | null
}

export interface HangDoiXuLy {
  dem: { cho: number; dangXuLy: number; loi: number }
  muc: MucHangDoi[]
}

export interface DongLuuTru {
  nhom: string
  donViTen: string
  loaiTep: string
  soTep: number
  /** byte */
  dungLuong: number
}

export interface LuuTruTep {
  tongTep: number
  tongDungLuong: number
  /** Tệp văn bản kéo về từ Native: nội dung nằm ở Native, GDOS không giữ tệp. */
  tepONative: number
  dong: DongLuuTru[]
}

/** 1536 → "1,5 KB". */
export function dungLuongDoc(b: number): string {
  if (b < 1024) return `${b} B`
  const dv = ['KB', 'MB', 'GB', 'TB']
  let v = b / 1024
  let i = 0
  while (v >= 1024 && i < dv.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString('vi-VN', { maximumFractionDigits: v < 10 ? 1 : 0 })} ${dv[i]}`
}
