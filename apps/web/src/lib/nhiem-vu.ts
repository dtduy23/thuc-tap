/**
 * Nhiệm vụ — cây việc nhiều cấp của FOXAI Native (`/tasks`), có người tham gia theo vai,
 * dòng thời gian và thông báo; danh bạ `/directory` để chọn người, đơn vị. Gọi qua cổng
 * chuyển tiếp của GDOS (ADR-0009). Khác `/task-assignments` của màn Phân công từ văn bản.
 * Tên trường giữ `snake_case` của Native.
 */
import { queryOptions } from '@tanstack/react-query'
import { goiApi, taiLenTep, taiVeTep } from './http'

const GOC = '/native/document/tasks'
const DANH_BA = '/native/directory'

const tv = (o: object) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const KHOA_NHIEM_VU = ['nhiem-vu'] as const

export type TrangThaiNV = 'MOI_PHAN_CONG' | 'DANG_THUC_HIEN' | 'HOAN_THANH'
/** QUA_HAN tách khỏi hai nhóm chưa xong; SAP_DEN_HAN là lát cắt riêng: chưa xong, hạn trong 3 ngày. */
export type LocTrangThai = TrangThaiNV | 'QUA_HAN' | 'SAP_DEN_HAN'
export type VaiTroThamGia = 'CHU_TRI' | 'PHOI_HOP' | 'XEM_DE_BIET'
/** Vai của người đang đăng nhập: GIAO_VIEC = do họ giao, THAM_GIA = giữ vai bất kỳ. */
export type LocVaiTro = VaiTroThamGia | 'GIAO_VIEC' | 'THAM_GIA'

export interface NguoiThamGiaNhap {
  user_id: string
  user_name: string
  user_email?: string | null
  org_id?: string | null
  org_name?: string | null
  role: VaiTroThamGia
}
export interface NguoiThamGia extends NguoiThamGiaNhap {
  id: string
}

export interface NutNhiemVu {
  id: string
  parent_id: string | null
  title: string
  description: string | null
  related_document: string | null
  attachment_filename: string | null
  deadline: string | null
  status: TrangThaiNV
  is_overdue: boolean
  lead_org_id: string | null
  lead_org_name: string | null
  created_by_name: string | null
  completed_at: string | null
  /** Tiến độ tự báo 0–100; hoàn thành thì Native đặt 100. */
  progress: number
  created_at: string
  participants: NguoiThamGia[]
  child_total: number
  child_done: number
  children: NutNhiemVu[]
}

export interface CayNhiemVu {
  data: NutNhiemVu[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type LoaiHoatDong =
  'CREATED' | 'CHILD_ADDED' | 'UPDATED' | 'PARTICIPANTS_CHANGED' | 'STATUS_CHANGED' | 'PROGRESS' | 'COMMENT'

export interface HoatDong {
  id: string
  kind: LoaiHoatDong
  /** null = hệ thống tự làm (vd việc cha tự đổi trạng thái theo việc con). */
  actor_id: string | null
  actor_name: string | null
  /** Chữ người dùng gõ; với UPDATED / PARTICIPANTS_CHANGED / CHILD_ADDED là JSON. */
  content: string | null
  from_status: TrangThaiNV | null
  to_status: TrangThaiNV | null
  progress: number | null
  attachment_filename: string | null
  created_at: string
}

export interface ThongBaoNV extends HoatDong {
  task_id: string
  task_title: string
  unread: boolean
}

export interface TongQuanNV {
  total: number
  moi_phan_cong: number
  dang_thuc_hien: number
  qua_han: number
  hoan_thanh: number
  sap_den_han: number
  by_org: {
    org_name: string
    total: number
    moi_phan_cong: number
    dang_thuc_hien: number
    hoan_thanh: number
    qua_han: number
  }[]
}

export interface GoiYViecCon {
  title: string
  /** Tên AI chọn trong Đơn vị nhận việc; rỗng nếu AI không chọn được. */
  assignee_name: string
  assignee_type: 'CO_QUAN' | 'PHONG_BAN' | 'CA_NHAN' | null
  processing_unit_id: string | null
  role: 'CHU_TRI' | 'PHOI_HOP'
  deadline: string
}

export interface ViecConNhap {
  title: string
  deadline?: string | null
  lead_org_id?: string | null
  lead_org_name?: string | null
  processing_unit_id?: string | null
  participants: NguoiThamGiaNhap[]
}

export interface LocKhoang {
  date_from?: string
  date_to?: string
  role?: LocVaiTro
}
export interface LocCay extends LocKhoang {
  page: number
  page_size: number
  search?: string
  task_status?: LocTrangThai
  lead_org_id?: string
}

export interface TruongNhiemVu {
  title: string
  description: string
  deadline: string
  leadOrgId: string
  leadOrgName: string
  file: File | null
}
export interface ThamSoTao extends TruongNhiemVu {
  parentId?: string
  participants: NguoiThamGiaNhap[]
}

/* ── Gọi Native ───────────────────────────────────────────────────────────── */

export const truyVanTongQuanNV = (loc: LocKhoang) =>
  queryOptions({
    queryKey: [...KHOA_NHIEM_VU, 'tong-quan', loc],
    queryFn: () => goiApi<TongQuanNV>(`${GOC}/dashboard${tv(loc)}`),
    staleTime: 30_000,
  })
export const truyVanCayNV = (loc: LocCay) =>
  queryOptions({
    queryKey: [...KHOA_NHIEM_VU, 'cay', loc],
    queryFn: () => goiApi<CayNhiemVu>(`${GOC}${tv(loc)}`),
    staleTime: 30_000,
  })
export const truyVanNutNV = (id: string) =>
  queryOptions({
    queryKey: [...KHOA_NHIEM_VU, 'nut', id],
    queryFn: () => goiApi<NutNhiemVu>(`${GOC}/${id}`),
    staleTime: 15_000,
  })
export const truyVanHoatDong = (id: string) =>
  queryOptions({
    queryKey: [...KHOA_NHIEM_VU, 'hoat-dong', id],
    queryFn: () => goiApi<HoatDong[]>(`${GOC}/${id}/activities`),
    staleTime: 15_000,
  })
export const truyVanThongBaoNV = queryOptions({
  queryKey: [...KHOA_NHIEM_VU, 'thong-bao'],
  queryFn: () => goiApi<{ unread_count: number; items: ThongBaoNV[] }>(`${GOC}/notifications?limit=10`),
  staleTime: 30_000,
  refetchInterval: 60_000,
})

const formTruong = (ts: TruongNhiemVu): FormData => {
  const f = new FormData()
  f.append('title', ts.title)
  f.append('description', ts.description)
  if (ts.deadline) f.append('deadline', ts.deadline)
  if (ts.leadOrgId) {
    f.append('lead_org_id', ts.leadOrgId)
    f.append('lead_org_name', ts.leadOrgName)
  }
  if (ts.file) f.append('file', ts.file)
  return f
}

export const taoNhiemVu = (ts: ThamSoTao) => {
  const f = formTruong(ts)
  f.append('participants', JSON.stringify(ts.participants))
  if (ts.parentId) f.append('parent_id', ts.parentId)
  return taiLenTep<NutNhiemVu>(GOC, f)
}
export const datNguoiThamGia = (id: string, participants: NguoiThamGiaNhap[]) =>
  goiApi<NutNhiemVu>(`${GOC}/${id}/participants`, { method: 'PUT', body: { participants } })
/** Sửa trường rồi thay danh sách người — hai lời gọi của Native. */
export const suaNhiemVu = async (id: string, ts: ThamSoTao) => {
  const f = formTruong(ts)
  // Native chỉ xóa đơn vị / hạn khi được bảo rõ — bỏ trống trường là chưa đủ.
  if (!ts.leadOrgId) f.append('clear_lead_org', 'true')
  if (!ts.deadline) f.append('clear_deadline', 'true')
  await taiLenTep<NutNhiemVu>(`${GOC}/${id}`, f, 'PATCH')
  return datNguoiThamGia(id, ts.participants)
}
export const doiTrangThaiNV = (id: string, status: TrangThaiNV) =>
  goiApi<NutNhiemVu>(`${GOC}/${id}/status`, { method: 'PATCH', body: { status } })
export const xoaNhiemVu = (id: string) => goiApi<null>(`${GOC}/${id}`, { method: 'DELETE' })
/** AI đọc việc cha (kể cả tệp đính kèm) — có thể mất vài chục giây. Chưa lưu gì. */
export const goiYPhanRa = (id: string) =>
  goiApi<{ parent_id: string; used_attachment: boolean; items: GoiYViecCon[] }>(
    `${GOC}/${id}/decompose/suggest`,
    { method: 'POST' },
  )
export const taoViecCon = (id: string, children: ViecConNhap[]) =>
  goiApi<NutNhiemVu>(`${GOC}/${id}/children`, { method: 'POST', body: { children } })
export const danhDauDaDoc = () => goiApi<null>(`${GOC}/notifications/read`, { method: 'POST' })
export const themHoatDong = (
  id: string,
  ts: { kind: 'PROGRESS' | 'COMMENT'; content: string; progress?: number; file: File | null },
) => {
  const f = new FormData()
  f.append('kind', ts.kind)
  if (ts.content.trim()) f.append('content', ts.content.trim())
  if (ts.progress !== undefined) f.append('progress', String(ts.progress))
  if (ts.file) f.append('file', ts.file)
  return taiLenTep<HoatDong>(`${GOC}/${id}/activities`, f)
}
export const taiTepNhiemVu = (n: NutNhiemVu) =>
  taiVeTep(`${GOC}/${n.id}/attachment`, n.attachment_filename ?? 'tep-dinh-kem')
export const taiTepHoatDong = (taskId: string, a: HoatDong) =>
  taiVeTep(`${GOC}/${taskId}/activities/${a.id}/attachment`, a.attachment_filename ?? 'tep-dinh-kem')

/* ── Danh bạ Native ───────────────────────────────────────────────────────── */

export interface NguoiDanhBa {
  id: string
  fullName: string
  email: string
  organizationIds: string[]
}
export interface DonViDanhBa {
  id: string
  name: string
}
interface TrangDanhBa<T> {
  items: T[]
}

export const truyVanDonViDanhBa = queryOptions({
  queryKey: ['native-danh-ba', 'don-vi'],
  queryFn: async () =>
    (await goiApi<TrangDanhBa<DonViDanhBa>>(`${DANH_BA}/organizations?pageSize=100`)).items,
  staleTime: 600_000,
})
export const timNguoiDanhBa = async (tuKhoa: string) =>
  (
    await goiApi<TrangDanhBa<NguoiDanhBa>>(
      `${DANH_BA}/users${tv({ search: tuKhoa || undefined, pageSize: 20 })}`,
    )
  ).items
export const truyVanNguoiDanhBa = (tuKhoa: string) =>
  queryOptions({
    queryKey: ['native-danh-ba', 'nguoi', tuKhoa],
    queryFn: () => timNguoiDanhBa(tuKhoa),
    staleTime: 300_000,
  })

export function thanhNguoiThamGia(
  u: NguoiDanhBa,
  donVi: readonly DonViDanhBa[],
  role: VaiTroThamGia,
): NguoiThamGiaNhap {
  const dv = donVi.find((o) => u.organizationIds.includes(o.id))
  return {
    user_id: u.id,
    user_name: u.fullName,
    user_email: u.email,
    org_id: dv?.id ?? null,
    org_name: dv?.name ?? null,
    role,
  }
}

/* ── Nhãn, màu, tiện ích ──────────────────────────────────────────────────── */

export const TRANG_THAI_NV: TrangThaiNV[] = ['MOI_PHAN_CONG', 'DANG_THUC_HIEN', 'HOAN_THANH']
export const LOC_TRANG_THAI: LocTrangThai[] = [
  'MOI_PHAN_CONG',
  'DANG_THUC_HIEN',
  'SAP_DEN_HAN',
  'QUA_HAN',
  'HOAN_THANH',
]
export const VAI_TRO: VaiTroThamGia[] = ['CHU_TRI', 'PHOI_HOP', 'XEM_DE_BIET']
export const NHAN_TRANG_THAI: Record<LocTrangThai, string> = {
  MOI_PHAN_CONG: 'Chưa bắt đầu',
  DANG_THUC_HIEN: 'Đang thực hiện',
  HOAN_THANH: 'Hoàn thành',
  QUA_HAN: 'Quá hạn',
  SAP_DEN_HAN: 'Sắp đến hạn',
}
export const NHAN_VAI_TRO: Record<VaiTroThamGia, string> = {
  CHU_TRI: 'Chủ trì',
  PHOI_HOP: 'Phối hợp',
  XEM_DE_BIET: 'Xem để biết',
}
/** Lớp token cho mỗi trạng thái: `nhan` = nền nhạt + chữ, `cham` = chấm / đoạn thanh. */
export const SAC_THAI: Record<LocTrangThai, { nhan: string; cham: string }> = {
  MOI_PHAN_CONG: { nhan: 'bg-tint-brand text-brand', cham: 'bg-brand' },
  DANG_THUC_HIEN: { nhan: 'bg-tint-tim text-tim', cham: 'bg-tim' },
  SAP_DEN_HAN: { nhan: 'bg-tint-warn text-warn', cham: 'bg-warn' },
  QUA_HAN: { nhan: 'bg-tint-danger text-danger', cham: 'bg-danger' },
  HOAN_THANH: { nhan: 'bg-tint-ok text-ok', cham: 'bg-ok' },
}
export const SO_NGAY_SAP_HAN = 3
export const TEP_TOI_DA = 20 * 1024 * 1024

export const trangThaiHien = (n: Pick<NutNhiemVu, 'status' | 'is_overdue'>): LocTrangThai =>
  n.is_overdue ? 'QUA_HAN' : n.status
export const phanTram = (phan: number, tong: number) => (tong > 0 ? Math.round((phan / tong) * 100) : 0)

export function chuDau(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  return ((tu[0]?.[0] ?? '?') + (tu.length > 1 ? (tu[tu.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

export type LoaiHan = 'qua' | 'hom-nay' | 'sap' | 'con' | 'xong' | 'khong'
/** So theo ngày lịch địa phương — "hôm nay" là cả ngày hôm nay. */
export function thongTinHan(
  n: Pick<NutNhiemVu, 'deadline' | 'status'>,
  nay = new Date(),
): { loai: LoaiHan; ngay: number } {
  if (!n.deadline) return { loai: 'khong', ngay: 0 }
  if (n.status === 'HOAN_THANH') return { loai: 'xong', ngay: 0 }
  const [y, m, d] = n.deadline.slice(0, 10).split('-').map(Number)
  const han = Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)
  const homNay = Date.UTC(nay.getFullYear(), nay.getMonth(), nay.getDate())
  const ngay = Math.round((han - homNay) / 86_400_000)
  if (ngay < 0) return { loai: 'qua', ngay: -ngay }
  if (ngay === 0) return { loai: 'hom-nay', ngay }
  return { loai: ngay <= SO_NGAY_SAP_HAN ? 'sap' : 'con', ngay }
}

export const ngayVN = (ymd: string | null | undefined) =>
  ymd ? ymd.slice(0, 10).split('-').reverse().join('/') : ''
export const ngayGio = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : ''
/** YYYY-MM-DD theo giờ máy — toISOString() lệch ngày ở múi giờ +7 trước 7 giờ sáng. */
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const demViecCon = (n: NutNhiemVu): number => n.children.reduce((s, c) => s + 1 + demViecCon(c), 0)

export function timNut(
  ds: readonly NutNhiemVu[],
  id: string,
  cha: NutNhiemVu | null = null,
): { nut: NutNhiemVu; cha: NutNhiemVu | null } | null {
  for (const n of ds) {
    if (n.id === id) return { nut: n, cha }
    const thay = timNut(n.children, id, n)
    if (thay) return thay
  }
  return null
}

export function docJson<T>(tho: string | null): T | null {
  if (!tho) return null
  try {
    return JSON.parse(tho) as T
  } catch {
    // Dữ liệu cũ hoặc hỏng — vẫn hiện dòng hoạt động, chỉ thiếu chi tiết.
    return null
  }
}

const NHAN_TRUONG: Record<string, string> = {
  title: 'nội dung',
  description: 'mô tả',
  deadline: 'hạn xử lý',
  related_document: 'văn bản liên quan',
  lead_org: 'đơn vị chủ trì',
  attachment: 'tệp đính kèm',
}

/** Câu tóm tắt đứng sau tên người làm trong dòng thời gian. */
export function tomTatHoatDong(a: HoatDong): string {
  const tt = (s: TrangThaiNV | null) => (s ? NHAN_TRANG_THAI[s] : '')
  switch (a.kind) {
    case 'STATUS_CHANGED':
      return a.actor_id
        ? `đã chuyển trạng thái ${tt(a.from_status)} → ${tt(a.to_status)}`
        : `tự chuyển trạng thái ${tt(a.from_status)} → ${tt(a.to_status)} theo các việc con`
    case 'PROGRESS':
      return `đã cập nhật tiến độ ${a.progress ?? 0}%`
    case 'CHILD_ADDED':
      return `đã giao nhiệm vụ con “${docJson<{ title: string }>(a.content)?.title ?? ''}”`
    case 'UPDATED':
      return `đã sửa ${(docJson<{ fields: string[] }>(a.content)?.fields ?? []).map((f) => NHAN_TRUONG[f] ?? f).join(', ')}`
    case 'CREATED':
      return 'đã giao nhiệm vụ'
    case 'PARTICIPANTS_CHANGED':
      return 'đã thay đổi người thực hiện'
    case 'COMMENT':
      return 'đã gửi ý kiến'
  }
}
