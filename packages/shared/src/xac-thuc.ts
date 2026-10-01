import type { PhanCong } from './vai-tro.js'

/**
 * Những gì web biết về người đang đăng nhập — trả từ /api/xac-thuc/toi và
 * /api/xac-thuc/dang-nhap. KHÔNG có gì bí mật.
 */
export interface ThongTinToi {
  id: string
  tenDangNhap: string
  hoTen: string
  laQuanTri: boolean
  /** Mật khẩu do quản trị cấp — web chỉ cho vào màn đổi mật khẩu. */
  phaiDoiMatKhau: boolean
  donVi: { id: string; ten: string; cap: string }
  phanCong: PhanCong[]
  /** Web đưa thẳng vào locTheoQuyen() để dựng cây — cùng tập API dùng để chặn. */
  quyen: string[]
}

/** Header chống giả mạo request — web gắn cho mọi request ghi, API từ chối nếu thiếu. */
export const HEADER_CHONG_GIA_MAO = 'X-GDOS'
