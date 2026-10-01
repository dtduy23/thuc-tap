/**
 * Cấu hình hệ thống do quản trị chỉnh trên màn hình (Tầng 2 · Cấu hình & Vận
 * hành). API kiểm bằng đúng khai báo ở đây, web dựng form từ đúng khai báo ở
 * đây — thêm một tham số là thêm một dòng.
 */

/** Chính sách đăng nhập & mật khẩu. Mọi giá trị là số nguyên trong [min, max]. */
export const CHINH_SACH = {
  soLanSaiToiDa: {
    nhan: 'Số lần nhập sai liên tiếp trước khi khóa tạm',
    donVi: 'lần',
    macDinh: 10,
    min: 3,
    max: 30,
  },
  khoaTamPhut: {
    nhan: 'Thời gian khóa tạm',
    donVi: 'phút',
    macDinh: 10,
    min: 1,
    max: 240,
    mo: 'Hết khoảng này tài khoản tự mở; quản trị cũng mở tay được.',
  },
  veHanPhut: {
    nhan: 'Hiệu lực vé đăng nhập',
    donVi: 'phút',
    macDinh: 30,
    min: 5,
    max: 240,
    mo: 'Đổi phân công hay khóa tài khoản có hiệu lực chậm tối đa bằng khoảng này. Ngắn thì chặt hơn, dài thì đỡ gọi máy chủ.',
  },
  phienHanNgay: {
    nhan: 'Giữ đăng nhập',
    donVi: 'ngày',
    macDinh: 30,
    min: 1,
    max: 180,
    mo: 'Không mở hệ thống quá khoảng này thì phải đăng nhập lại.',
  },
  matKhauToiThieu: {
    nhan: 'Độ dài mật khẩu tối thiểu',
    donVi: 'ký tự',
    macDinh: 8,
    min: 6,
    max: 64,
    mo: 'Áp dụng cho mật khẩu đặt MỚI; mật khẩu đang dùng không bị bắt đổi.',
  },
} as const satisfies Record<
  string,
  { nhan: string; donVi: string; macDinh: number; min: number; max: number; mo?: string }
>

export type KhoaChinhSach = keyof typeof CHINH_SACH
export type ChinhSachBaoMat = Record<KhoaChinhSach, number>
export const KHOA_CHINH_SACH = Object.keys(CHINH_SACH) as KhoaChinhSach[]

export const CHINH_SACH_MAC_DINH = Object.fromEntries(
  KHOA_CHINH_SACH.map((k) => [k, CHINH_SACH[k].macDinh]),
) as ChinhSachBaoMat

/** Kiểm một bộ chính sách ĐẦY ĐỦ. Trả lỗi tiếng Việt (rỗng = hợp lệ). */
export function kiemChinhSach(x: unknown): string[] {
  const o = (x ?? {}) as Record<string, unknown>
  const loi: string[] = []
  for (const k of KHOA_CHINH_SACH) {
    const d = CHINH_SACH[k]
    const v = o[k]
    if (typeof v !== 'number' || !Number.isInteger(v)) loi.push(`${d.nhan}: phải là số nguyên`)
    else if (v < d.min || v > d.max) loi.push(`${d.nhan}: từ ${d.min} đến ${d.max} ${d.donVi}`)
  }
  for (const k of Object.keys(o)) if (!(k in CHINH_SACH)) loi.push(`Không có tham số "${k}"`)
  return loi
}

/** Tên hiển thị trên màn đăng nhập và thanh trên. */
export const NHAN_DIEN = {
  tenCoQuan: {
    nhan: 'Tên cơ quan',
    toiDa: 120,
    goiY: 'Dòng chữ nhỏ trên cùng, vd "UBND xã …". Để trống thì dùng tên đơn vị gốc.',
  },
  tenHeThong: { nhan: 'Tên hệ thống', toiDa: 120, goiY: 'Tiêu đề chính trên màn đăng nhập và thanh trên.' },
  moTa: {
    nhan: 'Mô tả ngắn',
    toiDa: 200,
    goiY: 'Một câu dưới tiêu đề màn đăng nhập. Để trống thì không hiện.',
  },
} as const

export type KhoaNhanDien = keyof typeof NHAN_DIEN
export type NhanDien = Record<KhoaNhanDien, string>
export const KHOA_NHAN_DIEN = Object.keys(NHAN_DIEN) as KhoaNhanDien[]

export const NHAN_DIEN_MAC_DINH: NhanDien = {
  tenCoQuan: '',
  tenHeThong: 'Hệ thống quản trị điều hành số',
  moTa: 'Điều hành, tác nghiệp và giám sát trên một nền tảng',
}

export function kiemNhanDien(x: unknown): string[] {
  const o = (x ?? {}) as Record<string, unknown>
  const loi: string[] = []
  for (const k of KHOA_NHAN_DIEN) {
    const v = o[k]
    if (typeof v !== 'string') loi.push(`${NHAN_DIEN[k].nhan}: phải là chữ`)
    else if (v.length > NHAN_DIEN[k].toiDa)
      loi.push(`${NHAN_DIEN[k].nhan}: tối đa ${NHAN_DIEN[k].toiDa} ký tự`)
  }
  if (typeof o.tenHeThong === 'string' && !o.tenHeThong.trim()) loi.push('Tên hệ thống không được để trống')
  for (const k of Object.keys(o)) if (!(k in NHAN_DIEN)) loi.push(`Không có trường "${k}"`)
  return loi
}

/**
 * Ngưỡng cảnh báo (Quy tắc cảnh báo › Hạn & ngưỡng) — dùng chung cho tình trạng bước dự án,
 * Giám sát › Hồ sơ quá hạn và "Việc của tôi". Cùng hình dạng với CHINH_SACH.
 */
export const NGUONG_CANH_BAO = {
  sapHanNgay: {
    nhan: 'Coi là "sắp đến hạn" khi còn không quá',
    donVi: 'ngày',
    macDinh: 10,
    min: 1,
    max: 60,
    mo: 'Bước chưa xong mà hạn rơi trong khoảng này thì chuyển màu vàng và vào danh sách Sắp đến hạn.',
  },
  lauCapNhatNgay: {
    nhan: 'Coi là "lâu không cập nhật" khi quá',
    donVi: 'ngày',
    macDinh: 15,
    min: 3,
    max: 180,
    mo: 'Hồ sơ đang thực hiện mà quá khoảng này không ai cập nhật thì vào danh sách Lâu không cập nhật.',
  },
} as const satisfies Record<
  string,
  { nhan: string; donVi: string; macDinh: number; min: number; max: number; mo?: string }
>
export type KhoaNguong = keyof typeof NGUONG_CANH_BAO
export type NguongCanhBao = Record<KhoaNguong, number>
export const KHOA_NGUONG = Object.keys(NGUONG_CANH_BAO) as KhoaNguong[]
export const NGUONG_MAC_DINH = Object.fromEntries(
  KHOA_NGUONG.map((k) => [k, NGUONG_CANH_BAO[k].macDinh]),
) as NguongCanhBao

export function kiemNguong(x: unknown): string[] {
  const o = (x ?? {}) as Record<string, unknown>
  const loi: string[] = []
  for (const k of KHOA_NGUONG) {
    const d = NGUONG_CANH_BAO[k]
    const v = o[k]
    if (typeof v !== 'number' || !Number.isInteger(v)) loi.push(`${d.nhan}: phải là số nguyên`)
    else if (v < d.min || v > d.max) loi.push(`${d.nhan}: từ ${d.min} đến ${d.max} ${d.donVi}`)
  }
  for (const k of Object.keys(o)) if (!(k in NGUONG_CANH_BAO)) loi.push(`Không có tham số "${k}"`)
  return loi
}

/**
 * Trang mở ra ngay sau khi đăng nhập, theo vai (Hiển thị › Trang mặc định theo vai). Giá trị
 * là mã chức năng cấp 4; chuỗi rỗng = trang chủ. Người giữ nhiều vai: lấy theo thứ tự dưới đây.
 */
export const VAI_TRANG_DAU = {
  LANH_DAO: 'Lãnh đạo',
  CHUYEN_VIEN: 'Chuyên viên',
  THANH_TRA: 'Thanh tra',
  QUAN_TRI: 'Quản trị hệ thống (không giữ vai nghiệp vụ)',
} as const
export type KhoaTrangDau = keyof typeof VAI_TRANG_DAU
export type TrangDau = Record<KhoaTrangDau, string>
export const KHOA_TRANG_DAU = Object.keys(VAI_TRANG_DAU) as KhoaTrangDau[]
export const TRANG_DAU_MAC_DINH: TrangDau = { LANH_DAO: '', CHUYEN_VIEN: '', THANH_TRA: '', QUAN_TRI: '' }

/** `hopLe`: tập mã chức năng có trong cây (registry) — không cho trỏ tới chức năng không tồn tại. */
export function kiemTrangDau(x: unknown, hopLe: ReadonlySet<string>): string[] {
  const o = (x ?? {}) as Record<string, unknown>
  const loi: string[] = []
  for (const k of KHOA_TRANG_DAU) {
    const v = o[k]
    if (typeof v !== 'string') loi.push(`${VAI_TRANG_DAU[k]}: phải là mã chức năng hoặc để trống`)
    else if (v !== '' && !hopLe.has(v)) loi.push(`${VAI_TRANG_DAU[k]}: không có chức năng "${v}"`)
  }
  for (const k of Object.keys(o)) if (!(k in VAI_TRANG_DAU)) loi.push(`Không có vai "${k}"`)
  return loi
}

/** Trang đầu của một người: vai nghiệp vụ trước (lãnh đạo → chuyên viên → thanh tra), rồi tới quản trị. */
export function trangDauCua(
  td: TrangDau,
  vai: readonly string[],
  laQuanTri: boolean,
  coQuyenMo: (chucNang: string) => boolean,
): string {
  const thu: KhoaTrangDau[] = [
    ...KHOA_TRANG_DAU.filter((k) => k !== 'QUAN_TRI' && vai.includes(k)),
    ...(laQuanTri ? (['QUAN_TRI'] as const) : []),
  ]
  for (const k of thu) if (td[k] && coQuyenMo(td[k])) return td[k]
  return ''
}

/** Ai cũng đọc được, kể cả trước khi đăng nhập — không có gì bí mật. */
export interface CauHinhCongKhai {
  /** Đã điền sẵn: tên cơ quan trống thì là tên đơn vị gốc. */
  nhanDien: NhanDien
  matKhauToiThieu: number
  nguong: NguongCanhBao
  trangDau: TrangDau
}

export interface CauHinhHeThong {
  baoMat: ChinhSachBaoMat
  /** Đúng như đã lưu — tên cơ quan có thể trống. */
  nhanDien: NhanDien
  nguong: NguongCanhBao
  trangDau: TrangDau
  /** Chỉ quản trị ở đơn vị GỐC sửa được cấu hình chung của cả hệ thống. */
  coTheSua: boolean
  tenDonViGoc: string | null
}
