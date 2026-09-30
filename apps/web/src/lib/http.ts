/**
 * Lớp gọi API DUY NHẤT của web.
 *
 * - Đường dẫn TƯƠNG ĐỐI `/api/...` — cùng tên miền, cookie tự đi kèm, không CORS.
 * - Request GHI tự gắn header chống giả mạo (API từ chối nếu thiếu).
 * - Gặp 401 thì làm mới phiên ĐÚNG MỘT LẦN rồi gọi lại. Nhiều request cùng hết
 *   hạn một lúc thì dùng chung một lần làm mới — không bắn N lần, vì token làm
 *   mới xoay vòng: lần thứ hai sẽ bị coi là dùng lại token cũ.
 */
import { HEADER_CHONG_GIA_MAO } from '@gdos/shared'

export class LoiApi extends Error {
  constructor(
    readonly ma: number,
    thongDiep: string,
  ) {
    super(thongDiep)
    this.name = 'LoiApi'
  }
}

/** Mã 0: không tới được máy chủ (fetch ném trước khi có phản hồi). */
export const MA_MAT_KET_NOI = 0

/** Các đường dẫn này KHÔNG tự làm mới khi 401 — chính chúng là việc đăng nhập. */
const KHONG_TU_LAM_MOI = new Set(['/xac-thuc/dang-nhap', '/xac-thuc/lam-moi', '/xac-thuc/dang-xuat'])

const CAU_MAC_DINH: Record<number, string> = {
  400: 'Dữ liệu gửi lên chưa hợp lệ.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Tài khoản không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu được yêu cầu.',
  423: 'Tài khoản đang tạm khóa.',
  // Máy chủ đang khởi động lại, đang cập nhật, hoặc quá tải — người dùng chỉ cần chờ.
  502: 'Máy chủ chưa sẵn sàng. Vui lòng thử lại sau ít phút.',
  503: 'Máy chủ chưa sẵn sàng. Vui lòng thử lại sau ít phút.',
  504: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
}

/** NestJS trả `{ message: string | string[] }` — lấy câu đầu tiên. */
async function docThongDiep(res: Response): Promise<string> {
  try {
    const than = (await res.json()) as { message?: unknown }
    const m = than.message
    if (typeof m === 'string' && m) return m
    if (Array.isArray(m) && typeof m[0] === 'string') return m[0]
  } catch {
    // Thân rỗng hoặc không phải JSON (proxy trả trang lỗi) — dùng câu mặc định.
  }
  return CAU_MAC_DINH[res.status] ?? `Máy chủ trả về lỗi ${res.status}.`
}

let dangLamMoi: Promise<boolean> | null = null

function lamMoiPhien(goi: typeof fetch): Promise<boolean> {
  dangLamMoi ??= goi('/api/xac-thuc/lam-moi', { method: 'POST', headers: { [HEADER_CHONG_GIA_MAO]: '1' } })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      dangLamMoi = null
    })
  return dangLamMoi
}

export interface TuyChon {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Cho test thay fetch. */
  goi?: typeof fetch
}

export async function goiApi<T>(duongDan: string, tc: TuyChon = {}, daThuLai = false): Promise<T> {
  const { method = 'GET', body, goi = fetch } = tc
  const headers: Record<string, string> = {}
  if (method !== 'GET') headers[HEADER_CHONG_GIA_MAO] = '1'
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await goi(`/api${duongDan}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new LoiApi(MA_MAT_KET_NOI, 'Không kết nối được máy chủ. Kiểm tra đường truyền rồi thử lại.')
  }

  if (res.status === 401 && !daThuLai && !KHONG_TU_LAM_MOI.has(duongDan)) {
    if (await lamMoiPhien(goi)) return goiApi<T>(duongDan, tc, true)
  }
  if (!res.ok) throw new LoiApi(res.status, await docThongDiep(res))
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/**
 * Làm mới phiên NGAY — dùng khi phạm vi của chính mình vừa đổi (vd vừa tạo đơn
 * vị mới: vé đang cầm chưa có đơn vị đó). Dùng chung khóa với lần làm mới tự động.
 */
export const lamMoiPhienNgay = () => lamMoiPhien(fetch)

/**
 * Tải tệp lên (multipart). Cùng luật với goiApi: header chống giả mạo, hết phiên
 * thì làm mới đúng một lần rồi gửi lại. Không đặt Content-Type — trình duyệt tự
 * thêm ranh giới multipart.
 */
export async function taiLenTep<T>(duongDan: string, du: FormData, daThuLai = false): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${duongDan}`, {
      method: 'POST',
      headers: { [HEADER_CHONG_GIA_MAO]: '1' },
      body: du,
    })
  } catch {
    throw new LoiApi(MA_MAT_KET_NOI, 'Không kết nối được máy chủ. Kiểm tra đường truyền rồi thử lại.')
  }
  if (res.status === 401 && !daThuLai && (await lamMoiPhien(fetch))) return taiLenTep<T>(duongDan, du, true)
  if (res.status === 413) throw new LoiApi(413, 'Tệp quá lớn.')
  if (!res.ok) throw new LoiApi(res.status, await docThongDiep(res))
  return (await res.json()) as T
}
