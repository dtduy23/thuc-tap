/**
 * Nghiệp vụ DỰ ÁN dùng chung cho API và web — một nơi tính hạn, trạng thái, tiến
 * độ, nên hai phía không thể lệch số (ADR-0007 luật 2). Logic mang từ PMS
 * (services/timeline.js, kpi.js), giữ nguyên cách tính để số liệu khớp.
 *
 * Ngày luôn là chuỗi 'YYYY-MM-DD' theo giờ Việt Nam — không dùng Date cho ngày
 * nghiệp vụ, tránh lệch một ngày vì múi giờ.
 */
import type { BuocDuyetDaQua, CapDuyet, TrangThaiYeuCau } from './phe-duyet.js'

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
/** Ngày YYYY-MM-DD CÓ THẬT — Date.parse tự "lăn" 31/02 sang tháng 3 nên phải so lại. */
export function laNgay(s: unknown): s is string {
  if (typeof s !== 'string' || !NGAY.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
}

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
  /** Địa điểm đầu tư (Biểu 01). */
  diaDiem: string | null
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
  /** Yêu cầu xin gia hạn bước — mới nhất trước. */
  giaHan: YeuCauGiaHan[]
  /** Luồng duyệt gia hạn đang áp dụng (để màn hình nói rõ sẽ qua những cấp nào). */
  luongGiaHan: { bat: boolean; cap: CapDuyet[] }
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
    /** Gửi yêu cầu xin gia hạn bước — cán bộ chủ đầu tư, nhà thầu, tư vấn của dự án. */
    xinGiaHan: boolean
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

// ── Cộng dồn / lũy kế ngày (PMS có, từng bị ẩn bằng cờ HIDE_TIME) ───────────

export interface LuyKeBuoc {
  /** Số ngày từ ngày bắt đầu dự án tới HẠN của bước (lũy kế kế hoạch). null: nhóm, bước nháp. */
  keHoach: number | null
  /** Số ngày từ ngày bắt đầu dự án tới ngày HOÀN THÀNH thực tế. null: chưa xong. */
  thucTe: number | null
  /** thực tế − kế hoạch: dương = chậm, âm = sớm. null: chưa xong. */
  chenh: number | null
}

/** Lũy kế ngày của từng bước, tính từ ngày bắt đầu dự án. */
export function luyKeNgay(
  buoc: readonly { han: string | null; ngayHoanThanh: string | null; laNhom: boolean; laNhap: boolean }[],
  batDau: string,
): LuyKeBuoc[] {
  return buoc.map((b) => {
    if (b.laNhom || b.laNhap || !b.han) return { keHoach: null, thucTe: null, chenh: null }
    const keHoach = soNgayGiua(batDau, b.han)
    const thucTe = b.ngayHoanThanh ? soNgayGiua(batDau, b.ngayHoanThanh) : null
    return { keHoach, thucTe, chenh: thucTe === null ? null : thucTe - keHoach }
  })
}

/**
 * Cộng dồn số ngày của từng NHÓM = tổng số ngày chuẩn của mọi bước con (mọi cấp), không tính
 * bước nháp và bước bỏ qua. Trả về id nhóm → số ngày.
 */
export function congDonNhom(
  buoc: readonly {
    id: string
    chaId: string | null
    laNhom: boolean
    laNhap: boolean
    boQua: boolean
    soNgay: number
  }[],
): Map<string, number> {
  const cha = new Map(buoc.map((b) => [b.id, b.chaId]))
  const tong = new Map<string, number>(buoc.filter((b) => b.laNhom).map((b) => [b.id, 0]))
  for (const b of buoc) {
    if (b.laNhom || b.laNhap || b.boQua) continue
    // Đi ngược lên các nhóm tổ tiên; chặn vòng lặp nếu dữ liệu cha–con hỏng.
    let p = b.chaId
    for (let sau = 0; p && sau < 20; sau++) {
      if (tong.has(p)) tong.set(p, tong.get(p)! + b.soNgay)
      p = cha.get(p) ?? null
    }
  }
  return tong
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

/** Nhóm nguyên nhân vướng mắc — để gom và so giữa các dự án. */
export const NHOM_NGUYEN_NHAN = {
  'phap-ly': 'Cơ chế, chính sách, pháp lý',
  'thu-tuc': 'Thủ tục, thẩm định, phê duyệt',
  von: 'Vốn, kinh phí, giải ngân',
  'mat-bang': 'Mặt bằng, địa điểm, hạ tầng',
  'nha-thau': 'Năng lực nhà thầu, tư vấn',
  'phoi-hop': 'Phối hợp giữa các đơn vị',
  'ky-thuat': 'Kỹ thuật, công nghệ, thiết kế',
  'nhan-luc': 'Nhân lực, tổ chức thực hiện',
  'khach-quan': 'Khách quan (thiên tai, thị trường…)',
  khac: 'Khác',
} as const
export type NhomNguyenNhan = keyof typeof NHOM_NGUYEN_NHAN

export const MUC_DO_VUONG_MAC = { thap: 'Thấp', 'trung-binh': 'Trung bình', cao: 'Cao' } as const
export type MucDoVuongMac = keyof typeof MUC_DO_VUONG_MAC

export interface VuongMacDuAn {
  id: string
  buocId: string | null
  noiDung: string
  ngayNeu: string
  ngayGiaiQuyet: string | null
  ketQua: string | null
  nguoiNeu: string | null
  // ── Phân tích nguyên nhân và giải pháp ──
  /** null: chưa phân tích. */
  nhomNguyenNhan: NhomNguyenNhan | null
  nguyenNhan: string | null
  giaiPhap: string | null
  /** Đơn vị / người chịu trách nhiệm xử lý. */
  donViXuLy: string | null
  /** Hạn xử lý theo giải pháp. */
  hanXuLy: string | null
  mucDo: MucDoVuongMac
}

export interface PhanTichVuongMac {
  tong: number
  dangMo: number
  daGiaiQuyet: number
  /** Đang mở và đã quá hạn xử lý. */
  quaHanXuLy: number
  /** Đang mở mà chưa có nguyên nhân hoặc giải pháp. */
  chuaPhanTich: number
  /** Số ngày xử lý bình quân của các vướng mắc đã giải quyết; null: chưa có. */
  ngayXuLyBinhQuan: number | null
  /** Theo nhóm nguyên nhân, nhiều nhất trước. */
  theoNhom: { nhom: NhomNguyenNhan | null; ten: string; tong: number; dangMo: number }[]
}

/** Tổng hợp vướng mắc theo nguyên nhân — dùng cho một dự án hoặc gom nhiều dự án. */
export function phanTichVuongMac(ds: readonly VuongMacDuAn[], hn: string): PhanTichVuongMac {
  const mo = ds.filter((v) => !v.ngayGiaiQuyet)
  const xong = ds.filter((v) => v.ngayGiaiQuyet)
  const nhom = new Map<NhomNguyenNhan | null, { tong: number; dangMo: number }>()
  for (const v of ds) {
    const d = nhom.get(v.nhomNguyenNhan) ?? { tong: 0, dangMo: 0 }
    d.tong++
    if (!v.ngayGiaiQuyet) d.dangMo++
    nhom.set(v.nhomNguyenNhan, d)
  }
  const ngay = xong.map((v) => Math.max(0, soNgayGiua(v.ngayNeu, v.ngayGiaiQuyet!)))
  return {
    tong: ds.length,
    dangMo: mo.length,
    daGiaiQuyet: xong.length,
    quaHanXuLy: mo.filter((v) => v.hanXuLy && v.hanXuLy < hn).length,
    chuaPhanTich: mo.filter((v) => !v.nguyenNhan?.trim() || !v.giaiPhap?.trim()).length,
    ngayXuLyBinhQuan: ngay.length ? Math.round(ngay.reduce((a, b) => a + b, 0) / ngay.length) : null,
    theoNhom: [...nhom.entries()]
      .map(([k, d]) => ({ nhom: k, ten: k ? NHOM_NGUYEN_NHAN[k] : 'Chưa phân loại', ...d }))
      .sort((a, b) => b.tong - a.tong || a.ten.localeCompare(b.ten, 'vi')),
  }
}

// ── Xin gia hạn bước ────────────────────────────────────────────────────────

/** Một yêu cầu xin lùi hạn một bước, đi qua luồng phê duyệt (Tầng 2 › Luồng phê duyệt). */
export interface YeuCauGiaHan {
  id: string
  buocId: string
  /** Hạn của bước lúc gửi yêu cầu. */
  hanCu: string | null
  hanMoi: string
  lyDo: string
  canCu: string | null
  trangThai: TrangThaiYeuCau
  nguoiXinId: string
  nguoiXinTen: string | null
  ngayXin: string
  /** Các cấp duyệt chụp lại lúc gửi — sửa luồng sau đó không đổi yêu cầu đang chạy. */
  cacCap: CapDuyet[]
  /** Cấp đang chờ (từ 1); null khi đã kết thúc. */
  capHienTai: number | null
  daQua: BuocDuyetDaQua[]
  /** Người đang xem có được ra quyết định ở cấp hiện tại không. */
  duocDuyet: boolean
  /** Người đang xem có được rút yêu cầu không (người gửi, khi còn chờ duyệt). */
  duocRut: boolean
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

/** Một đợt đôn đốc — cùng một lần gửi cho nhiều dự án. */
export interface DotDonDoc {
  dot: string
  ngay: string
  noiDung: string
  nguoiGui: string | null
  duAn: { id: string; ma: string; ten: string }[]
}

// ── KPI dự án (PMS: services/kpi.js — giữ nguyên công thức) ─────────────────

export type XepLoai = 'A' | 'B' | 'C' | 'D'

export interface KpiDuAn {
  diem: number
  xepLoai: XepLoai
  /** % bước xong đúng hạn trên (bước đã xong + bước đang trễ). */
  dungHan: number
  /** Số ngày trễ bình quân (bước xong muộn + bước đang trễ). */
  treBinhQuan: number
  /** Số lần điều chỉnh kế hoạch = số phiên bản − 1. */
  dieuChinh: number
  /** % giải ngân so với kế hoạch vốn tới nay (100 nếu chưa có kế hoạch). */
  giaiNgan: number
}

/**
 * KPI 100 điểm: đúng hạn 40 · độ trễ 25 · điều chỉnh kế hoạch 15 · giải ngân 20.
 * A ≥ 85 · B ≥ 70 · C ≥ 50 · D còn lại.
 */
export function tinhKpi(
  buoc: readonly BuocTrangThai[],
  soPhienBan: number,
  daGiaiNgan: number,
  keHoachDenNay: number,
  hn: string,
): KpiDuAn {
  const that = buoc.filter(tinhTienDo)
  const xong = that.filter((b) => b.ngayHoanThanh)
  const dangTre = that.filter((b) => !b.ngayHoanThanh && b.han && b.han < hn)
  const dungHan = xong.filter((b) => !b.han || b.ngayHoanThanh! <= b.han).length
  const r1 = xong.length + dangTre.length ? dungHan / (xong.length + dangTre.length) : 1
  const tre = [
    ...xong.filter((b) => b.han && b.ngayHoanThanh! > b.han).map((b) => soNgayGiua(b.han!, b.ngayHoanThanh!)),
    ...dangTre.map((b) => soNgayGiua(b.han!, hn)),
  ]
  const treBinhQuan = tre.length ? tre.reduce((a, b) => a + b, 0) / tre.length : 0
  const r2 = Math.max(0, 1 - treBinhQuan / 30)
  const dieuChinh = Math.max(0, soPhienBan - 1)
  const r3 = Math.max(0, 1 - 0.25 * dieuChinh)
  const r4 = keHoachDenNay > 0 ? Math.min(1, daGiaiNgan / keHoachDenNay) : 1
  const diem = Math.round(40 * r1 + 25 * r2 + 15 * r3 + 20 * r4)
  return {
    diem,
    xepLoai: diem >= 85 ? 'A' : diem >= 70 ? 'B' : diem >= 50 ? 'C' : 'D',
    dungHan: Math.round(r1 * 100),
    treBinhQuan: Math.round(treBinhQuan),
    dieuChinh,
    giaiNgan: Math.round(r4 * 100),
  }
}

// ── Nhập dự án từ Excel ─────────────────────────────────────────────────────

/** Một dòng của tệp nhập sau khi kiểm. `loi` rỗng = dòng hợp lệ. */
export interface DongNhapDuAn {
  /** Số hàng trong Excel (để người dùng tìm lại). */
  hang: number
  ten: string
  chuDauTu: string
  quyTrinh: string
  loi: string[]
}

export interface KetQuaNhapDuAn {
  dong: DongNhapDuAn[]
  soHopLe: number
  soLoi: number
}

/** Tối đa số dòng một lần nhập — nhập nhiều hơn thì chia tệp. */
export const SO_DONG_NHAP_TOI_DA = 500

// ── Quản lý danh mục, quy trình mẫu ─────────────────────────────────────────

/** Loại danh mục → module quản lý (mã quyền). Nguồn vốn chỉ Dự án dùng → tham số của Tầng 2. */
export const QUYEN_DANH_MUC: Record<GiaTriDanhMuc['loai'], string> = {
  'linh-vuc': 'DM_NGHIEP_VU',
  'loai-van-ban': 'DM_NGHIEP_VU',
  'nguon-von': 'QT_KHAI_BAO',
}

export interface DongDanhMucQuanLy extends GiaTriDanhMuc {
  thuTu: number
  /** Số chỗ đang dùng trên TOÀN hệ thống — > 0 thì không xóa được. */
  soDung: number
}

export interface DanhMucQuanLy {
  /** Người xem sửa được không: có quyền VÀ ở đơn vị gốc (danh mục dùng chung toàn hệ thống). */
  suaDuoc: boolean
  ds: DongDanhMucQuanLy[]
}

export interface QuyTrinhMauChiTiet extends QuyTrinhMauDong {
  buoc: BuocMau[]
  /** Số dự án đang theo quy trình này. */
  soDung: number
  suaDuoc: boolean
}

/** Mã quy trình / mã danh mục: chữ thường không dấu, số, gạch nối. */
export const MA_DANH_MUC = /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/
