/**
 * ĐÓNG GÓP của module nghiệp vụ — ADR-0007 "một chủ, nhiều lối vào".
 *
 * Module nghiệp vụ (Tác nghiệp) KHAI một lần những thứ nó đóng góp: báo cáo, chỉ
 * số, cảnh báo, việc cần làm. Các nhóm xuyên suốt (Điều hành, Giám sát, trang chủ)
 * tự đọc danh sách này — thêm nghiệp vụ không phải sửa chúng.
 *
 * Quyền xem một đóng góp là quyền của CHỦ (vd DU_AN.READ): ai thấy ở module thì
 * thấy ở trung tâm, và ngược lại.
 */
import type { HanhDong, ModuleDef } from './phan-he.js'

export interface BaoCaoDef {
  id: string
  ten: string
  mo: string
  /** Định kỳ (nộp cấp trên theo biểu) · tra cứu · xuất dữ liệu. Cấp 4 của Báo cáo điều hành lọc theo đây. */
  loai: 'dinh-ky' | 'tra-cuu' | 'xuat'
  /** Mặc định READ; xuất dữ liệu thường là EXPORT. */
  hanhDong?: HanhDong
}

export interface ChiSoDef {
  id: string
  ten: string
  mo: string
}

export interface CanhBaoDef {
  id: string
  ten: string
  /** Cấp 4 của Giám sát › Hồ sơ quá hạn lọc theo đây. */
  loai: 'qua-han' | 'sap-han' | 'lau-khong-cap-nhat'
  mo: string
}

export interface ViecDef {
  id: string
  ten: string
  mo: string
}

export interface DongGop {
  baoCao?: readonly BaoCaoDef[]
  chiSo?: readonly ChiSoDef[]
  canhBao?: readonly CanhBaoDef[]
  viec?: readonly ViecDef[]
}

export type LoaiDongGop = keyof DongGop

/** Nhóm được phép CÓ đóng góp: nhóm nghiệp vụ sở hữu dữ liệu. Nhóm xuyên suốt chỉ đọc đóng góp. */
const NHOM_CHU = new Set(['tac-nghiep', 'danh-muc'])

/** Kiểm đóng góp của cả registry. Trả lỗi (rỗng = hợp lệ). */
export function kiemTraDongGop(modules: readonly (ModuleDef & { dongGop?: DongGop })[]): string[] {
  const loi: string[] = []
  const daCo = new Set<string>()
  for (const m of modules) {
    if (!m.dongGop) continue
    if (!NHOM_CHU.has(m.nhom))
      loi.push(
        `module ${m.id}: nhóm "${m.nhom}" là nhóm xuyên suốt — chỉ đọc đóng góp, không có đóng góp (ADR-0007)`,
      )
    for (const loai of Object.keys(m.dongGop) as LoaiDongGop[])
      for (const d of m.dongGop[loai] ?? []) {
        if (daCo.has(d.id)) loi.push(`module ${m.id}: mã đóng góp "${d.id}" bị trùng`)
        daCo.add(d.id)
        if (!d.id.startsWith(`${m.id}-`))
          loi.push(`module ${m.id}: mã đóng góp "${d.id}" phải bắt đầu bằng "${m.id}-"`)
      }
  }
  return loi
}

export interface MucDongGop<T> {
  module: ModuleDef
  muc: T
}

/** Mọi đóng góp một loại mà người này XEM được (theo quyền của chủ). */
export function dongGopCua<L extends LoaiDongGop>(
  modules: readonly (ModuleDef & { dongGop?: DongGop })[],
  loai: L,
  quyen: ReadonlySet<string>,
): MucDongGop<NonNullable<DongGop[L]>[number]>[] {
  const kq: MucDongGop<NonNullable<DongGop[L]>[number]>[] = []
  for (const m of modules)
    for (const muc of m.dongGop?.[loai] ?? []) {
      const hanhDong = (muc as { hanhDong?: HanhDong }).hanhDong ?? 'READ'
      if (quyen.has(`${m.maQuyen}.${hanhDong}`)) kq.push({ module: m, muc })
    }
  return kq
}

// ── Dữ liệu các nhóm xuyên suốt nhận từ đóng góp ────────────────────────────

/** Một cảnh báo đang mở (Giám sát › Hồ sơ quá hạn). `lienKet` mở thẳng chỗ cần xử lý. */
export interface DongCanhBao {
  /** Mã đóng góp, vd du-an-qua-han. */
  nguon: string
  /** Tên module chủ, vd "Dự án". */
  nghiepVu: string
  loai: CanhBaoDef['loai']
  hoSoId: string
  hoSoMa: string
  hoSoTen: string
  donViTen: string
  noiDung: string
  han: string | null
  /** Trễ bao nhiêu ngày (quá hạn, lâu không cập nhật) hoặc còn bao nhiêu ngày (sắp hạn). */
  soNgay: number
  lienKet: string
}

/** Một việc trong "Việc của tôi" (trang chủ). */
export interface MucViec {
  nguon: string
  nghiepVu: string
  tieuDe: string
  moTa: string
  hoSoTen: string
  han: string | null
  mucDo: 'qua-han' | 'sap-han' | 'thuong'
  lienKet: string
}

/** Ngưỡng mặc định "lâu không cập nhật" (PMS: 15 ngày). Về sau là tham số ở Quy tắc cảnh báo. */
export const NGUONG_LAU_CAP_NHAT = 15

/**
 * Khối số liệu một nghiệp vụ góp cho Điều hành (Tổng quan, Bộ chỉ số). Hình dạng
 * CHUNG — ô số + bảng — để màn Điều hành vẽ được mà không biết nghiệp vụ là gì.
 */
export interface KhoiSoLieu {
  nguon: string
  nghiepVu: string
  so: { nhan: string; giaTri: string; phu?: string; mau?: 'danger' | 'warn' | 'ok' | 'brand' }[]
  bang: {
    tieuDe: string
    ghiChu?: string
    cot: { nhan: string; so?: boolean }[]
    dong: { o: (string | number)[]; lienKet?: string; mau?: 'danger' | 'warn' | 'ok' }[]
  }[]
}

export const GOC_NHIN_TONG_QUAN = ['toan', 'don-vi', 'linh-vuc'] as const
export type GocNhinTongQuan = (typeof GOC_NHIN_TONG_QUAN)[number]

export const LOAI_CHI_SO = ['tat-ca', 'xep-hang'] as const
export type LoaiChiSo = (typeof LOAI_CHI_SO)[number]
