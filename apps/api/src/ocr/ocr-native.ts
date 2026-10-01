/**
 * Đọc phản hồi của OCR Service (FOXAI Native, `/api/ocr/*`) về kiểu của GDOS. Thuần hàm —
 * không gọi mạng. Native là hệ thống khác, đổi lúc nào không báo: đọc PHÒNG THỦ, thiếu
 * gì thì bỏ dòng đó chứ không làm hỏng cả lần lấy về.
 */
import {
  giaTriOcr,
  type BangOcr,
  type DinhNghiaOcr,
  type GiaTriOcr,
  type KieuTruongOcr,
  type TrangThaiChungTuOcr,
  type TruongOcr,
} from '@gdos/shared'

type Vat = Record<string, unknown>
const laVat = (v: unknown): v is Vat => v !== null && typeof v === 'object' && !Array.isArray(v)
const chu = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** Mã bản ghi của Native (UUID) — kiểm trước khi ghép vào đường dẫn gọi sang Native. */
export const LA_MA_NATIVE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const KIEU: Record<string, KieuTruongOcr> = {
  number: 'so',
  integer: 'so',
  float: 'so',
  decimal: 'so',
  currency: 'so',
  money: 'so',
  date: 'ngay',
  datetime: 'ngay',
  boolean: 'co-khong',
  bool: 'co-khong',
}

const thuTu = (v: unknown): number => (laVat(v) && typeof v.displayOrder === 'number' ? v.displayOrder : 0)

function truong(v: unknown): TruongOcr | null {
  if (!laVat(v)) return null
  const khoa = chu(v.fieldKey) ?? chu(v.columnKey) ?? chu(v.key)
  if (!khoa) return null
  return {
    khoa,
    nhan: chu(v.label) ?? chu(v.name) ?? khoa,
    kieu: KIEU[(chu(v.dataType) ?? '').toLowerCase()] ?? 'chu',
    batBuoc: v.isRequired === true,
  }
}

const dsTruong = (v: unknown): TruongOcr[] =>
  [...mang(v)]
    .sort((a, b) => thuTu(a) - thuTu(b))
    .map(truong)
    .filter((t): t is TruongOcr => t !== null)

export interface LoaiTuNative {
  nativeId: string
  ma: string
  ten: string
  moTa: string | null
  hoatDong: boolean
  /** null: phản hồi danh sách không kèm trường — phải hỏi chi tiết loại. */
  dinhNghia: DinhNghiaOcr | null
}

/** Một loại chứng từ (schema). */
export function loaiTuNative(v: unknown): LoaiTuNative | null {
  if (!laVat(v)) return null
  const nativeId = chu(v.id)
  const ma = chu(v.code)
  if (!nativeId || !ma || !LA_MA_NATIVE.test(nativeId)) return null
  const bang: BangOcr[] = [...mang(v.tables)]
    .sort((a, b) => thuTu(a) - thuTu(b))
    .flatMap((b) => {
      if (!laVat(b)) return []
      const khoa = chu(b.tableKey) ?? chu(b.key)
      return khoa ? [{ khoa, ten: chu(b.name) ?? khoa, cot: dsTruong(b.columns) }] : []
    })
  return {
    nativeId,
    ma: ma.slice(0, 100),
    ten: (chu(v.name) ?? ma).slice(0, 300),
    moTa: chu(v.description)?.slice(0, 1000) ?? null,
    hoatDong: v.isActive !== false,
    dinhNghia: Array.isArray(v.fields) ? { truong: dsTruong(v.fields), bang } : null,
  }
}

/** Danh sách: Native trả mảng trần hoặc bọc trong `items` / `data`. */
export function dsTuNative(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (laVat(v)) return mang(v.items ?? v.data)
  return []
}

const TRANG_THAI: Record<string, TrangThaiChungTuOcr> = {
  processed: 'da-xu-ly',
  confirmed: 'da-xac-nhan',
}

/** Trạng thái có kết quả để lấy về; null: nháp, đang chạy, lỗi. */
export const trangThaiTuNative = (v: unknown): TrangThaiChungTuOcr | null =>
  TRANG_THAI[(chu(v) ?? '').toLowerCase()] ?? null

export interface DongTuNative {
  nativeId: string
  trangThai: TrangThaiChungTuOcr | null
  capNhatLuc: string | null
  /** Mã / id loại nếu danh sách có kèm — để bỏ sớm loại chưa bật, khỏi hỏi kết quả. */
  maLoai: string | null
  loaiNativeId: string | null
}

/** Một dòng trong danh sách chứng từ của Native. */
export function dongTuNative(v: unknown): DongTuNative | null {
  if (!laVat(v)) return null
  const nativeId = chu(v.id) ?? chu(v.documentId)
  if (!nativeId || !LA_MA_NATIVE.test(nativeId)) return null
  const loai = laVat(v.schema) ? v.schema : undefined
  return {
    nativeId,
    trangThai: trangThaiTuNative(v.status),
    capNhatLuc: ngay(v.updatedAt),
    maLoai: chu(v.schemaCode) ?? chu(loai?.code),
    loaiNativeId: chu(v.schemaId) ?? chu(loai?.id),
  }
}

function ngay(v: unknown): string | null {
  const s = chu(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Giới hạn để một chứng từ dị thường không làm phình cơ sở dữ liệu. */
const SO_TRUONG_TOI_DA = 300
const SO_DONG_BANG_TOI_DA = 2000
const DAI_TOI_DA = 4000

const cat = (v: GiaTriOcr): GiaTriOcr => (typeof v === 'string' ? v.slice(0, DAI_TOI_DA) : v)

function banGhi(v: unknown): Record<string, GiaTriOcr> {
  if (!laVat(v)) return {}
  return Object.fromEntries(
    Object.entries(v)
      .slice(0, SO_TRUONG_TOI_DA)
      .map(([k, x]) => [k.slice(0, 200), cat(giaTriOcr(x))]),
  )
}

export interface KetQuaTuNative {
  nativeId: string
  maLoai: string
  tenLoai: string
  tenTep: string
  loaiTep: string | null
  trangThai: TrangThaiChungTuOcr | null
  doTinCay: number | null
  duLieu: Record<string, GiaTriOcr>
  bang: Record<string, Record<string, GiaTriOcr>[]>
  taoLuc: string | null
  capNhatLuc: string | null
}

/** `/documents/{id}/result` — chuỗi JSON kết quả nhận dạng. */
export function ketQuaTuNative(v: unknown): KetQuaTuNative | null {
  if (!laVat(v)) return null
  const nativeId = chu(v.documentId) ?? chu(v.id)
  const maLoai = chu(v.schemaCode)
  if (!nativeId || !maLoai || !LA_MA_NATIVE.test(nativeId)) return null
  const tin = typeof v.ocrConfidence === 'number' && Number.isFinite(v.ocrConfidence) ? v.ocrConfidence : null
  return {
    nativeId,
    maLoai,
    tenLoai: (chu(v.schemaName) ?? maLoai).slice(0, 300),
    tenTep: (chu(v.fileName) ?? nativeId).slice(0, 300),
    loaiTep: chu(v.mimeType)?.slice(0, 100) ?? null,
    trangThai: trangThaiTuNative(v.status),
    // Native có nơi chấm 0–1, có nơi 0–100: quy về 0–1.
    doTinCay: tin === null ? null : Math.max(0, Math.min(1, tin > 1 ? tin / 100 : tin)),
    duLieu: banGhi(v.data),
    bang: laVat(v.tables)
      ? Object.fromEntries(
          Object.entries(v.tables)
            .slice(0, 50)
            .map(([k, ds]) => [k.slice(0, 200), mang(ds).slice(0, SO_DONG_BANG_TOI_DA).map(banGhi)]),
        )
      : {},
    taoLuc: ngay(v.createdAt),
    capNhatLuc: ngay(v.updatedAt),
  }
}
