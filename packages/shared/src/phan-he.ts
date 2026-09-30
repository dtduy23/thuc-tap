/**
 * Cây phân hệ bốn cấp — xem docs/adr/0002-cay-phan-he-bon-cap.md.
 *
 *   Cấp 1  TẦNG       danh sách ĐÓNG, khai ở đây
 *   Cấp 2  NHÓM       danh sách ĐÓNG, khai ở đây
 *   Cấp 3  MODULE     một ĐỐI TƯỢNG nghiệp vụ — khai trong registry của app
 *   Cấp 4  CHỨC NĂNG  một ĐƯỜNG VÀO của chính đối tượng đó: bộ lọc · chặng · thao tác
 *
 * Thêm tầng hoặc nhóm = sửa hai mảng dưới + viết ADR. Kiểu `MaNhom` suy ra từ
 * mảng, nên một nhóm chưa khai thì registry không biên dịch được — đó là chỗ
 * chặn bệnh "phan-he-mo-rong" của GDOS cũ bằng máy, không bằng thiện chí.
 */

export const TANG = [
  { so: 1, nhan: 'Nghiệp vụ', hoi: 'Màn này quan hệ với dữ liệu nghiệp vụ như thế nào?' },
  { so: 2, nhan: 'Quản trị hệ thống', hoi: 'Một cửa, đúng ba nhóm.' },
] as const

export type SoTang = (typeof TANG)[number]['so']

export const NHOM = [
  { ma: 'dieu-hanh', tang: 1, nhan: 'Điều hành', hoi: 'Đọc tổng hợp NHIỀU hồ sơ, không sửa gì?' },
  {
    ma: 'tac-nghiep',
    tang: 1,
    nhan: 'Tác nghiệp',
    hoi: 'Có mã hồ sơ + thời hạn đo được + người chịu trách nhiệm?',
  },
  { ma: 'danh-muc', tang: 1, nhan: 'Danh mục', hoi: 'Có TỪ HAI nhóm nghiệp vụ tham chiếu tới?' },
  {
    ma: 'giam-sat',
    tang: 1,
    nhan: 'Giám sát & Lưu vết',
    hoi: 'Là VẾT của việc đã làm, người xem là thanh tra/lãnh đạo?',
  },
  { ma: 'qt-nguoi-dung', tang: 2, nhan: 'Người dùng & Phân quyền', hoi: 'Ai được vào, được làm gì?' },
  { ma: 'qt-ket-noi', tang: 2, nhan: 'Kết nối', hoi: 'Hệ thống nói chuyện với bên ngoài qua đâu?' },
  {
    ma: 'qt-cau-hinh',
    tang: 2,
    nhan: 'Cấu hình & Vận hành',
    hoi: 'Hệ thống chạy thế nào, đang chạy ra sao?',
  },
] as const satisfies readonly { ma: string; tang: SoTang; nhan: string; hoi: string }[]

export type MaNhom = (typeof NHOM)[number]['ma']

/**
 * Bảy hành động — xem ADR-0006. Mã quyền là `MÃ_PHÂN_HỆ.HÀNH_ĐỘNG`, ghép từ
 * module và chức năng, không viết tay — nên không thể gõ sai một mã quyền.
 */
export const HANH_DONG = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE', 'ASSIGN'] as const
export type HanhDong = (typeof HANH_DONG)[number]

/** Nguồn dữ liệu của module: Postgres của GDOS, hay gọi sang FOXAI Native. */
export type NguonDuLieu = 'db' | 'native'

/** Cấp 4 — một đường vào của module cha. */
export interface ChucNang {
  id: string
  nhan: string
  /** Hành động cần để thấy chức năng này. Mặc định READ; "Tạo mới" là CREATE, "Đôn đốc" là ASSIGN… */
  hanhDong?: HanhDong
  mo?: string
  /** Màn PHÁC: có chỗ trên cây để thấy khung, chưa xây màn. Xây xong thì bỏ cờ này. */
  phac?: boolean
}

/** Cấp 3 — một đối tượng nghiệp vụ. */
export interface ModuleDef {
  id: string
  nhan: string
  nhom: MaNhom
  /** Phần MÃ_PHÂN_HỆ của mã quyền, vd PROJECT. Tầng 2 bắt buộc tiền tố QT_. */
  maQuyen: string
  nguon: NguonDuLieu
  mo: string
  con: readonly ChucNang[]
  /** Cả module là màn phác — mọi chức năng con đều chưa xây. */
  phac?: boolean
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MA_QUYEN = /^[A-Z][A-Z0-9_]*$/

export const tangCuaNhom = (ma: MaNhom): SoTang => NHOM.find((n) => n.ma === ma)!.tang

/**
 * Kiểm tra registry, trả danh sách lỗi (rỗng = hợp lệ). Chạy trong test của
 * app, nên registry sai là CI đỏ — không phải đợi người review bắt được.
 */
export function kiemTraCay(modules: readonly ModuleDef[]): string[] {
  const loi: string[] = []
  const daCo = new Set<string>()
  const ghiId = (id: string, noi: string) => {
    if (!SLUG.test(id)) loi.push(`${noi}: mã "${id}" phải là slug không dấu, gạch nối`)
    if (daCo.has(id)) loi.push(`${noi}: mã "${id}" bị trùng`)
    daCo.add(id)
  }

  for (const m of modules) {
    const noi = `module ${m.id}`
    ghiId(m.id, noi)
    if (!m.nhan.trim()) loi.push(`${noi}: thiếu nhãn`)
    if (!MA_QUYEN.test(m.maQuyen))
      loi.push(`${noi}: mã quyền "${m.maQuyen}" phải viết HOA, không dấu, nối bằng _`)

    // Hai chiều của cùng một luật: màn quản trị không lọt ra Tầng 1, và màn
    // nghiệp vụ không nấp sau cờ quản trị ở Tầng 2.
    const laQuanTri = m.maQuyen.startsWith('QT_')
    if (tangCuaNhom(m.nhom) === 2 && !laQuanTri)
      loi.push(`${noi}: nằm ở Tầng 2 thì mã quyền phải bắt đầu QT_`)
    if (tangCuaNhom(m.nhom) === 1 && laQuanTri)
      loi.push(`${noi}: nằm ở Tầng 1 thì không được dùng mã quyền QT_`)

    // Cấp 3 là một đối tượng; không có đường vào nào thì không vào được — tức route mồ côi.
    if (m.con.length === 0) loi.push(`${noi}: phải có ít nhất một chức năng cấp 4`)
    for (const c of m.con) {
      const noiCon = `${noi} › ${c.id}`
      ghiId(c.id, noiCon)
      if (!c.nhan.trim()) loi.push(`${noiCon}: thiếu nhãn`)
    }
  }
  return loi
}

export interface NhanhModule {
  module: ModuleDef
  con: ChucNang[]
}
export interface NhanhNhom {
  ma: MaNhom
  nhan: string
  hoi: string
  modules: NhanhModule[]
}
export interface NhanhTang {
  so: SoTang
  nhan: string
  hoi: string
  nhom: NhanhNhom[]
}

/** Chức năng chưa xây màn (của chính nó hoặc cả module đang là màn phác). */
export const laPhac = (m: ModuleDef, c: ChucNang): boolean => !!(m.phac || c.phac)

/** Mã quyền cần để thấy một chức năng cấp 4, vd `PROJECT.READ`, `PROJECT.CREATE`. */
export const quyenCua = (m: ModuleDef, c: ChucNang): string => `${m.maQuyen}.${c.hanhDong ?? 'READ'}`

/**
 * Lọc cây theo quyền ở CẢ BỐN cấp. Nhánh nào không còn con nào được thấy thì
 * bị cắt, kể cả tầng — nên người không có cờ quản trị không thấy cả tiêu đề
 * Tầng 2. Sidebar, trang "Toàn bộ chức năng" và test quyền cùng dùng hàm này.
 */
export function locTheoQuyen(modules: readonly ModuleDef[], quyenCo: ReadonlySet<string>): NhanhTang[] {
  const ketQua: NhanhTang[] = []
  for (const t of TANG) {
    const nhom: NhanhNhom[] = []
    for (const n of NHOM.filter((x) => x.tang === t.so)) {
      const mods: NhanhModule[] = []
      for (const m of modules.filter((x) => x.nhom === n.ma)) {
        const con = m.con.filter((c) => quyenCo.has(quyenCua(m, c)))
        if (con.length) mods.push({ module: m, con })
      }
      if (mods.length) nhom.push({ ma: n.ma, nhan: n.nhan, hoi: n.hoi, modules: mods })
    }
    if (nhom.length) ketQua.push({ so: t.so, nhan: t.nhan, hoi: t.hoi, nhom })
  }
  return ketQua
}
