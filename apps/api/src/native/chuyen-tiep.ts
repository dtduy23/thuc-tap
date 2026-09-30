/**
 * CỔNG CHUYỂN TIẾP sang Document Service của FOXAI Native (ADR-0009, "Công cụ xử lý
 * ở Native"). Mẫu văn bản, soạn thảo, phân công nhiệm vụ, đơn vị nhận việc là dữ liệu /
 * công cụ CỦA Native — GDOS không chép, chỉ đứng giữa:
 *
 *   - chỉ đường dẫn trong DANH SÁCH CHO PHÉP; mỗi đường dẫn gắn một quyền GDOS;
 *   - gọi Native bằng token của CHÍNH người dùng (liên kết tài khoản Native);
 *   - trình duyệt không bao giờ thấy token hay địa chỉ Native.
 */
import type { HanhDong } from '@gdos/shared'

export interface LuatChuyenTiep {
  phuongThuc: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** Khớp phần đường dẫn SAU `/api/document`. */
  mau: RegExp
  hanhDong: HanhDong
}

/** Mã bản ghi của Native (UUID). Chặt để không lọt `..` hay đường dẫn lạ sang Native. */
const ID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
const re = (s: string) => new RegExp(`^${s}$`)

/** Danh sách cho phép — thêm công cụ Native mới là thêm dòng ở đây (kèm test). */
export const LUAT_CHUYEN_TIEP: readonly LuatChuyenTiep[] = [
  // Mẫu văn bản (04_DocumentTemplates)
  { phuongThuc: 'GET', mau: re('/document-templates'), hanhDong: 'READ' },
  { phuongThuc: 'GET', mau: re(`/document-templates/${ID}`), hanhDong: 'READ' },
  { phuongThuc: 'POST', mau: re('/document-templates'), hanhDong: 'CREATE' },
  { phuongThuc: 'PATCH', mau: re(`/document-templates/${ID}`), hanhDong: 'UPDATE' },
  { phuongThuc: 'DELETE', mau: re(`/document-templates/${ID}`), hanhDong: 'DELETE' },
  { phuongThuc: 'POST', mau: re(`/document-templates/${ID}/generate-preview`), hanhDong: 'UPDATE' },
  // Soạn thảo (05) — ra văn bản, gợi ý giá trị trường, trích chữ từ tệp
  { phuongThuc: 'POST', mau: re('/compose(/fill|/extract-text)?'), hanhDong: 'CREATE' },
  // Đơn vị nhận việc (02) — danh sách AI chọn khi phân công
  { phuongThuc: 'GET', mau: re('/processing-units(/select)?'), hanhDong: 'READ' },
  { phuongThuc: 'POST', mau: re('/processing-units'), hanhDong: 'UPDATE' },
  { phuongThuc: 'PATCH', mau: re(`/processing-units/${ID}`), hanhDong: 'UPDATE' },
  { phuongThuc: 'DELETE', mau: re(`/processing-units/${ID}`), hanhDong: 'UPDATE' },
  // Phân công nhiệm vụ từ văn bản (03)
  { phuongThuc: 'GET', mau: re('/task-assignments/flat'), hanhDong: 'READ' },
  { phuongThuc: 'GET', mau: re(`/task-assignments/(by-summarization|jobs)/${ID}`), hanhDong: 'READ' },
  { phuongThuc: 'GET', mau: re(`/task-assignments/${ID}/attachment`), hanhDong: 'READ' },
  { phuongThuc: 'POST', mau: re('/task-assignments(/assign-from-file)?'), hanhDong: 'ASSIGN' },
  { phuongThuc: 'POST', mau: re(`/task-assignments/assign/${ID}`), hanhDong: 'ASSIGN' },
  { phuongThuc: 'PATCH', mau: re(`/task-assignments/${ID}(/status)?`), hanhDong: 'ASSIGN' },
  { phuongThuc: 'DELETE', mau: re(`/task-assignments/${ID}`), hanhDong: 'ASSIGN' },
]

/** Quyền GDOS cần cho một lời gọi; null = không nằm trong danh sách cho phép. */
export function quyenCanCho(phuongThuc: string, duongDan: string): string | null {
  const l = LUAT_CHUYEN_TIEP.find((x) => x.phuongThuc === phuongThuc && x.mau.test(duongDan))
  return l ? `VAN_BAN.${l.hanhDong}` : null
}

/** Tham số truy vấn được chuyển tiếp — còn lại bỏ. */
const THAM_SO_CHO_PHEP = new Set(['page', 'page_size', 'search', 'source', 'status', 'type', 'task_status'])

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
        .map((x: unknown) => (x && typeof x === 'object' && 'msg' in x ? String(x.msg) : ''))
        .filter(Boolean)
        .join('; ')
      if (cau) return `Dữ liệu chưa hợp lệ: ${cau.slice(0, 500)}`
    }
  } catch {
    // Không phải JSON.
  }
  return CAU_THEO_MA[ma] ?? `FOXAI Native trả về lỗi ${ma}.`
}
