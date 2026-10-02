/**
 * Đặt lại mật khẩu của một QUẢN TRỊ VIÊN khi không còn ai đăng nhập được (quên mật khẩu, và
 * không có quản trị viên nào khác để cấp lại qua màn hình).
 *
 * Chạy bằng CHỦ BẢNG, qua lệnh CLI trên server — ai vào được máy chủ mới chạy được; không có
 * màn hình hay API nào làm việc này. Chỉ áp dụng cho tài khoản có cờ quản trị: tài khoản
 * thường thì quản trị viên cấp lại trên màn hình.
 *
 * Ngoài mật khẩu: gỡ khóa tạm do nhập sai, thu hồi mọi phiên đang đăng nhập của tài khoản đó.
 * Trigger nhật ký tự ghi một dòng "đổi mật khẩu" (không có người thao tác — vết của lệnh server).
 */
import { and, eq, isNull } from 'drizzle-orm'
import type { CoSo } from '../db/pham-vi.js'
import { phienDangNhap, taiKhoan } from '../db/schema/index.js'
import { bamMatKhau, kiemTraMatKhauMoi } from '../xac-thuc/mat-khau.js'

export type KetQuaDatLai = 'da-dat-lai' | 'khong-co' | 'khong-phai-quan-tri'

export async function datLaiMatKhauQuanTri(
  chuBang: CoSo,
  tenDangNhap: string,
  matKhau: string,
): Promise<KetQuaDatLai> {
  const loi = kiemTraMatKhauMoi(matKhau, tenDangNhap)
  if (loi) throw new Error(loi)
  const bam = await bamMatKhau(matKhau)

  return chuBang.transaction(async (tx) => {
    const [tk] = await tx
      .select({ id: taiKhoan.id, laQuanTri: taiKhoan.laQuanTri })
      .from(taiKhoan)
      .where(and(eq(taiKhoan.tenDangNhap, tenDangNhap), isNull(taiKhoan.deletedAt)))
    if (!tk) return 'khong-co'
    if (!tk.laQuanTri) return 'khong-phai-quan-tri'
    await tx
      .update(taiKhoan)
      .set({
        matKhauBam: bam,
        phaiDoiMatKhau: false,
        soLanSai: 0,
        khoaDen: null,
        doiMatKhauLuc: new Date(),
      })
      .where(eq(taiKhoan.id, tk.id))
    await tx
      .update(phienDangNhap)
      .set({ thuHoiLuc: new Date() })
      .where(and(eq(phienDangNhap.taiKhoanId, tk.id), isNull(phienDangNhap.thuHoiLuc)))
    return 'da-dat-lai'
  })
}
