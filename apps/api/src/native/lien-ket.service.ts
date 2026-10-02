import { ForbiddenException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { LienKetNativeDong } from '@gdos/shared'
import { eq } from 'drizzle-orm'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { chuoi } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type NguCanh } from '../db/pham-vi.js'
import { lienKetNative, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import type { CapToken, NguoiGoi } from './ket-noi-native.js'
import {
  HetLienKet,
  MaHoaBiMat,
  XAC_THUC_NATIVE,
  type PhienNative,
  type XacThucNative,
} from './xac-thuc-native.js'

const HET_LIEN_KET = 'Liên kết FOXAI Native đã hết hạn hoặc bị thu hồi — vào Cài đặt cá nhân để liên kết lại.'
/** Coi access token hết hạn sớm hơn thật 60 giây — tránh gửi token sắp hết giữa đường. */
const DU_PHONG_MS = 60_000

/**
 * Liên kết tài khoản FOXAI Native của từng người + cấp token gọi Native thay mặt họ
 * (ADR-0009). Mật khẩu Native chỉ đi qua một lần khi liên kết, không lưu. Refresh token
 * lưu ĐÃ MÃ HÓA; access token chỉ giữ trong bộ nhớ.
 */
@Injectable()
export class LienKetNativeService implements CapToken {
  private readonly maHoa: MaHoaBiMat
  private readonly boNho = new Map<string, { token: string; het: number }>()
  /** Refresh token xoay vòng: mỗi người chỉ làm mới MỘT lần tại một thời điểm. */
  private readonly dangLamMoi = new Map<string, Promise<string>>()

  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) cauHinh: CauHinh,
    @Inject(XAC_THUC_NATIVE) private readonly xacThuc: XacThucNative | null,
  ) {
    this.maHoa = new MaHoaBiMat(cauHinh.khoaKyVe)
  }

  private get db() {
    return dbCua(this.csdl)
  }

  private canXacThuc(): XacThucNative {
    if (!this.xacThuc)
      throw new ServiceUnavailableException('Chưa kết nối FOXAI Native — chưa liên kết được tài khoản.')
    return this.xacThuc
  }

  async trangThai(nd: NguoiDungPhien): Promise<LienKetNativeDong> {
    const [d] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select().from(lienKetNative).where(eq(lienKetNative.taiKhoanId, nd.taiKhoanId)),
    )
    const hopLe = !!d && this.maHoa.giai(d.refreshMaHoa) !== null
    return {
      coTheLienKet: !!this.xacThuc,
      daLienKet: hopLe,
      nativeUserId: hopLe ? d.nativeUserId : null,
      nativeTen: hopLe ? d.nativeTen : null,
      lienKetLuc: hopLe ? d.lienKetLuc.toISOString() : null,
    }
  }

  /** Đăng nhập Native bằng tài khoản của CHÍNH người này, lưu refresh token đã mã hóa. */
  async lienKet(nd: NguoiDungPhien, than: unknown): Promise<LienKetNativeDong> {
    const tenDangNhap = chuoi(than, 'tenDangNhap', 200, true)
    const matKhau = chuoi(than, 'matKhau', 200)
    const phien = await this.canXacThuc().dangNhap(tenDangNhap, matKhau)
    await this.luu(nd.nguCanh, phien, true)
    return this.trangThai(nd)
  }

  async huy(nd: NguoiDungPhien): Promise<LienKetNativeDong> {
    const cu = await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [d] = await tx.select().from(lienKetNative).where(eq(lienKetNative.taiKhoanId, nd.taiKhoanId))
      await tx.delete(lienKetNative).where(eq(lienKetNative.taiKhoanId, nd.taiKhoanId))
      await tx.update(taiKhoan).set({ nativeUserId: null }).where(eq(taiKhoan.id, nd.taiKhoanId))
      return d
    })
    this.boNho.delete(nd.taiKhoanId)
    const refresh = cu && this.maHoa.giai(cu.refreshMaHoa)
    // Thu hồi phiên phía Native cho sạch; Native không trả lời cũng không sao.
    if (refresh && this.xacThuc) await this.xacThuc.dangXuat(refresh).catch(() => undefined)
    return this.trangThai(nd)
  }

  /** CapToken: access token còn hạn thì dùng; hết thì làm mới bằng refresh token. */
  async layToken(ai: NguoiGoi): Promise<string> {
    const co = this.boNho.get(ai.taiKhoanId)
    if (co && co.het - DU_PHONG_MS > Date.now()) return co.token
    const dang = this.dangLamMoi.get(ai.taiKhoanId)
    if (dang) return dang
    const viec = this.lamMoi(ai.nguCanh).finally(() => this.dangLamMoi.delete(ai.taiKhoanId))
    this.dangLamMoi.set(ai.taiKhoanId, viec)
    return viec
  }

  /** Token Native của người đang dùng — cho cổng chuyển tiếp (chuyen-tiep.controller.ts). */
  tokenCua(nd: NguoiDungPhien): Promise<string> {
    return this.layToken({ taiKhoanId: nd.taiKhoanId, nguCanh: nd.nguCanh, nativeUserId: '', hoTen: '' })
  }

  /** Native vừa từ chối access token đang nhớ (401) — bỏ để lần sau làm mới. */
  quenToken(taiKhoanId: string): void {
    this.boNho.delete(taiKhoanId)
  }

  private async lamMoi(nc: NguCanh): Promise<string> {
    const [d] = await trongPhamVi(this.db, nc, (tx) =>
      tx.select().from(lienKetNative).where(eq(lienKetNative.taiKhoanId, nc.taiKhoanId)),
    )
    const refresh = d && this.maHoa.giai(d.refreshMaHoa)
    if (!refresh) throw new ForbiddenException(HET_LIEN_KET)
    try {
      const phien = await this.canXacThuc().lamMoi(refresh)
      await this.luu(nc, phien, false)
      return phien.accessToken
    } catch (e) {
      if (e instanceof HetLienKet) {
        // Native đã thu hồi phiên: gỡ liên kết để người dùng thấy và liên kết lại.
        await trongPhamVi(this.db, nc, (tx) =>
          tx.delete(lienKetNative).where(eq(lienKetNative.taiKhoanId, nc.taiKhoanId)),
        )
        throw new ForbiddenException(HET_LIEN_KET)
      }
      throw e
    }
  }

  private async luu(nc: NguCanh, phien: PhienNative, moi: boolean) {
    const dong = {
      nativeUserId: phien.nguoiDung.id,
      nativeTen: phien.nguoiDung.ten,
      refreshMaHoa: this.maHoa.ma(phien.refreshToken),
      lamMoiLuc: new Date(),
    }
    await trongPhamVi(this.db, nc, async (tx) => {
      if (moi) {
        await tx
          .insert(lienKetNative)
          .values({ taiKhoanId: nc.taiKhoanId, ...dong, lienKetLuc: new Date() })
          .onConflictDoUpdate({ target: lienKetNative.taiKhoanId, set: { ...dong, lienKetLuc: new Date() } })
        // native_user_id trên tài khoản — có nhật ký: ai liên kết tài khoản Native nào, lúc nào.
        await tx
          .update(taiKhoan)
          .set({ nativeUserId: phien.nguoiDung.id })
          .where(eq(taiKhoan.id, nc.taiKhoanId))
      } else {
        await tx.update(lienKetNative).set(dong).where(eq(lienKetNative.taiKhoanId, nc.taiKhoanId))
      }
    })
    this.boNho.set(nc.taiKhoanId, { token: phien.accessToken, het: Date.now() + phien.hetHanGiay * 1000 })
  }
}
