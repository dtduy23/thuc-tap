/**
 * Nghiệp vụ DỰ ÁN dùng chung cho API và web — một nơi tính hạn, trạng thái, tiến
 * độ, nên hai phía không thể lệch số (ADR-0007 luật 2). Logic mang từ PMS
 * (services/timeline.js, kpi.js), giữ nguyên cách tính để số liệu khớp.
 *
 * Ngày luôn là chuỗi 'YYYY-MM-DD' theo giờ Việt Nam — không dùng Date cho ngày
 * nghiệp vụ, tránh lệch một ngày vì múi giờ.
 */

/** Ba giai đoạn đầu tư (Điều 8 NĐ 45) — danh sách theo luật, nằm trong mã. */
export const GIAI_DOAN = { I: 'Chuẩn bị đầu tư', II: 'Thực hiện đầu tư', III: 'Kết thúc đầu tư' } as const
export type GiaiDoan = keyof typeof GIAI_DOAN

export const BEN_THUC_HIEN = {
  'chu-dau-tu': 'Chủ đầu tư',
  'tu-van': 'Tư vấn',
  'nha-thau': 'Nhà thầu',
} as const
export type BenThucHien = keyof typeof BEN_THUC_HIEN

export const TRANG_THAI_DU_AN = {
  'dang-thuc-hien': 'Đang thực hiện',
  'hoan-thanh': 'Hoàn thành',
  'tam-dung': 'Tạm dừng',
  huy: 'Hủy',
} as const
export type TrangThaiDuAn = keyof typeof TRANG_THAI_DU_AN

/** Loại chi — quyết định biểu báo cáo (Biểu 01 ĐTPT; Biểu 02/03 CTX). Cố định theo luật. */
export const LOAI_CHI = { dtpt: 'Đầu tư phát triển', ctx: 'Chi thường xuyên' } as const
export type LoaiChi = keyof typeof LOAI_CHI

/** Nhóm dự án theo Luật Đầu tư công. */
export const NHOM_DU_AN = ['A', 'B', 'C'] as const
export type NhomDuAn = (typeof NHOM_DU_AN)[number]

/** Hình thức đi theo quy trình mẫu — người dùng không khai riêng. */
export const HINH_THUC = {
  'dau-tu': 'Đầu tư',
  thue: 'Thuê dịch vụ',
  'mua-sam': 'Mua sắm',
  'chi-thuong-xuyen': 'Chi thường xuyên',
  khac: 'Khác',
} as const
export type HinhThuc = keyof typeof HINH_THUC

export const VAI_TRO_THANH_VIEN = {
  'phu-trach': 'Cán bộ phụ trách',
  'nha-thau': 'Nhà thầu',
  'tu-van': 'Tư vấn',
  'giam-sat': 'Giám sát',
} as const
export type VaiTroThanhVien = keyof typeof VAI_TRO_THANH_VIEN

/** Một bước trong quy trình mẫu. `cha` là chỉ số của bước cha trong cùng mảng. */
export interface BuocMau {
  gd: GiaiDoan
  stt: string
  nhom: boolean
  ten: string
  soNgay: number
  donVi: string
  ben: BenThucHien
  vanBan: string
  cha: number | null
}

// ── Ngày ───────────────────────────────────────────────────────────────────

const NGAY = /^\d{4}-\d{2}-\d{2}$/
export const laNgay = (s: unknown): s is string =>
  typeof s === 'string' && NGAY.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))

export function congNgay(ngay: string, soNgay: number): string {
  const d = new Date(`${ngay}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + soNgay)
  return d.toISOString().slice(0, 10)
}

/** Số ngày từ `tu` đến `den` (âm nếu `den` trước `tu`). */
export const soNgayGiua = (tu: string, den: string): number =>
  Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu}T00:00:00Z`)) / 864e5)

/** Hôm nay theo giờ Việt Nam (UTC+7, không có giờ mùa hè). */
export const homNay = (bayGio = Date.now()): string =>
  new Date(bayGio + 7 * 3600e3).toISOString().slice(0, 10)

// ── Hạn và trạng thái ──────────────────────────────────────────────────────

/**
 * Hạn từng bước theo chuỗi, như công thức Excel của PMS:
 *   han[i] = hạn ghi đè[i] ?? han[bước trước] + số ngày[i]
 * Bước nháp không vào chuỗi (hạn null) và không đẩy bước sau. Bước bỏ qua VẪN
 * trong chuỗi — bỏ qua một bước không kéo sớm các bước sau.
 */
export function tinhHan(
  buoc: readonly { soNgay: number; hanGhiDe: string | null; laNhap: boolean }[],
  batDau: string,
): (string | null)[] {
  let hienTai = batDau
  return buoc.map((b) => {
    if (b.laNhap) return null
    hienTai = b.hanGhiDe ?? congNgay(hienTai, b.soNgay)
    return hienTai
  })
}

export const TRANG_THAI_BUOC = {
  'bo-qua': 'Bỏ qua',
  'cho-xac-nhan': 'Chờ xác nhận',
  xong: 'Hoàn thành',
  'qua-han': 'Quá hạn',
  'sap-han': 'Sắp đến hạn',
  'trong-han': 'Trong hạn',
} as const
export type TrangThaiBuoc = keyof typeof TRANG_THAI_BUOC

/** Mặc định "sắp đến hạn" — trong 10 ngày tới (PMS). Về sau là tham số ở Quy tắc cảnh báo. */
export const NGUONG_SAP_HAN = 10

export interface BuocTrangThai {
  laNhom: boolean
  laNhap: boolean
  boQua: boolean
  choXacNhan: unknown
  ngayHoanThanh: string | null
  han: string | null
}

/** Thứ tự ưu tiên giữ đúng PMS: bỏ qua → chờ xác nhận → xong → quá hạn → sắp hạn → trong hạn. */
export function trangThaiBuoc(b: BuocTrangThai, hn: string, nguong = NGUONG_SAP_HAN): TrangThaiBuoc {
  if (b.boQua) return 'bo-qua'
  if (b.choXacNhan) return 'cho-xac-nhan'
  if (b.ngayHoanThanh) return 'xong'
  if (!b.han) return 'trong-han'
  if (b.han < hn) return 'qua-han'
  if (soNgayGiua(hn, b.han) <= nguong) return 'sap-han'
  return 'trong-han'
}

/** Bước tính vào tiến độ: không phải nhóm, không nháp, không bỏ qua. */
export const tinhTienDo = (b: BuocTrangThai): boolean => !b.laNhom && !b.laNhap && !b.boQua

export type SucKhoe = 'qua-han' | 'sap-han' | 'trong-han' | 'xong'

export interface ThongKeTienDo {
  tong: number
  xong: number
  quaHan: number
  sapHan: number
  trongHan: number
  choXacNhan: number
  phanTram: number
  sucKhoe: SucKhoe
  /** Số ngày trễ của bước trễ nhất. */
  treNhat: number
  /** Giai đoạn của bước đầu tiên chưa xong; null = đã xong hết. */
  giaiDoan: GiaiDoan | null
  /** Bước đầu tiên chưa xong — "đang tắc ở đâu". */
  buocHienTai: { stt: string; ten: string } | null
}

export function thongKeTienDo<T extends BuocTrangThai & { giaiDoan: GiaiDoan; stt: string; ten: string }>(
  buoc: readonly T[],
  hn: string,
  nguong = NGUONG_SAP_HAN,
): ThongKeTienDo {
  const that = buoc.filter(tinhTienDo)
  const dem = { xong: 0, quaHan: 0, sapHan: 0, trongHan: 0, choXacNhan: 0 }
  let treNhat = 0
  for (const b of that) {
    const tt = trangThaiBuoc(b, hn, nguong)
    if (tt === 'xong') dem.xong++
    else if (tt === 'qua-han') {
      dem.quaHan++
      treNhat = Math.max(treNhat, soNgayGiua(b.han!, hn))
    } else if (tt === 'sap-han') dem.sapHan++
    else if (tt === 'cho-xac-nhan') dem.choXacNhan++
    else dem.trongHan++
  }
  const dau = that.find((b) => !b.ngayHoanThanh)
  const sucKhoe: SucKhoe = dem.quaHan
    ? 'qua-han'
    : that.length > 0 && dem.xong === that.length
      ? 'xong'
      : dem.sapHan
        ? 'sap-han'
        : 'trong-han'
  return {
    tong: that.length,
    ...dem,
    phanTram: that.length ? Math.round((dem.xong / that.length) * 100) : 0,
    sucKhoe,
    treNhat,
    giaiDoan: dau ? dau.giaiDoan : null,
    buocHienTai: dau ? { stt: dau.stt, ten: dau.ten } : null,
  }
}

// ── Mã dự án ───────────────────────────────────────────────────────────────

/** Mã dự án: chữ, số và - _ . / — không dấu, không khoảng trắng, tối đa 40 ký tự (như PMS). */
export function kiemMaDuAn(ma: string): string | null {
  if (!ma) return 'Thiếu mã dự án'
  if (ma.length > 40) return 'Mã dự án tối đa 40 ký tự'
  if (!/^[A-Za-z0-9._\-/]+$/.test(ma)) return 'Mã dự án chỉ gồm chữ không dấu, số và các ký tự - _ . /'
  return null
}

// ── Hợp đồng dữ liệu API ↔ web ─────────────────────────────────────────────

/** Cập nhật nhà thầu / tư vấn gửi, chờ chủ đầu tư xác nhận. */
export interface CapNhatCho {
  ngay: string
  ghiChu: string
  nguoiGui: string
  nguoiGuiTen: string | null
  luc: string
}

export interface BuocDuAn {
  id: string
  thuTu: number
  chaId: string | null
  giaiDoan: GiaiDoan
  stt: string
  laNhom: boolean
  batBuoc: boolean
  ten: string
  soNgay: number
  hanGhiDe: string | null
  han: string | null
  ngayHoanThanh: string | null
  soVanBan: string | null
  donViThucHien: string | null
  benThucHien: BenThucHien
  ghiChu: string | null
  boQua: boolean
  lyDoBoQua: string | null
  choXacNhan: CapNhatCho | null
  sanPham: string | null
  anTongQuan: boolean
  laNhap: boolean
}

export interface DuAnDong {
  id: string
  ma: string
  ten: string
  trangThai: TrangThaiDuAn
  donViId: string
  donViTen: string
  hinhThuc: HinhThuc
  loaiChi: LoaiChi
  nhomDuAn: NhomDuAn | null
  linhVucId: string | null
  linhVucTen: string | null
  tongMuc: number
  ngayBatDau: string
  capNhatNgay: string | null
  quyTrinhMa: string | null
  canBo: { id: string; hoTen: string } | null
  thongKe: ThongKeTienDo
  /** Vướng mắc chưa giải quyết. */
  vuongMacMo: number
  /** Tổng các đợt giải ngân, triệu đồng. */
  daGiaiNgan: number
}

export interface ThanhVienDuAn {
  id: string
  taiKhoanId: string
  hoTen: string
  donViTen: string
  vaiTro: VaiTroThanhVien
}

export interface HoSoDuAn extends DuAnDong {
  canCu: string | null
  tienDoMoTa: string | null
  buoc: BuocDuAn[]
  thanhVien: ThanhVienDuAn[]
  /** Mới nhất trước. Phiên bản 1 là kế hoạch gốc. */
  phienBan: PhienBanKeHoach[]
  /** Hạn từng bước ở lần chốt gần nhất — so với hạn hiện tại để thấy lệch. Bước vắng mặt = thêm sau lần chốt. */
  hanDaChot: Record<string, string | null>
  vanBan: VanBanDuAn[]
  von: VonDuAn[]
  giaiNgan: DotGiaiNgan[]
  vuongMac: VuongMacDuAn[]
  taiChinh: TaiChinhDuAn
  /** Người xem được làm gì trên CHÍNH dự án này — API tính, web chỉ để ẩn/hiện nút. */
  quyen: {
    /** Sửa thông tin, ghi nhận bước, xác nhận cập nhật — đơn vị chủ đầu tư. */
    sua: boolean
    /** Xác nhận (hoặc trả lại) cập nhật nhà thầu gửi — chủ đầu tư, lãnh đạo đơn vị. */
    xacNhan: boolean
    /** Gửi cập nhật chờ xác nhận — nhà thầu, tư vấn của dự án. */
    gui: boolean
    /** Thêm / bớt thành viên. */
    thanhVien: boolean
  }
}

export interface QuyTrinhMauDong {
  id: string
  ma: string
  ten: string
  canCu: string | null
  hinhThuc: HinhThuc
  soBuoc: number
  khoa: boolean
}

export interface GiaTriDanhMuc {
  id: string
  loai: 'linh-vuc' | 'nguon-von' | 'loai-van-ban'
  ma: string
  ten: string
  mau: string | null
}

export interface TaiKhoanDanhBa {
  id: string
  hoTen: string
  tenDangNhap: string
  donViTen: string
  donViCap: string
}

/** Cấp 4 của module Dự án dùng CHUNG một màn danh sách, khác nhau ở bộ lọc. */
export const LOC_DU_AN = ['tat-ca', 'cua-toi', 'cho-xac-nhan'] as const
export type LocDuAn = (typeof LOC_DU_AN)[number]

// ── Kế hoạch & điều chỉnh ─────────────────────────────────────────────────

export interface PhienBanKeHoach {
  id: string
  so: number
  ngay: string
  lyDo: string
  canCu: string | null
  soNgayLui: number
  ngayKetThuc: string | null
  nguoiChot: string | null
}

/**
 * Khoảng [bắt đầu, hạn] của từng bước theo đúng chuỗi của `tinhHan` — bước bắt
 * đầu khi bước chính thức trước nó đến hạn. Dùng cho Gantt. Bước nháp: null.
 */
export function khoangBuoc(
  buoc: readonly { soNgay: number; hanGhiDe: string | null; laNhap: boolean }[],
  batDau: string,
): ({ tu: string; den: string } | null)[] {
  let hienTai = batDau
  return buoc.map((b) => {
    if (b.laNhap) return null
    const tu = hienTai
    hienTai = b.hanGhiDe ?? congNgay(hienTai, b.soNgay)
    return { tu: hienTai < tu ? hienTai : tu, den: hienTai }
  })
}

/** Ngày kết thúc dự kiến = hạn muộn nhất của các bước chính thức. */
export function ngayKetThucDuKien(buoc: readonly { han: string | null; laNhap: boolean }[]): string | null {
  let max: string | null = null
  for (const b of buoc) if (!b.laNhap && b.han && (!max || b.han > max)) max = b.han
  return max
}

// ── Văn bản, vốn, giải ngân, vướng mắc ───────────────────────────────────────

/** Tệp nhận: văn bản hành chính, bảng tính, ảnh chụp, bản vẽ nén. Không nhận tệp chạy được. */
export const DUOI_TEP_CHO_PHEP = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpg',
  'jpeg',
  'png',
  'zip',
  'rar',
  'dwg',
] as const
export const KICH_THUOC_TEP_TOI_DA = 25 * 1024 * 1024

export interface VanBanDuAn {
  id: string
  buocId: string | null
  giaiNganId: string | null
  tenTep: string
  loaiTep: string
  kichThuoc: number
  tieuDe: string | null
  soKyHieu: string | null
  ngayKy: string | null
  nguoiKy: string | null
  toSo: string | null
  ghiChu: string | null
  nguoiTai: string | null
  taiLuc: string
}

export interface VonDuAn {
  id: string
  nam: number
  nguonVonId: string
  nguonVonTen: string
  keHoach: number
  ghiChu: string | null
}

export interface DotGiaiNgan {
  id: string
  nam: number
  nguonVonId: string
  nguonVonTen: string
  ngay: string
  soTien: number
  dot: string | null
  soKyHieu: string | null
  ghiChu: string | null
}

export interface VuongMacDuAn {
  id: string
  buocId: string | null
  noiDung: string
  ngayNeu: string
  ngayGiaiQuyet: string | null
  ketQua: string | null
  nguoiNeu: string | null
}

export interface TaiChinhDuAn {
  /** Tổng kế hoạch vốn các năm. */
  keHoach: number
  /** Kế hoạch vốn từ đầu tới hết năm nay — mốc để so tiến độ giải ngân. */
  keHoachDenNay: number
  daGiaiNgan: number
  /** % giải ngân so với tổng mức đầu tư. */
  phanTramTongMuc: number
  /** % giải ngân so với kế hoạch vốn tới năm nay (KPI giải ngân của PMS). */
  phanTramKeHoach: number
}

/** Cách PMS tính: giải ngân = tổng các đợt; so với tổng mức và với kế hoạch lũy kế tới năm nay. */
export function tinhTaiChinh(
  tongMuc: number,
  von: readonly { nam: number; keHoach: number }[],
  dot: readonly { soTien: number }[],
  namNay: number,
): TaiChinhDuAn {
  const keHoach = von.reduce((t, v) => t + v.keHoach, 0)
  const keHoachDenNay = von.filter((v) => v.nam <= namNay).reduce((t, v) => t + v.keHoach, 0)
  const daGiaiNgan = dot.reduce((t, d) => t + d.soTien, 0)
  const pt = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)
  return {
    keHoach,
    keHoachDenNay,
    daGiaiNgan,
    phanTramTongMuc: pt(daGiaiNgan, tongMuc),
    phanTramKeHoach: pt(daGiaiNgan, keHoachDenNay),
  }
}
