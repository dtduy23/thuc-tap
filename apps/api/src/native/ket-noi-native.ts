/**
 * KẾT NỐI FOXAI NATIVE (ADR-0009). Mọi nghiệp vụ gọi Native qua giao diện
 * `KetNoiNative` — không module nào tự gọi HTTP sang Native. Trình duyệt không bao
 * giờ gọi thẳng Native: máy chủ GDOS đứng giữa, giữ bí mật, ghi nhật ký.
 *
 * Ba bản cài:
 *   NativeGia       — máy dev / test (NATIVE_GIA=1): tóm tắt giả ngay tại chỗ.
 *   NativeThat      — HTTP theo đặc tả Document Service. Cách lấy token (`CapToken`)
 *                     CHƯA chọn: chờ đội Native trả lời câu hỏi mở của ADR-0003.
 *   NativeChuaNoi   — chưa cấu hình: mọi lời gọi báo "chưa kết nối" (503).
 */
import { ServiceUnavailableException } from '@nestjs/common'

export type TrangThaiNative = 'cho' | 'dang-xu-ly' | 'xong' | 'loi'

/** Người dùng GDOS đang nhờ gọi Native — Native kiểm quyền theo `nativeUserId` (ADR-0003). */
export interface NguoiGoi {
  taiKhoanId: string
  nativeUserId: string
  hoTen: string
}

export interface KetQuaTomTat {
  nativeId: string
  trangThai: TrangThaiNative
  soKyTuGoc: number | null
  soKyTuTomTat: number | null
  noiDungGoc?: string | null
  tomTat?: string | null
  moHinh?: string | null
  loi?: string | null
}

export interface TepGui {
  ten: string
  loai: string
  tenTep: string
  mime: string
  noiDung: Buffer
  tuDong: boolean
}

export interface KetNoiNative {
  readonly cheDo: 'gia' | 'that' | 'chua'
  /** Địa chỉ đang nối (null: bản giả / chưa cấu hình). */
  readonly diaChi: string | null
  readonly moTa: string
  /** Kiểm tra máy chủ Native có trả lời không — Tầng 2 › Kiểm tra & trạng thái. */
  kiemTra(): Promise<{ ok: boolean; thongDiep: string }>
  guiTomTat(tep: TepGui, ai: NguoiGoi): Promise<KetQuaTomTat>
  docTomTat(nativeId: string, ai: NguoiGoi): Promise<KetQuaTomTat>
  chayLai(nativeId: string, ai: NguoiGoi): Promise<KetQuaTomTat>
  suaTomTat(nativeId: string, tomTat: string, ai: NguoiGoi): Promise<void>
}

export const KET_NOI_NATIVE = Symbol('KET_NOI_NATIVE')

const CHUA_NOI =
  'Chưa kết nối FOXAI Native — quản trị kiểm tra ở Quản trị hệ thống › Kết nối › Dịch vụ nền tảng.'

// ── Chưa kết nối ────────────────────────────────────────────────────────────

export class NativeChuaNoi implements KetNoiNative {
  readonly cheDo = 'chua' as const
  constructor(
    readonly diaChi: string | null,
    readonly moTa: string,
  ) {}
  async kiemTra() {
    if (!this.diaChi) return { ok: false, thongDiep: 'Chưa đặt NATIVE_URL.' }
    // Có địa chỉ nhưng chưa chốt cách xác thực: vẫn thử xem máy chủ có trả lời không.
    try {
      const res = await fetch(`${this.diaChi}/api/document/summarize?page=1&page_size=1`, {
        signal: AbortSignal.timeout(8000),
      })
      return {
        ok: false,
        thongDiep: `Máy chủ Native trả lời (HTTP ${res.status}) — chưa gọi được vì chưa chốt cách xác thực (ADR-0009).`,
      }
    } catch (e) {
      return {
        ok: false,
        thongDiep: `Không tới được máy chủ Native: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }
  private khong(): Promise<never> {
    return Promise.reject(new ServiceUnavailableException(CHUA_NOI))
  }
  guiTomTat(): Promise<KetQuaTomTat> {
    return this.khong()
  }
  docTomTat(): Promise<KetQuaTomTat> {
    return this.khong()
  }
  chayLai(): Promise<KetQuaTomTat> {
    return this.khong()
  }
  suaTomTat(): Promise<void> {
    return this.khong()
  }
}

// ── Bản giả (máy dev, test) ─────────────────────────────────────────────────

const GHI_CHU_GIA = '[Bản giả — chưa nối FOXAI Native]'

/** Tóm tắt giả: ba câu đầu. Đủ để chạy thử luồng, không phải AI. */
export function tomTatGia(noiDung: string): string {
  const cau = noiDung
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim().length > 0)
  return `${GHI_CHU_GIA} ${cau.slice(0, 3).join(' ')}`.trim()
}

export class NativeGia implements KetNoiNative {
  readonly cheDo = 'gia' as const
  readonly diaChi = null
  readonly moTa = 'Bản giả trên máy dev — tóm tắt lấy ba câu đầu, không gọi AI.'
  private readonly kho = new Map<string, KetQuaTomTat & { lanDoc: number }>()
  private dem = 0

  kiemTra() {
    return Promise.resolve({ ok: true, thongDiep: 'Bản giả sẵn sàng (không có máy chủ Native thật).' })
  }

  guiTomTat(tep: TepGui): Promise<KetQuaTomTat> {
    const nativeId = `gia-${++this.dem}`
    const docDuoc = /\.(txt|md)$/i.test(tep.tenTep)
    const goc = docDuoc
      ? tep.noiDung.toString('utf8')
      : `${GHI_CHU_GIA} Bản giả không đọc được nội dung tệp ${tep.tenTep.split('.').pop()?.toUpperCase()} — khi nối Native thật, nội dung được trích tự động (kể cả PDF scan).`
    this.kho.set(nativeId, {
      nativeId,
      trangThai: 'cho',
      soKyTuGoc: goc.length,
      soKyTuTomTat: null,
      noiDungGoc: goc,
      tomTat: null,
      moHinh: null,
      loi: null,
      lanDoc: 0,
    })
    return Promise.resolve(this.ban(nativeId))
  }

  /** Lần đọc đầu sau khi gửi: "đang xử lý"; lần sau: xong — đủ để web thấy trạng thái chạy. */
  docTomTat(nativeId: string): Promise<KetQuaTomTat> {
    const v = this.kho.get(nativeId)
    if (!v) throw new ServiceUnavailableException('Native không còn bản ghi này')
    v.lanDoc++
    if (v.trangThai === 'cho') v.trangThai = 'dang-xu-ly'
    else if (v.trangThai === 'dang-xu-ly') {
      v.trangThai = 'xong'
      v.tomTat = tomTatGia(v.noiDungGoc ?? '')
      v.soKyTuTomTat = v.tomTat.length
      v.moHinh = 'ban-gia'
    }
    return Promise.resolve(this.ban(nativeId))
  }

  chayLai(nativeId: string): Promise<KetQuaTomTat> {
    const v = this.kho.get(nativeId)
    if (!v) throw new ServiceUnavailableException('Native không còn bản ghi này')
    Object.assign(v, { trangThai: 'cho', loi: null })
    return Promise.resolve(this.ban(nativeId))
  }

  suaTomTat(nativeId: string, tomTat: string): Promise<void> {
    const v = this.kho.get(nativeId)
    if (v) Object.assign(v, { tomTat, soKyTuTomTat: tomTat.length, trangThai: 'xong' })
    return Promise.resolve()
  }

  private ban(nativeId: string): KetQuaTomTat {
    const { lanDoc: _bo, ...kq } = this.kho.get(nativeId)!
    return { ...kq }
  }
}

// ── Bản thật (HTTP) ─────────────────────────────────────────────────────────

/**
 * Lấy token Bearer để gọi Native THAY MẶT một người. CHƯA có bản cài: chờ đội Native
 * chốt (tài khoản dịch vụ + native_user_id, hay đổi token theo người) — ADR-0003/0009.
 */
export interface CapToken {
  layToken(ai: NguoiGoi): Promise<string>
}

const TRANG_THAI: Record<string, TrangThaiNative> = {
  PENDING: 'cho',
  PROCESSING: 'dang-xu-ly',
  COMPLETED: 'xong',
  FAILED: 'loi',
}

interface DtoTomTat {
  id: string
  status: string
  original_char_count?: number | null
  summary_char_count?: number | null
  original_content?: string | null
  summary_content?: string | null
  llm_model?: string | null
  error_message?: string | null
}

export const tuDto = (d: DtoTomTat): KetQuaTomTat => ({
  nativeId: d.id,
  trangThai: TRANG_THAI[d.status] ?? 'loi',
  soKyTuGoc: d.original_char_count ?? null,
  soKyTuTomTat: d.summary_char_count ?? null,
  noiDungGoc: d.original_content,
  tomTat: d.summary_content,
  moHinh: d.llm_model,
  loi: d.error_message ?? (TRANG_THAI[d.status] ? null : `Trạng thái lạ từ Native: ${d.status}`),
})

/** HTTP theo foxai-gdos/docs/document-service/01_Summarize.md (qua api-gateway). */
export class NativeThat implements KetNoiNative {
  readonly cheDo = 'that' as const
  readonly moTa = 'Document Service của FOXAI Native (tóm tắt văn bản).'

  constructor(
    readonly diaChi: string,
    private readonly token: CapToken,
    private readonly goi: typeof fetch = fetch,
  ) {}

  private async hoi<T>(duongDan: string, ai: NguoiGoi, init: RequestInit = {}): Promise<T> {
    const res = await this.goi(`${this.diaChi}/api/document${duongDan}`, {
      ...init,
      headers: { Authorization: `Bearer ${await this.token.layToken(ai)}`, ...init.headers },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const than = await res.text().catch(() => '')
      throw new ServiceUnavailableException(
        `FOXAI Native trả lỗi ${res.status}${than ? `: ${than.slice(0, 300)}` : ''}`,
      )
    }
    return (res.status === 204 ? undefined : await res.json()) as T
  }

  async kiemTra() {
    try {
      const res = await this.goi(`${this.diaChi}/api/document/summarize?page=1&page_size=1`, {
        signal: AbortSignal.timeout(8000),
      })
      return { ok: res.status < 500, thongDiep: `Máy chủ Native trả lời HTTP ${res.status}.` }
    } catch (e) {
      return {
        ok: false,
        thongDiep: `Không tới được máy chủ Native: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }

  async guiTomTat(tep: TepGui, ai: NguoiGoi) {
    const du = new FormData()
    du.append('document_name', tep.ten)
    du.append('document_type', tep.loai)
    du.append('auto_summarize', String(tep.tuDong))
    du.append('file', new Blob([new Uint8Array(tep.noiDung)], { type: tep.mime }), tep.tenTep)
    return tuDto(await this.hoi<DtoTomTat>('/summarize/file', ai, { method: 'POST', body: du }))
  }

  async docTomTat(nativeId: string, ai: NguoiGoi) {
    return tuDto(await this.hoi<DtoTomTat>(`/summarize/${encodeURIComponent(nativeId)}`, ai))
  }

  async chayLai(nativeId: string, ai: NguoiGoi) {
    await this.hoi(`/summarize/${encodeURIComponent(nativeId)}/run`, ai, { method: 'POST' })
    return this.docTomTat(nativeId, ai)
  }

  async suaTomTat(nativeId: string, tomTat: string, ai: NguoiGoi) {
    await this.hoi(`/summarize/${encodeURIComponent(nativeId)}`, ai, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary_content: tomTat }),
    })
  }
}

/** Chọn bản cài theo cấu hình. Bản thật chỉ bật khi đã có `CapToken` (chờ đội Native). */
export function taoKetNoiNative(
  cauHinh: { gia: boolean; url: string | undefined },
  token?: CapToken,
): KetNoiNative {
  if (cauHinh.gia) return new NativeGia()
  if (cauHinh.url && token) return new NativeThat(cauHinh.url, token)
  return new NativeChuaNoi(
    cauHinh.url ?? null,
    cauHinh.url
      ? 'Đã có địa chỉ Native nhưng chưa chốt cách xác thực với đội Native (ADR-0009).'
      : 'Chưa cấu hình NATIVE_URL.',
  )
}
