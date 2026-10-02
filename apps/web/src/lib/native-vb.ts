/**
 * Công cụ văn bản của FOXAI Native — mẫu văn bản, soạn thảo, phân công nhiệm vụ, đơn vị
 * nhận việc. Gọi qua cổng chuyển tiếp của GDOS `/api/native/document/*` (ADR-0009):
 * GDOS kiểm quyền, gắn token Native của chính người dùng. Trường giữ `snake_case` đúng
 * như Document Service trả về — không dịch qua lại hai bộ tên.
 */
import { queryOptions } from '@tanstack/react-query'
import { goiApi, taiLenTep, taiVeTep } from './http'

const goc = '/native/document'
const tv = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const KHOA_NATIVE_VB = ['native-vb'] as const

/** Native phân trang; màn GDOS lọc/sắp tại chỗ trên lưới → lấy một lần tối đa chừng này. */
const MOT_LAN = 100

interface Trang<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** Gom mọi trang (tối đa 10 trang) — lưới GDOS lọc theo cột tại chỗ, cần đủ dữ liệu. */
async function tatCa<T, S>(duong: string, loc: Record<string, string | undefined> = {}) {
  const dau = await goiApi<Trang<T> & { stats: S }>(
    `${goc}${duong}${tv({ ...loc, page: 1, page_size: MOT_LAN })}`,
  )
  const ds = [...dau.data]
  for (let p = 2; p <= Math.min(dau.total_pages, 10); p++)
    ds.push(...(await goiApi<Trang<T>>(`${goc}${duong}${tv({ ...loc, page: p, page_size: MOT_LAN })}`)).data)
  return { stats: dau.stats, data: ds, total: dau.total }
}

/* ── Mẫu văn bản ──────────────────────────────────────────────────────────── */

export type KieuTruong = 'TEXT' | 'TEXTAREA' | 'DATE' | 'NUMBER' | 'SELECT'
export type NguonMau = 'NGHI_DINH_30' | 'TUY_CHINH'
export type TrangThaiMau = 'DANG_DUNG' | 'NGUNG_DUNG'

export interface TruongMau {
  /** snake_case không dấu — chính là `{{key}}` trong `body_template`. */
  key: string
  label: string
  type?: KieuTruong
  hint?: string | null
  required?: boolean
  ai_fill?: boolean
  options?: string[] | null
}

/** Thể thức mặc định theo Điều 8 NĐ30 — màn soạn thảo dùng để điền sẵn. */
export interface TheThucMau {
  cqch?: string | null
  cq?: string | null
  so?: string | null
  kyhieu?: string | null
  dd?: string | null
  cv?: string | null
  ky?: string | null
  noinhan?: string | null
  header_style?: string | null
}

export interface MauVanBan {
  id: string
  name: string
  symbol_code: string
  source: string
  source_label: string
  status: string
  status_label: string
  description: string | null
  structure: string[] | null
  fields: TruongMau[] | null
  body_template: string | null
  default_meta: TheThucMau | null
  compose_mode: string
  preview_content: string | null
  created_at: string
  updated_at: string
}

export interface ThongKeMau {
  total: number
  nghi_dinh_30: number
  tuy_chinh: number
  dang_dung: number
}

export interface ThamSoMau {
  name: string
  symbol_code: string
  status?: TrangThaiMau
  description?: string | null
  fields?: TruongMau[] | null
  body_template?: string | null
  default_meta?: TheThucMau | null
}

export const NHAN_NGUON_MAU: Record<NguonMau, string> = {
  NGHI_DINH_30: 'Nghị định 30',
  TUY_CHINH: 'Tùy chỉnh',
}
export const NHAN_TRANG_THAI_MAU: Record<TrangThaiMau, string> = {
  DANG_DUNG: 'Đang dùng',
  NGUNG_DUNG: 'Ngừng dùng',
}
export const NHAN_KIEU_TRUONG: Record<KieuTruong, string> = {
  TEXT: 'Văn bản',
  TEXTAREA: 'Văn bản dài',
  DATE: 'Ngày tháng',
  NUMBER: 'Số',
  SELECT: 'Lựa chọn',
}

export const truyVanMau = queryOptions({
  queryKey: [...KHOA_NATIVE_VB, 'mau'],
  queryFn: () => tatCa<MauVanBan, ThongKeMau>('/document-templates'),
})
export const truyVanChiTietMau = (id: string) =>
  queryOptions({
    queryKey: [...KHOA_NATIVE_VB, 'mau', id],
    queryFn: () => goiApi<MauVanBan>(`${goc}/document-templates/${id}`),
  })
export const taoMau = (ts: ThamSoMau) =>
  goiApi<MauVanBan>(`${goc}/document-templates`, { method: 'POST', body: ts })
/** Sửa `fields` hoặc `body_template` thì PHẢI gửi cả hai — Native thay nguyên cặp và bắt khớp nhau. */
export const suaMau = (id: string, ts: ThamSoMau) =>
  goiApi<MauVanBan>(`${goc}/document-templates/${id}`, { method: 'PATCH', body: ts })
export const xoaMau = (id: string) => goiApi<null>(`${goc}/document-templates/${id}`, { method: 'DELETE' })
export const taoXemTruocMau = (id: string) =>
  goiApi<{ id: string; preview_content: string; message: string }>(
    `${goc}/document-templates/${id}/generate-preview`,
    { method: 'POST' },
  )

/* ── Soạn thảo ────────────────────────────────────────────────────────────── */

export interface ThamSoSoanThao {
  template_id: string
  source_content?: string
  source_title?: string
  values?: Record<string, string>
  cqch?: string
  cq?: string
  so?: string
  kyhieu?: string
  dd?: string
  ky?: string
  cv?: string
  noinhan?: string
}

export interface KetQuaSoanThao {
  html: string
  template_name: string
  values: Record<string, string> | null
  /** `{{key}}` còn trống — chỉ có với mẫu điền trường. */
  missing_keys: string[] | null
}

/** Endpoint DUY NHẤT ra văn bản cuối — Native tự nhận diện theo khả năng của mẫu. */
export const soanThao = (ts: ThamSoSoanThao) =>
  goiApi<KetQuaSoanThao>(`${goc}/compose`, { method: 'POST', body: ts })

export const goiYTruong = (template_id: string, source_content: string) =>
  goiApi<{ template_name: string; values: Record<string, string>; manual_fields: string[] }>(
    `${goc}/compose/fill`,
    { method: 'POST', body: { template_id, source_content } },
  )

/** Trích chữ từ tệp (PDF scan Native tự OCR). */
export const trichChu = (du: FormData) =>
  taiLenTep<{ text: string; filename: string; char_count: number }>(`${goc}/compose/extract-text`, du)

/* ── Đơn vị nhận việc (processing units) ──────────────────────────────────── */

export type LoaiDonVi = 'CO_QUAN' | 'PHONG_BAN' | 'CA_NHAN'
export const NHAN_LOAI_DON_VI: Record<LoaiDonVi, string> = {
  CO_QUAN: 'Cơ quan',
  PHONG_BAN: 'Phòng ban',
  CA_NHAN: 'Cá nhân',
}

export interface DonViXuLy {
  id: string
  name: string
  type: string
  /** 0–10; Native mặc định 8. */
  score: number | null
  supervisor: string | null
  parent_id: string | null
  parent_name: string | null
  functions: string
  created_at: string
  updated_at: string
}

export interface DonViRutGon {
  id: string
  name: string
  type: string
}

export interface ThamSoDonVi {
  name: string
  type: LoaiDonVi
  score?: number
  supervisor?: string | null
  parent_id?: string | null
  functions: string
}

export const truyVanDonViXuLy = queryOptions({
  queryKey: [...KHOA_NATIVE_VB, 'don-vi'],
  queryFn: () => tatCa<DonViXuLy, Record<string, number>>('/processing-units'),
})
export const truyVanDonViChon = queryOptions({
  queryKey: [...KHOA_NATIVE_VB, 'don-vi', 'chon'],
  queryFn: () => goiApi<DonViRutGon[]>(`${goc}/processing-units/select`),
})
export const taoDonVi = (ts: ThamSoDonVi) =>
  goiApi<DonViXuLy>(`${goc}/processing-units`, { method: 'POST', body: ts })
export const suaDonVi = (id: string, ts: ThamSoDonVi) =>
  goiApi<DonViXuLy>(`${goc}/processing-units/${id}`, { method: 'PATCH', body: ts })
export const xoaDonVi = (id: string) => goiApi<null>(`${goc}/processing-units/${id}`, { method: 'DELETE' })

/* ── Phân công nhiệm vụ ───────────────────────────────────────────────────── */

export type TrangThaiNhiemVu = 'MOI_PHAN_CONG' | 'DANG_THUC_HIEN' | 'HOAN_THANH'
export const NHAN_TRANG_THAI_NV: Record<TrangThaiNhiemVu, string> = {
  MOI_PHAN_CONG: 'Mới phân công',
  DANG_THUC_HIEN: 'Đang thực hiện',
  HOAN_THANH: 'Hoàn thành',
}
export type UuTienGiao = 'AUTO' | 'PHONG_BAN' | 'CA_NHAN'
export const NHAN_UU_TIEN: Record<UuTienGiao, string> = {
  AUTO: 'Để AI tự chọn',
  PHONG_BAN: 'Ưu tiên phòng ban',
  CA_NHAN: 'Ưu tiên cá nhân',
}

export interface NhiemVu {
  id: string
  summarization_id: string | null
  summarization_name: string | null
  task_content: string
  deadline: string | null
  status: string
  status_label: string
  unit_id: string | null
  unit_name: string | null
  unit_type: string | null
  related_document: string | null
  attachment_filename: string | null
  created_at: string
  updated_at: string
}

export interface ThongKeNhiemVu {
  total: number
  phong_ban: number
  ca_nhan: number
  completed: number
}

export interface TienDoJob {
  job_id: string
  /** queued | in_progress | complete | failed | not_found */
  status: string
  done: boolean
  created_count: number | null
  message: string | null
}

export const truyVanNhiemVu = queryOptions({
  queryKey: [...KHOA_NATIVE_VB, 'nhiem-vu'],
  queryFn: () => tatCa<NhiemVu, ThongKeNhiemVu>('/task-assignments/flat'),
})
export const taoNhiemVu = (du: FormData) => taiLenTep<NhiemVu>(`${goc}/task-assignments`, du)
export const suaNhiemVu = (id: string, du: FormData) =>
  taiLenTep<NhiemVu>(`${goc}/task-assignments/${id}`, du, 'PATCH')
export const doiTrangThaiNhiemVu = (id: string, status: TrangThaiNhiemVu) =>
  goiApi<NhiemVu>(`${goc}/task-assignments/${id}/status`, { method: 'PATCH', body: { status } })
export const xoaNhiemVu = (id: string) => goiApi<null>(`${goc}/task-assignments/${id}`, { method: 'DELETE' })
export const taiTepNhiemVu = (nv: NhiemVu) =>
  taiVeTep(`${goc}/task-assignments/${nv.id}/attachment`, nv.attachment_filename ?? 'tep-dinh-kem')

/** AI đọc bản tóm tắt rồi giao việc. Mỗi văn bản chạy được một lần — lần sau Native trả 409. */
export const phanCongTuTomTat = (nativeId: string) =>
  goiApi<{ created_count: number; message: string; tasks: NhiemVu[] }>(
    `${goc}/task-assignments/assign/${nativeId}`,
    { method: 'POST' },
  )
export const nhiemVuCuaVanBan = (nativeId: string) =>
  queryOptions({
    queryKey: [...KHOA_NATIVE_VB, 'nhiem-vu', 'vb', nativeId],
    queryFn: () =>
      goiApi<{ summarization_name: string; total: number; tasks: NhiemVu[] }>(
        `${goc}/task-assignments/by-summarization/${nativeId}`,
      ),
  })

/** Chạy nền: trả `job_id`, hỏi `jobs/{id}` tới khi `done`. */
export const phanCongTuTep = (du: FormData) =>
  taiLenTep<{ job_id: string; status: string; message: string }>(
    `${goc}/task-assignments/assign-from-file`,
    du,
  )
export const tienDoJob = (id: string) => goiApi<TienDoJob>(`${goc}/task-assignments/jobs/${id}`)
