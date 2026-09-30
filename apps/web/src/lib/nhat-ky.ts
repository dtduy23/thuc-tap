/**
 * Đọc một dòng nhật ký thành chữ cho người: đối tượng nào, trường nào đổi từ gì
 * sang gì. Dữ liệu thô (jsonb) do trigger ghi, tên cột là tên trong database.
 */
import { CHINH_SACH, DANH_SACH_MODULE, NHAN_DIEN, VAI, type MaVai, type NhatKyDong } from '@gdos/shared'
import { ngayGio } from './ngay'

const TEN_COT: Record<string, string> = {
  ten_dang_nhap: 'Tên đăng nhập',
  ho_ten: 'Họ tên',
  la_quan_tri: 'Cờ quản trị',
  native_user_id: 'Mã Native',
  trang_thai: 'Trạng thái',
  so_lan_sai: 'Số lần nhập sai',
  khoa_den: 'Khóa tạm đến',
  doi_mat_khau_luc: 'Đổi mật khẩu lúc',
  phai_doi_mat_khau: 'Phải đổi mật khẩu',
  ma: 'Mã',
  ten: 'Tên',
  cap: 'Cấp',
  vai: 'Vai',
  pham_vi: 'Phạm vi',
  deleted_at: 'Xóa lúc',
}

/**
 * Cột kỹ thuật và cột chỉ chứa mã (uuid) — không có ý nghĩa với người đọc. Đơn vị
 * đã có cột riêng trong bảng nhật ký; tài khoản của phân công đã nằm ở dòng cha.
 */
const BO_QUA = new Set(['id', 'created_at', 'updated_at', 'don_vi_id', 'tai_khoan_id', 'cha_id'])

const THOI_DIEM = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function giaTri(cot: string, v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Có' : 'Không'
  if (cot === 'vai' && typeof v === 'string' && v in VAI) return VAI[v as MaVai].ten
  if (cot === 'trang_thai' && typeof v === 'string')
    return v === 'khoa' ? 'Đã khóa' : v === 'hoat-dong' ? 'Hoạt động' : v
  if (cot === 'pham_vi' && Array.isArray(v))
    return v.map((id) => DANH_SACH_MODULE.find((m) => m.id === id)?.nhan ?? String(id)).join(', ')
  if (typeof v === 'string' && THOI_DIEM.test(v)) return ngayGio(v)
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  return JSON.stringify(v)
}

/** Cấu hình hệ thống lưu cả nhóm trong một ô jsonb — so từng tham số bên trong. */
const TEN_THAM_SO: Record<string, string> = {
  ...Object.fromEntries(Object.entries(CHINH_SACH).map(([k, d]) => [k, d.nhan])),
  ...Object.fromEntries(Object.entries(NHAN_DIEN).map(([k, d]) => [k, d.nhan])),
}
const TEN_NHOM_CAU_HINH: Record<string, string> = {
  'bao-mat': 'Đăng nhập & mật khẩu',
  'nhan-dien': 'Tên & nhận diện',
}

function thayDoiCauHinh(d: NhatKyDong): ThayDoi[] {
  const cu = (d.giaTriCu?.gia_tri ?? {}) as Record<string, unknown>
  const moi = (d.giaTriMoi?.gia_tri ?? {}) as Record<string, unknown>
  return [...new Set([...Object.keys(cu), ...Object.keys(moi)])]
    .filter((k) => JSON.stringify(cu[k]) !== JSON.stringify(moi[k]))
    .map((k) => ({ truong: TEN_THAM_SO[k] ?? k, cu: giaTri(k, cu[k]), moi: giaTri(k, moi[k]) }))
}

export interface ThayDoi {
  truong: string
  cu: string
  moi: string
}

/** Các trường đổi (sửa), hoặc các trường có giá trị (thêm mới). */
export function thayDoiCua(d: NhatKyDong): ThayDoi[] {
  if (d.bang === 'cau_hinh') return thayDoiCauHinh(d)
  const cu = d.giaTriCu ?? {}
  const moi = d.giaTriMoi ?? {}
  const kq: ThayDoi[] = []
  for (const cot of new Set([...Object.keys(cu), ...Object.keys(moi)])) {
    if (BO_QUA.has(cot)) continue
    const a = cu[cot]
    const b = moi[cot]
    if (JSON.stringify(a) === JSON.stringify(b)) continue
    if (!d.giaTriCu && (b === null || b === undefined)) continue
    kq.push({ truong: TEN_COT[cot] ?? cot, cu: giaTri(cot, a), moi: giaTri(cot, b) })
  }
  if (d.hanhDong === 'DOI_MAT_KHAU') kq.unshift({ truong: 'Mật khẩu', cu: '••••', moi: 'đã đổi' })
  return kq
}

/** Tên đối tượng bị tác động: họ tên / tên đơn vị / vai của phân công. */
/** Số hoặc chuỗi trong JSON nhật ký → chữ; kiểu khác bỏ trống. */
const chu = (v: unknown) => (typeof v === 'number' || typeof v === 'string' ? String(v) : '')

export function doiTuongCua(d: NhatKyDong): string {
  const g = d.giaTriMoi ?? d.giaTriCu ?? {}
  if (d.bang === 'cau_hinh' && typeof g.khoa === 'string') return TEN_NHOM_CAU_HINH[g.khoa] ?? g.khoa
  if (typeof g.ho_ten === 'string') return g.ho_ten
  if (typeof g.ten === 'string') return g.ten
  if (typeof g.vai === 'string') return `Vai ${giaTri('vai', g.vai)}`
  if (typeof g.tieu_de === 'string' && g.tieu_de) return g.tieu_de
  if (typeof g.ten_tep === 'string') return g.ten_tep
  if (typeof g.noi_dung === 'string')
    return g.noi_dung.length > 80 ? `${g.noi_dung.slice(0, 80)}…` : g.noi_dung
  if (d.bang === 'du_an_phien_ban' && g.so !== undefined) return `Phiên bản ${chu(g.so)}`
  if (d.bang === 'du_an_von' && g.nam !== undefined) return `Năm ${chu(g.nam)} · ${chu(g.ke_hoach)} tr.đ`
  if (d.bang === 'du_an_giai_ngan' && g.so_tien !== undefined)
    return `${typeof g.dot === 'string' && g.dot ? `${g.dot} · ` : ''}${chu(g.so_tien)} tr.đ`
  return d.banGhiId ?? '—'
}

/** Người làm: tên; hệ thống tự làm; hoặc người ở đơn vị mà người xem không thấy. */
export function nguoiLamCua(d: NhatKyDong): string {
  if (d.nguoiLam) return d.nguoiLam
  return d.taiKhoanId ? 'Tài khoản ngoài phạm vi' : 'Hệ thống'
}
