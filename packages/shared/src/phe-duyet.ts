/**
 * LUỒNG PHÊ DUYỆT — quy tắc "việc gì, qua mấy cấp, ai duyệt" (Tầng 2 › Luồng phê duyệt).
 * Đây là ĐỊNH NGHĨA; việc đang chờ duyệt (thể hiện) nằm ở chính hồ sơ nghiệp vụ.
 *
 * Nghiệp vụ nào dùng luồng thì khai ở NGHIEP_VU_DUYET; quản trị chỉnh số cấp và người duyệt
 * từng cấp. Người duyệt khai theo VAI trên chính hồ sơ (không khai tên người) — đổi nhân sự
 * không phải sửa luồng.
 */

/** Nghiệp vụ có luồng phê duyệt. Thêm nghiệp vụ = thêm một dòng ở đây + xử lý ở module chủ. */
export const NGHIEP_VU_DUYET = {
  'gia-han-buoc': {
    ten: 'Xin gia hạn bước dự án',
    phanHe: 'Dự án',
    mo: 'Cán bộ phụ trách hoặc nhà thầu xin lùi hạn một bước. Duyệt xong cấp cuối thì hạn bước đổi theo, các bước sau dời theo và kế hoạch được chốt thành phiên bản mới.',
  },
} as const
export type MaLuongDuyet = keyof typeof NGHIEP_VU_DUYET
export const MA_LUONG_DUYET = Object.keys(NGHIEP_VU_DUYET) as MaLuongDuyet[]

/** Ai duyệt một cấp — tính trên CHÍNH hồ sơ đang xét. */
export const VAI_DUYET = {
  'can-bo': {
    ten: 'Cán bộ đơn vị chủ đầu tư',
    mo: 'Người có quyền cập nhật dự án, thuộc đơn vị chủ đầu tư.',
    quyen: 'DU_AN.UPDATE',
  },
  'lanh-dao': {
    ten: 'Lãnh đạo đơn vị chủ đầu tư',
    mo: 'Người có quyền phê duyệt, thuộc đơn vị chủ đầu tư.',
    quyen: 'DU_AN.APPROVE',
  },
} as const
export type VaiDuyet = keyof typeof VAI_DUYET

export interface CapDuyet {
  /** Tên bước duyệt, vd "Thẩm định", "Phê duyệt". */
  ten: string
  vai: VaiDuyet
}

export interface LuongDuyet {
  /** Tắt thì nghiệp vụ không nhận yêu cầu mới (yêu cầu đang chờ vẫn duyệt tiếp được). */
  bat: boolean
  /** Cho người gửi yêu cầu tự duyệt (đơn vị ít người). Mặc định không. */
  choTuDuyet: boolean
  cap: CapDuyet[]
}

export type CauHinhLuongDuyet = Record<MaLuongDuyet, LuongDuyet>

export const SO_CAP_DUYET_TOI_DA = 4

export const LUONG_DUYET_MAC_DINH: CauHinhLuongDuyet = {
  'gia-han-buoc': {
    bat: true,
    choTuDuyet: false,
    cap: [{ ten: 'Lãnh đạo đơn vị phê duyệt', vai: 'lanh-dao' }],
  },
}

/** Kiểm MỘT luồng (thân request). Rỗng = hợp lệ. */
export function kiemLuongDuyet(v: unknown): string[] {
  const loi: string[] = []
  if (v === null || typeof v !== 'object') return ['Luồng phê duyệt không hợp lệ']
  const o = v as Record<string, unknown>
  if (typeof o.bat !== 'boolean') loi.push('Thiếu trạng thái bật / tắt')
  if (typeof o.choTuDuyet !== 'boolean') loi.push('Thiếu lựa chọn "người gửi tự duyệt"')
  if (!Array.isArray(o.cap) || o.cap.length === 0) loi.push('Luồng phải có ít nhất một cấp duyệt')
  else if (o.cap.length > SO_CAP_DUYET_TOI_DA) loi.push(`Tối đa ${SO_CAP_DUYET_TOI_DA} cấp duyệt`)
  else
    o.cap.forEach((c: unknown, i) => {
      const x = (c ?? {}) as Record<string, unknown>
      if (typeof x.ten !== 'string' || !x.ten.trim() || x.ten.length > 120)
        loi.push(`Cấp ${i + 1}: tên bắt buộc, tối đa 120 ký tự`)
      if (typeof x.vai !== 'string' || !(x.vai in VAI_DUYET)) loi.push(`Cấp ${i + 1}: chưa chọn người duyệt`)
    })
  return loi
}

/** Giá trị đã lưu (có thể từ bản cũ, thiếu nghiệp vụ mới) → cấu hình đầy đủ. */
export function hopNhatLuongDuyet(luu: unknown): CauHinhLuongDuyet {
  const o = (luu ?? {}) as Record<string, unknown>
  const kq = Object.fromEntries(
    MA_LUONG_DUYET.map((ma) => {
      const m = LUONG_DUYET_MAC_DINH[ma]
      return [ma, { ...m, cap: m.cap.map((c) => ({ ...c })) }]
    }),
  ) as CauHinhLuongDuyet
  for (const ma of MA_LUONG_DUYET) {
    const v = o[ma]
    if (kiemLuongDuyet(v).length > 0) continue
    const l = v as LuongDuyet
    kq[ma] = {
      bat: l.bat,
      choTuDuyet: l.choTuDuyet,
      cap: l.cap.map((c) => ({ ten: c.ten.trim(), vai: c.vai })),
    }
  }
  return kq
}

// ── Thể hiện: một yêu cầu đang đi qua luồng ─────────────────────────────────

export type TrangThaiYeuCau = 'cho-duyet' | 'da-duyet' | 'tu-choi' | 'da-rut'

export const TRANG_THAI_YEU_CAU: Record<TrangThaiYeuCau, string> = {
  'cho-duyet': 'Chờ duyệt',
  'da-duyet': 'Đã duyệt',
  'tu-choi': 'Từ chối',
  'da-rut': 'Đã rút',
}

/** Một lần ra quyết định ở một cấp. */
export interface BuocDuyetDaQua {
  /** Cấp thứ mấy (từ 1). */
  cap: number
  tenCap: string
  nguoiId: string
  nguoiTen: string | null
  dongY: boolean
  yKien: string | null
  luc: string
}
