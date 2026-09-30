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

/** Ai cũng đọc được, kể cả trước khi đăng nhập — không có gì bí mật. */
export interface CauHinhCongKhai {
  /** Đã điền sẵn: tên cơ quan trống thì là tên đơn vị gốc. */
  nhanDien: NhanDien
  matKhauToiThieu: number
}

export interface CauHinhHeThong {
  baoMat: ChinhSachBaoMat
  /** Đúng như đã lưu — tên cơ quan có thể trống. */
  nhanDien: NhanDien
  /** Chỉ quản trị ở đơn vị GỐC sửa được cấu hình chung của cả hệ thống. */
  coTheSua: boolean
  tenDonViGoc: string | null
}
