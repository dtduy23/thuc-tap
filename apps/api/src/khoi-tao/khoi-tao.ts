/**
 * Khởi tạo hệ thống lần đầu: đơn vị gốc + quản trị viên đầu tiên (ADR-0003).
 *
 * Chạy bằng CHỦ BẢNG (vượt RLS) — đúng một lần lúc cài đặt, qua lệnh CLI trên
 * server. Không có màn hình nào làm được việc này, và không có tài khoản hay
 * mật khẩu mặc định nào trong mã.
 *
 * Gọi lại khi đã có quản trị viên thì KHÔNG làm gì — không bao giờ ghi đè.
 */
import { eq } from 'drizzle-orm'
import type { CoSo } from '../db/pham-vi.js'
import { donVi, phanCong, taiKhoan } from '../db/schema/index.js'
import { bamMatKhau, kiemTraMatKhauMoi } from '../xac-thuc/mat-khau.js'

export interface ThamSoKhoiTao {
  donVi: { ma: string; ten: string; cap: 'tinh' | 'xa' }
  quanTri: { tenDangNhap: string; hoTen: string; matKhau: string }
  /**
   * Gán thêm Lãnh đạo + Chuyên viên phạm vi "tất cả" — "admin thấy hết" lúc
   * XÂY DỰNG (ADR-0006). Triển khai thật thì KHÔNG bật: cán bộ CNTT chỉ cần cờ
   * quản trị, không tự động đọc hồ sơ của dân.
   */
  toanQuyen: boolean
}

export type KetQuaKhoiTao = 'da-co-quan-tri' | 'da-tao'

export async function khoiTaoHeThong(chuBang: CoSo, ts: ThamSoKhoiTao): Promise<KetQuaKhoiTao> {
  const loi = kiemTraMatKhauMoi(ts.quanTri.matKhau, ts.quanTri.tenDangNhap)
  if (loi) throw new Error(loi)
  const bam = await bamMatKhau(ts.quanTri.matKhau)

  return chuBang.transaction(async (tx) => {
    const [daCo] = await tx
      .select({ id: taiKhoan.id })
      .from(taiKhoan)
      .where(eq(taiKhoan.laQuanTri, true))
      .limit(1)
    if (daCo) return 'da-co-quan-tri'

    const [dvCo] = await tx.select({ id: donVi.id }).from(donVi).where(eq(donVi.ma, ts.donVi.ma))
    const dv = dvCo ?? (await tx.insert(donVi).values(ts.donVi).returning({ id: donVi.id }))[0]!

    const [tk] = await tx
      .insert(taiKhoan)
      .values({
        donViId: dv.id,
        tenDangNhap: ts.quanTri.tenDangNhap,
        hoTen: ts.quanTri.hoTen,
        matKhauBam: bam,
        laQuanTri: true,
      })
      .returning({ id: taiKhoan.id })

    if (ts.toanQuyen) {
      await tx.insert(phanCong).values([
        { taiKhoanId: tk!.id, donViId: dv.id, vai: 'LANH_DAO', phamVi: null },
        { taiKhoanId: tk!.id, donViId: dv.id, vai: 'CHUYEN_VIEN', phamVi: null },
      ])
    }
    return 'da-tao'
  })
}
