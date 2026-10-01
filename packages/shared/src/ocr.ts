/**
 * NHẬN DẠNG CHỨNG TỪ (OCR) — kết quả lấy về từ OCR Service của FOXAI Native.
 *
 * ĐỘNG theo loại chứng từ: GDOS không khai cứng trường nào. Mỗi loại mang ĐỊNH NGHĨA
 * (trường + bảng) chụp từ Native; mỗi chứng từ mang `duLieu` (trường → giá trị) và
 * `bang` (bảng → các dòng) nguyên như Native trả. Trang nào cần dùng thì gọi
 * `GET /api/ocr/chung-tu?loai=<mã>` rồi dựng theo định nghĩa của loại đó.
 */

/** Kiểu giá trị GDOS hiểu được; kiểu lạ của Native quy về 'chu'. */
export type KieuTruongOcr = 'chu' | 'so' | 'ngay' | 'co-khong'

export interface TruongOcr {
  /** Khóa trong `duLieu` (hoặc trong một dòng của bảng). */
  khoa: string
  nhan: string
  kieu: KieuTruongOcr
  batBuoc: boolean
}

export interface BangOcr {
  /** Khóa trong `bang`. */
  khoa: string
  ten: string
  cot: TruongOcr[]
}

export interface DinhNghiaOcr {
  truong: TruongOcr[]
  bang: BangOcr[]
}

/** Một loại chứng từ (schema phía Native). */
export interface LoaiChungTuOcr extends DinhNghiaOcr {
  ma: string
  ten: string
  moTa: string | null
  /** Native còn bật loại này không. */
  hoatDong: boolean
  /** Quản trị cho phép lấy kết quả loại này về GDOS. */
  bat: boolean
  /** Số chứng từ loại này đã lấy về. */
  soChungTu: number
  dongBoLuc: string
}

export type TrangThaiChungTuOcr = 'da-xu-ly' | 'da-xac-nhan'

export const TRANG_THAI_CHUNG_TU_OCR: Record<TrangThaiChungTuOcr, string> = {
  'da-xu-ly': 'Đã nhận dạng',
  'da-xac-nhan': 'Đã xác nhận',
}

export type GiaTriOcr = string | number | boolean | null

/** Một chứng từ đã lấy về. */
export interface ChungTuOcr {
  id: string
  maLoai: string
  tenLoai: string
  tenTep: string
  trangThai: TrangThaiChungTuOcr
  /** Độ tin cậy 0–1 do Native chấm; null: Native không cho. */
  doTinCay: number | null
  duLieu: Record<string, GiaTriOcr>
  bang: Record<string, Record<string, GiaTriOcr>[]>
  /** Thời điểm tạo / sửa lần cuối phía Native. */
  taoLuc: string | null
  capNhatLuc: string | null
  layVeLuc: string
}

/** Kết quả một lần "Lấy về". */
export interface KetQuaLayVeOcr {
  /** Số chứng từ đã duyệt qua trên Native. */
  daXem: number
  moi: number
  capNhat: number
  khongDoi: number
  /** Chưa nhận dạng xong / lỗi, hoặc thuộc loại chưa bật. */
  boQua: number
  /** Đọc kết quả không được (Native trả lỗi cho riêng chứng từ đó). */
  loi: number
  /** Còn chứng từ trên Native chưa duyệt tới trong lần này. */
  conNua: boolean
}

/** Kết quả cập nhật danh sách loại từ Native. */
export interface KetQuaDongBoLoaiOcr {
  tong: number
  moi: number
}

/**
 * Quyền ĐỌC kết quả OCR (có một là đủ). Phân hệ tác nghiệp nào dùng kết quả OCR thì
 * thêm quyền READ của phân hệ đó vào đây — dữ liệu vẫn bị RLS lọc theo đơn vị.
 */
export const QUYEN_DOC_OCR: readonly [string, ...string[]] = ['QT_OCR.READ']

/** Quy giá trị thô về giá trị hiển thị được (đối tượng lồng → chuỗi JSON). */
export function giaTriOcr(v: unknown): GiaTriOcr {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  return JSON.stringify(v)
}

/**
 * Định nghĩa dùng để hiển thị một chứng từ: lấy theo loại; trường / bảng có trong dữ liệu
 * mà định nghĩa chưa có (Native vừa thêm) thì nối vào cuối với nhãn là chính khóa đó.
 */
export function dinhNghiaCho(dn: DinhNghiaOcr | undefined, ds: readonly ChungTuOcr[]): DinhNghiaOcr {
  const truong = [...(dn?.truong ?? [])]
  const bang = (dn?.bang ?? []).map((b) => ({ ...b, cot: [...b.cot] }))
  const coTruong = new Set(truong.map((t) => t.khoa))
  for (const c of ds) {
    for (const k of Object.keys(c.duLieu)) {
      if (coTruong.has(k)) continue
      coTruong.add(k)
      truong.push({ khoa: k, nhan: k, kieu: typeof c.duLieu[k] === 'number' ? 'so' : 'chu', batBuoc: false })
    }
    for (const [kb, dong] of Object.entries(c.bang)) {
      let b = bang.find((x) => x.khoa === kb)
      if (!b) {
        b = { khoa: kb, ten: kb, cot: [] }
        bang.push(b)
      }
      const coCot = new Set(b.cot.map((x) => x.khoa))
      for (const d of dong)
        for (const k of Object.keys(d)) {
          if (coCot.has(k)) continue
          coCot.add(k)
          b.cot.push({ khoa: k, nhan: k, kieu: typeof d[k] === 'number' ? 'so' : 'chu', batBuoc: false })
        }
    }
  }
  return { truong, bang }
}
