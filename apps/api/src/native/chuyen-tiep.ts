/**
 * CỔNG CHUYỂN TIẾP sang FOXAI Native (ADR-0009, "Công cụ xử lý ở Native"). Mẫu văn bản,
 * soạn thảo, phân công, đơn vị nhận việc, NHIỆM VỤ và danh bạ là dữ liệu / công cụ CỦA
 * Native — GDOS không chép, chỉ đứng giữa:
 *
 *   - chỉ đường dẫn trong DANH SÁCH CHO PHÉP; mỗi đường dẫn gắn quyền GDOS;
 *   - gọi Native bằng token của CHÍNH người dùng (liên kết tài khoản Native);
 *   - trình duyệt không bao giờ thấy token hay địa chỉ Native.
 */

/** Dịch vụ phía Native: `/api/document/*` (Document Service) và `/api/directory/*` (danh bạ). */
export const DICH_VU_NATIVE = ['document', 'directory'] as const
export type DichVuNative = (typeof DICH_VU_NATIVE)[number]

export interface LuatChuyenTiep {
  dichVu: DichVuNative
  phuongThuc: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Khớp phần đường dẫn SAU `/api/<dịch vụ>`. */
  mau: RegExp
  /** Có MỘT trong các quyền này là được. */
  quyen: readonly string[]
}

/** Mã bản ghi của Native (UUID). Chặt để không lọt `..` hay đường dẫn lạ sang Native. */
const ID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
const re = (s: string) => new RegExp(`^${s}$`)

type PT = LuatChuyenTiep['phuongThuc']
const vb = (phuongThuc: PT, mau: string, ...hd: string[]): LuatChuyenTiep => ({
  dichVu: 'document',
  phuongThuc,
  mau: re(mau),
  quyen: hd.map((h) => `VAN_BAN.${h}`),
})
const nv = (phuongThuc: PT, mau: string, ...hd: string[]): LuatChuyenTiep => ({
  dichVu: 'document',
  phuongThuc,
  mau: re(mau),
  quyen: hd.map((h) => `NHIEM_VU.${h}`),
})

/** Danh sách cho phép — thêm công cụ Native mới là thêm dòng ở đây (kèm test). */
export const LUAT_CHUYEN_TIEP: readonly LuatChuyenTiep[] = [
  // Mẫu văn bản (04_DocumentTemplates)
  vb('GET', '/document-templates', 'READ'),
  vb('GET', `/document-templates/${ID}`, 'READ'),
  vb('POST', '/document-templates', 'CREATE'),
  vb('PATCH', `/document-templates/${ID}`, 'UPDATE'),
  vb('DELETE', `/document-templates/${ID}`, 'DELETE'),
  vb('POST', `/document-templates/${ID}/generate-preview`, 'UPDATE'),
  // Soạn thảo (05) — ra văn bản, gợi ý giá trị trường, trích chữ từ tệp
  vb('POST', '/compose(/fill|/extract-text)?', 'CREATE'),
  // Đơn vị nhận việc (02) — danh sách AI chọn khi phân công
  vb('GET', '/processing-units(/select)?', 'READ'),
  vb('POST', '/processing-units', 'UPDATE'),
  vb('PATCH', `/processing-units/${ID}`, 'UPDATE'),
  vb('DELETE', `/processing-units/${ID}`, 'UPDATE'),
  // Phân công nhiệm vụ từ văn bản (03)
  vb('GET', '/task-assignments/flat', 'READ'),
  vb('GET', `/task-assignments/(by-summarization|jobs)/${ID}`, 'READ'),
  vb('GET', `/task-assignments/${ID}/attachment`, 'READ'),
  vb('POST', '/task-assignments(/assign-from-file)?', 'ASSIGN'),
  vb('POST', `/task-assignments/assign/${ID}`, 'ASSIGN'),
  vb('PATCH', `/task-assignments/${ID}(/status)?`, 'ASSIGN'),
  vb('DELETE', `/task-assignments/${ID}`, 'ASSIGN'),

  // ── Nhiệm vụ (cây việc nhiều cấp `/tasks`) ──
  // Xem, báo tiến độ, gửi ý kiến, đổi trạng thái: ai thấy được việc (READ) đều làm được —
  // Native tự kiểm người đó có tham gia việc ấy không.
  nv('GET', '/tasks(/dashboard|/notifications)?', 'READ'),
  nv('POST', '/tasks/notifications/read', 'READ'),
  nv('GET', `/tasks/${ID}(/attachment|/activities)?`, 'READ'),
  nv('GET', `/tasks/${ID}/activities/${ID}/attachment`, 'READ'),
  nv('POST', `/tasks/${ID}/activities`, 'READ'),
  nv('PATCH', `/tasks/${ID}/status`, 'READ'),
  // Giao việc, phân rã, đổi người thực hiện: Lãnh đạo (ASSIGN) hoặc Chuyên viên (CREATE).
  nv('POST', '/tasks', 'ASSIGN', 'CREATE'),
  nv('POST', `/tasks/${ID}/(children|decompose/suggest)`, 'ASSIGN', 'CREATE'),
  nv('PUT', `/tasks/${ID}/participants`, 'ASSIGN', 'UPDATE'),
  nv('PATCH', `/tasks/${ID}`, 'ASSIGN', 'UPDATE'),
  nv('DELETE', `/tasks/${ID}`, 'ASSIGN', 'DELETE'),

  // ── Danh bạ Native — chọn người / đơn vị khi giao việc ──
  { dichVu: 'directory', phuongThuc: 'GET', mau: re('/(users|organizations)'), quyen: ['NHIEM_VU.READ'] },
]

/** Các quyền GDOS (có một là đủ) cho một lời gọi; null = không nằm trong danh sách cho phép. */
export function quyenCanCho(
  dichVu: DichVuNative,
  phuongThuc: string,
  duongDan: string,
): readonly string[] | null {
  const l = LUAT_CHUYEN_TIEP.find(
    (x) => x.dichVu === dichVu && x.phuongThuc === phuongThuc && x.mau.test(duongDan),
  )
  return l ? l.quyen : null
}

/** Tham số truy vấn được chuyển tiếp — còn lại bỏ. */
const THAM_SO_CHO_PHEP = new Set([
  'page',
  'page_size',
  'pageSize',
  'search',
  'source',
  'status',
  'type',
  'task_status',
  'date_from',
  'date_to',
  'role',
  'lead_org_id',
  'limit',
])

export function locThamSo(tv: URLSearchParams): string {
  const ra = new URLSearchParams()
  for (const [k, v] of tv) if (THAM_SO_CHO_PHEP.has(k) && v.length <= 200) ra.append(k, v)
  const s = ra.toString()
  return s ? `?${s}` : ''
}

const CAU_THEO_MA: Record<number, string> = {
  400: 'Yêu cầu chưa hợp lệ.',
  403: 'Tài khoản Native không có quyền thao tác này.',
  404: 'Không tìm thấy trên FOXAI Native (có thể thuộc tài khoản Native khác).',
  409: 'Thao tác bị trùng — dữ liệu đã có.',
  413: 'Tệp quá lớn (tối đa 20 MB).',
  422: 'Dữ liệu chưa hợp lệ.',
}

/**
 * Lỗi Native (FastAPI: `{detail: string | [{msg}]}`) → câu cho người dùng. Không để
 * lọt nguyên văn lỗi hạ tầng (5xx) ra ngoài.
 */
export function thongDiepLoiNative(ma: number, than: string): string {
  if (ma >= 500) return 'FOXAI Native đang gặp sự cố — vui lòng thử lại sau.'
  try {
    const j = JSON.parse(than) as { detail?: unknown; message?: unknown }
    const d = j.detail ?? j.message
    if (typeof d === 'string' && d) return d.slice(0, 500)
    if (Array.isArray(d)) {
      const cau = d
        // FastAPI: [{msg}] · NestJS (OCR Service): ['câu lỗi', …]
        .map((x: unknown) =>
          typeof x === 'string' ? x : x && typeof x === 'object' && 'msg' in x ? String(x.msg) : '',
        )
        .filter(Boolean)
        .join('; ')
      if (cau) return `Dữ liệu chưa hợp lệ: ${cau.slice(0, 500)}`
    }
  } catch {
    // Không phải JSON.
  }
  return CAU_THEO_MA[ma] ?? `FOXAI Native trả về lỗi ${ma}.`
}
