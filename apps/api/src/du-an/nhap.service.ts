import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import type { KetQuaNhapDuAn } from '@gdos/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { maLoiPg, trongPhamVi, TRUNG_KHOA } from '../db/pham-vi.js'
import { danhMucGiaTri, donVi, duAn, quyTrinhMau, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { DuAnService } from './du-an.service.js'
import type { TepTaiLen } from './ho-so.service.js'
import { docTepNhap, taoTepMau, tomTat, type DongDaDoc, type TraCuuNhap } from './nhap-excel.js'

/** Tệp nhập tối đa 5 MB — 500 dòng dự án chỉ vài chục KB. */
export const KICH_THUOC_TEP_NHAP = 5 * 1024 * 1024

/**
 * Nhập dự án từ Excel: tải mẫu → kiểm (không ghi) → nhập. Nhập là TẤT CẢ HOẶC
 * KHÔNG: một giao dịch, dòng nào sai thì không dòng nào vào. Mỗi dòng đi đúng
 * đường tạo tay (DuAnService.taoMot) — cùng luật phạm vi, cùng chép quy trình mẫu.
 */
@Injectable()
export class NhapDuAnService {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(DuAnService) private readonly duAnDv: DuAnService,
  ) {}

  private get db() {
    return dbCua(this.csdl)
  }

  async tepMau(nd: NguoiDungPhien): Promise<Buffer> {
    return taoTepMau(await this.traCuu(nd))
  }

  async kiemTra(nd: NguoiDungPhien, tep: TepTaiLen | undefined): Promise<KetQuaNhapDuAn> {
    return tomTat(await this.doc(nd, tep))
  }

  async nhap(nd: NguoiDungPhien, tep: TepTaiLen | undefined): Promise<{ soDuAn: number }> {
    const dong = await this.doc(nd, tep)
    const kq = tomTat(dong)
    if (kq.soLoi > 0)
      throw new BadRequestException(
        `Có ${kq.soLoi} dòng chưa hợp lệ — chưa nhập dự án nào. Kiểm tra tệp rồi thử lại.`,
      )
    try {
      await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        for (const d of dong) await this.duAnDv.taoMot(tx, nd, d.duLieu!)
      })
    } catch (e) {
      if (maLoiPg(e) === TRUNG_KHOA)
        throw new ConflictException('Có mã dự án đã tồn tại trên hệ thống — chưa nhập dự án nào')
      throw e
    }
    return { soDuAn: dong.length }
  }

  private async doc(nd: NguoiDungPhien, tep: TepTaiLen | undefined): Promise<DongDaDoc[]> {
    if (!tep) throw new BadRequestException('Chưa chọn tệp')
    if (!/\.xlsx$/i.test(tep.originalname)) throw new BadRequestException('Cần tệp Excel .xlsx')
    return docTepNhap(tep.buffer, await this.traCuu(nd), nd.taiKhoanId)
  }

  /** Danh mục để đối chiếu — tra trong phạm vi của người nhập (RLS). */
  private traCuu(nd: NguoiDungPhien): Promise<TraCuuNhap> {
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [dv, qt, lv, tk, ma] = await Promise.all([
        tx
          .select({ id: donVi.id, ma: donVi.ma, ten: donVi.ten })
          .from(donVi)
          .where(and(isNull(donVi.deletedAt), sql`${donVi.cap} <> 'doanh-nghiep'`))
          .orderBy(asc(donVi.ten)),
        tx
          .select({ ma: quyTrinhMau.ma, ten: quyTrinhMau.ten })
          .from(quyTrinhMau)
          .where(isNull(quyTrinhMau.deletedAt))
          .orderBy(asc(quyTrinhMau.thuTu)),
        tx
          .select({ id: danhMucGiaTri.id, ma: danhMucGiaTri.ma, ten: danhMucGiaTri.ten })
          .from(danhMucGiaTri)
          .where(and(eq(danhMucGiaTri.loai, 'linh-vuc'), isNull(danhMucGiaTri.deletedAt)))
          .orderBy(asc(danhMucGiaTri.thuTu)),
        tx
          .select({ id: taiKhoan.id, ten: taiKhoan.tenDangNhap })
          .from(taiKhoan)
          .where(isNull(taiKhoan.deletedAt)),
        tx.select({ ma: duAn.ma }).from(duAn),
      ])
      return {
        donVi: dv,
        quyTrinh: qt,
        linhVuc: lv,
        canBo: new Map(tk.map((t) => [t.ten.toLowerCase(), t.id])),
        maDaCo: new Set(ma.map((m) => m.ma.toUpperCase())),
      }
    })
  }
}
