/**
 * Vai trò và cách tính quyền — xem docs/adr/0006-vai-tro-khoi-chinh-phu.md.
 *
 *   quyền = vai quyết định LÀM ĐƯỢC HÀNH ĐỘNG GÌ
 *         × phân công quyết định LÀM Ở PHÂN HỆ NÀO
 *
 * Cùng một hàm `tinhQuyen()` chạy ở API (chặn) và ở web (lọc menu), nên menu
 * và API không thể lệch nhau — lỗi mà GDOS cũ mắc 100%.
 */
import { HANH_DONG, NHOM, tangCuaNhom, type HanhDong, type MaNhom, type ModuleDef } from './phan-he.js'

export const VAI = {
  LANH_DAO: {
    ten: 'Lãnh đạo',
    mo: 'Xem toàn bộ, duyệt, giao việc — không nhập liệu.',
    hanhDong: ['READ', 'EXPORT', 'APPROVE', 'ASSIGN'],
    thayGiamSat: true,
  },
  CHUYEN_VIEN: {
    ten: 'Chuyên viên',
    mo: 'Nhập liệu và xử lý trong các phân hệ được phân công.',
    hanhDong: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
    // Người bị kiểm tra không xem nhật ký kiểm tra — kể cả khi phạm vi là "tất cả".
    thayGiamSat: false,
  },
  THANH_TRA: {
    ten: 'Thanh tra',
    mo: 'Chỉ đọc, kể cả nhật ký thao tác.',
    hanhDong: ['READ', 'EXPORT'],
    thayGiamSat: true,
  },
} as const satisfies Record<
  string,
  { ten: string; mo: string; hanhDong: readonly HanhDong[]; thayGiamSat: boolean }
>

export type MaVai = keyof typeof VAI
export const MA_VAI = Object.keys(VAI) as MaVai[]

/** Một phân công: vai nào, trên những module cấp 3 nào (hoặc tất cả). */
export interface PhanCong {
  vai: MaVai
  phamVi: 'tat-ca' | readonly string[]
}

const NHOM_GIAM_SAT: MaNhom = 'giam-sat'
const NHOM_DANH_MUC: MaNhom = 'danh-muc'

/**
 * Kiểm một phân công trước khi lưu. Trả danh sách lỗi (rỗng = hợp lệ).
 * Chặn ở đây thay vì âm thầm bỏ qua — người quản trị phải biết vì sao.
 */
export function kiemTraPhanCong(pc: PhanCong, modules: readonly ModuleDef[]): string[] {
  if (pc.phamVi === 'tat-ca') return []
  if (pc.phamVi.length === 0) return ['Phạm vi phân công không được rỗng']
  const loi: string[] = []
  for (const id of pc.phamVi) {
    const m = modules.find((x) => x.id === id)
    if (!m) {
      loi.push(`Không có phân hệ "${id}"`)
      continue
    }
    if (tangCuaNhom(m.nhom) === 2) loi.push(`"${m.nhan}" thuộc Tầng 2 — dùng cờ quản trị, không phân công`)
    if (m.nhom === NHOM_GIAM_SAT && !VAI[pc.vai].thayGiamSat)
      loi.push(`Vai ${VAI[pc.vai].ten} không được phân công "${m.nhan}" (Giám sát & Lưu vết)`)
  }
  return loi
}

/**
 * Quyền hiệu lực của một tài khoản = HỢP của mọi phân công, cộng Tầng 2 nếu có cờ.
 * Trả tập mã `MÃ_PHÂN_HỆ.HÀNH_ĐỘNG`, đưa thẳng vào `locTheoQuyen()`.
 */
export function tinhQuyen(
  modules: readonly ModuleDef[],
  phanCong: readonly PhanCong[],
  coQuanTri: boolean,
): Set<string> {
  const quyen = new Set<string>()
  const cap = (m: ModuleDef, ds: readonly HanhDong[]) => ds.forEach((h) => quyen.add(`${m.maQuyen}.${h}`))

  for (const pc of phanCong) {
    const vai = VAI[pc.vai]
    for (const m of modules) {
      if (tangCuaNhom(m.nhom) !== 1) continue
      const trongPhamVi = pc.phamVi === 'tat-ca' || pc.phamVi.includes(m.id)

      if (m.nhom === NHOM_GIAM_SAT) {
        if (vai.thayGiamSat && trongPhamVi)
          cap(
            m,
            vai.hanhDong.filter((h) => h === 'READ' || h === 'EXPORT'),
          )
        continue
      }
      // Danh mục: vai nghiệp vụ nào cũng cần ĐỌC để chọn giá trị khi nhập.
      if (m.nhom === NHOM_DANH_MUC) cap(m, ['READ'])
      if (trongPhamVi) cap(m, vai.hanhDong)
    }
  }

  if (coQuanTri) for (const m of modules) if (tangCuaNhom(m.nhom) === 2) cap(m, HANH_DONG)
  return quyen
}

/** Tầng 2 luôn là một cửa; tiện cho kiểm tra ở UI và test. */
export const NHOM_TANG_2 = NHOM.filter((n) => n.tang === 2).map((n) => n.ma)
