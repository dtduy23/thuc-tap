/**
 * Lớp gọi FOXAI Native của các màn chép từ GDOS cũ (Trợ lý AI).
 *
 * Bản cũ: trình duyệt gọi THẲNG gateway Native bằng token giữ trong localStorage. Hệ thống
 * mới (ADR-0009): trình duyệt chỉ gọi máy chủ GDOS — `/api/native/<dịch vụ>/*` — máy chủ gắn
 * token Native của CHÍNH người đang đăng nhập rồi chuyển tiếp. Vì vậy ở đây không có token,
 * không có địa chỉ Native; chỉ đổi tiền tố `/api/<dịch vụ>` của bản cũ thành `/api/native/<dịch vụ>`.
 */
import { HEADER_CHONG_GIA_MAO } from '@gdos/shared'
import { lamMoiPhienNgay } from '@/lib/http'

/** Lỗi mang theo mã HTTP; `chiTiet` giữ cho mã cũ đọc (cổng chuyển tiếp chỉ trả một câu). */
export class LoiApi extends Error {
  constructor(
    readonly ma: number,
    thongDiep: string,
    readonly chiTiet: Record<string, unknown> = {},
  ) {
    super(thongDiep)
    this.name = 'LoiApi'
  }
}

export const MA_LOI_MANG = 0

export interface TuyChon {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Giữ cho mã cũ truyền vào — KHÔNG dùng: token Native nằm ở máy chủ GDOS. */
  token?: string
  loiTheoMa?: Record<number, string>
  signal?: AbortSignal
  /** Tiền tố kiểu bản cũ, vd `/api/context/v1`. */
  tienTo?: string
}

const LOI_MAC_DINH: Record<number, string> = {
  400: 'Dữ liệu gửi lên chưa hợp lệ. Kiểm tra lại các trường bắt buộc.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Tài khoản không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu được yêu cầu.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  502: 'FOXAI Native đang gặp sự cố. Vui lòng thử lại sau ít phút.',
  503: 'Chưa tới được FOXAI Native. Vui lòng thử lại sau ít phút.',
}

/** `/api/context/v1/chatbots` → `/api/native/context/v1/chatbots`. */
export const duongNative = (duong: string): string => duong.replace(/^\/api\//, '/api/native/')

async function docThongDiep(res: Response): Promise<string | null> {
  try {
    const m = ((await res.json()) as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0]
  } catch {
    // Thân rỗng hoặc không phải JSON — dùng câu mặc định theo mã.
  }
  return null
}

/**
 * fetch tới cổng chuyển tiếp: cookie phiên GDOS tự đi kèm, request ghi gắn header chống giả
 * mạo, hết phiên GDOS (401) thì làm mới đúng một lần rồi gửi lại. Dùng cho cả lời gọi thường
 * lẫn dòng sự kiện của câu trả lời.
 */
export async function goiNative(
  duong: string,
  tc: Pick<TuyChon, 'method' | 'body' | 'signal'> = {},
): Promise<Response> {
  const { method = 'GET', body, signal } = tc
  const laForm = body instanceof FormData
  const gui = () =>
    fetch(duongNative(duong), {
      method,
      signal,
      headers: {
        ...(method === 'GET' ? {} : { [HEADER_CHONG_GIA_MAO]: '1' }),
        ...(body === undefined || laForm ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : laForm ? body : JSON.stringify(body),
    })
  const res = await gui()
  if (res.status === 401 && (await lamMoiPhienNgay())) return gui()
  return res
}

/** Gọi và trả thân đã parse; 204 hoặc thân rỗng trả `null` (như bản cũ). */
export async function goiApi<T>(duongDan: string, tuyChon: TuyChon = {}): Promise<T | null> {
  const { loiTheoMa, tienTo = '/api', ...con } = tuyChon
  let res: Response
  try {
    res = await goiNative(`${tienTo}${duongDan}`, con)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new LoiApi(MA_LOI_MANG, 'Không kết nối được máy chủ. Kiểm tra đường truyền rồi thử lại.')
  }
  if (!res.ok) {
    throw new LoiApi(
      res.status,
      loiTheoMa?.[res.status] ??
        (await docThongDiep(res)) ??
        LOI_MAC_DINH[res.status] ??
        `Máy chủ trả về lỗi ${res.status}.`,
    )
  }
  if (res.status === 204) return null
  const text = await res.text()
  return text === '' ? null : (JSON.parse(text) as T)
}
