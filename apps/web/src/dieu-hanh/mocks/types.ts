/** Kiểu dữ liệu cho object `D` trong reference/gdos-portal.html.
 *  Giữ nguyên tên trường viết tắt của bản gốc để đối chiếu được từng dòng. */

/** Cặp [nhãn, khóa màu] — bản gốc dùng cho mọi pill trạng thái. */
export type TrangThai = readonly [string, MauPill]
export type MauPill = 'red' | 'yel' | 'blue' | 'green' | 'gray' | 'pur'

export interface HoSoTthc {
  id: string
  /** Công dân */
  cd: string
  cccd: string
  /** Loại thủ tục */
  loai: string
  /** Nhóm thủ tục */
  nhom: string
  /** Ngày tiếp nhận */
  nhan: string
  /** Hạn xử lý */
  han: string
  st: TrangThai
  /** Chuyên viên */
  cv: string
}

export interface PhanTichAi {
  /** Tóm tắt */
  tt: string
  /** Yêu cầu + hạn */
  yc: string
  /** Phân bổ đơn vị */
  pb: string
}

export interface VanBanDen {
  so: string
  ten: string
  /** Nơi ban hành */
  noi: string
  ngay: string
  khan: TrangThai
  ai: PhanTichAi
}

export interface NhiemVu {
  ten: string
  nguon: string
  han: string
  pct: number
  st: TrangThai
  /** Đơn vị phụ trách */
  ph: string
  /** Nhật ký: [ngày, nội dung] */
  log: ReadonlyArray<readonly [string, string]>
}

export interface PhanAnh {
  id: string
  ten: string
  linhvuc: string
  st: TrangThai
  ngay: string
  /** Từ khóa ảnh minh họa */
  kw: string
  nguoi: string
  /** Nội dung */
  nd: string
}

/** [tên, giá trị, mô tả, %đạt, module nguồn, đơn vị phụ trách] */
export type ChiTieuKtxh = readonly [string, number, string, number, string, string]

export interface NhomKtxh {
  nhom: string
  items: ReadonlyArray<ChiTieuKtxh>
}

/** [tên, giá trị, mục tiêu, màu, module nguồn, đơn vị phụ trách] */
export type ChiSo = readonly [string, number, string, 'green' | 'orange', string, string]

export interface ThuaDat {
  id: string
  /** Chủ sử dụng */
  cs: string
  cccd: string
  /** Diện tích */
  dt: string
  /** Mục đích sử dụng */
  md: string
  /** Giấy chứng nhận */
  gcn: string
  /** Quy hoạch */
  qh: string
  /** Biến động */
  bd: string
  /** Lịch sử: [mốc, nội dung] */
  ls: ReadonlyArray<readonly [string, string]>
}

export interface VungTrong {
  /** Sản phẩm */
  sp: string
  dt: string
  /** Số hộ */
  ho: string
  /** Lượt quét QR */
  quet: string
  seed: number
  st: TrangThai
  /** Nhật ký canh tác */
  nk: TrangThai
  logs: ReadonlyArray<readonly [string, string]>
}

export interface Truong {
  ten: string
  /** Địa bàn */
  to: string
  /** Cấp học */
  cap: string
  /** Học sinh */
  hs: string
  /** Sĩ số bình quân */
  ss: number
  /** Cơ sở vật chất */
  csvc: TrangThai
  /** Mức chuẩn quốc gia */
  chuan: TrangThai
  /** Giáo viên */
  gv: number
  /** Số lớp */
  lop: number
  note: string
}

export interface DiTich {
  ten: string
  sub: string
  /** Xếp hạng */
  xh: TrangThai
  /** Bảo tồn */
  bt: TrangThai
  /** Số hóa */
  so: TrangThai
  /** Tọa độ [lat, lng] */
  ll: readonly [number, number]
  c: string
  seed: number
  quet: string
  tour: boolean
  kw: string
  yt: string | null
  wikis?: ReadonlyArray<string>
  imgs?: ReadonlyArray<string>
  noimg?: boolean
  /** Phân loại */
  pl: string
  /** Quyết định xếp hạng */
  qd: string
  /** Hiện trạng bảo tồn */
  bts: string
  /** Tư liệu số hóa */
  tl: string
  /** Sự kiện thường niên */
  sk: string
}

/** [tên tuyến, loại, tổng nhà, đã gắn, trạng thái, màu, ghi chú] */
export type TuyenSoNha = readonly [string, string, number, number, string, MauPill, string]

export interface HoSoNha {
  /** Số nhà */
  sn: string
  tuyen: string
  /** Chủ sở hữu */
  cs: string
  /** Nhân khẩu */
  nk: number
  st: TrangThai
  ngay: string
  qr: number
  gcn: string
  ghi: string
}

export interface SoNha {
  tuyen: ReadonlyArray<TuyenSoNha>
  ho: ReadonlyArray<HoSoNha>
}

/** [tên khu phố, số hộ, TC1..TC5, điểm tổng, trạng thái] */
export type DiemKhuPho = readonly [string, string, number, number, number, number, number, string, TrangThai]

export interface DuLieuGdos {
  tthc: HoSoTthc[]
  vanban: ReadonlyArray<VanBanDen>
  nhiemvu: ReadonlyArray<NhiemVu>
  phananh: ReadonlyArray<PhanAnh>
  ktxh: ReadonlyArray<NhomKtxh>
  chiso: ReadonlyArray<ChiSo>
  parcels: ReadonlyArray<ThuaDat>
  vt: Readonly<Record<string, VungTrong>>
  truong: ReadonlyArray<Truong>
  dt: ReadonlyArray<DiTich>
  sonha: SoNha
  apscore: ReadonlyArray<DiemKhuPho>
}
