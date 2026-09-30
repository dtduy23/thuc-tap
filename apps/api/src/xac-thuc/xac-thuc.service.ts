import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { DANH_SACH_MODULE, tinhQuyen, type MaVai, type PhanCong } from '@gdos/shared'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'
import { createHash, randomBytes } from 'node:crypto'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu } from '../db/co-so-du-lieu.js'
import { khongNguCanh, trongPhamVi, truyVan, type CoSo, type NguCanh } from '../db/pham-vi.js'
import { donVi, phanCong, phienDangNhap, taiKhoan } from '../db/schema/index.js'
import type { NguoiDungPhien } from './bao-ve.js'
import { THOI_HAN_PHIEN_NGAY } from './cookie.js'
import { bamMatKhau, kiemMatKhau, kiemTraMatKhauMoi, layBamGia } from './mat-khau.js'
import { kyVe, THOI_HAN_VE_GIAY, type NoiDungVe } from './ve.js'

export interface ThietBi {
  ip: string | undefined
  trinhDuyet: string | undefined
}

/** Những gì web cần biết về người đang đăng nhập — KHÔNG có gì bí mật. */
export interface ThongTinToi {
  id: string
  tenDangNhap: string
  hoTen: string
  laQuanTri: boolean
  donVi: { id: string; ten: string; cap: string }
  phanCong: PhanCong[]
  /** Web đưa thẳng vào locTheoQuyen() để dựng cây — cùng tập API dùng để chặn. */
  quyen: string[]
}

export interface KetQuaPhien {
  ve: string
  tokenPhien: string
  thongTin: ThongTinToi
}

interface DongDangNhap {
  id: string
  don_vi_id: string
  mat_khau_bam: string
  trang_thai: string
  khoa_den: string | null
  la_quan_tri: boolean
}

/** Token làm mới chỉ lưu bản băm — lộ database cũng không lộ phiên của ai. */
const bamToken = (t: string) => createHash('sha256').update(t).digest('hex')

/** Một câu cho mọi kiểu sai — không cho kẻ dò biết tên đăng nhập nào có thật. */
const SAI_DANG_NHAP = 'Tên đăng nhập hoặc mật khẩu không đúng'

@Injectable()
export class XacThucService {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
  ) {}

  private get db(): CoSo {
    if (!this.csdl.db) throw new ServiceUnavailableException('Chưa nối cơ sở dữ liệu')
    return this.csdl.db
  }

  async dangNhap(tenDangNhap: string, matKhau: string, tb: ThietBi): Promise<KetQuaPhien> {
    const [tk] = await khongNguCanh(this.db, (tx) =>
      truyVan<DongDangNhap>(tx, sql`select * from dang_nhap_tim(${tenDangNhap})`),
    )
    if (!tk) {
      await kiemMatKhau(matKhau, await layBamGia()) // cân thời gian phản hồi — xem mat-khau.ts
      throw new UnauthorizedException(SAI_DANG_NHAP)
    }
    // Đang bị khóa tạm thì không kiểm mật khẩu nữa — dò tiếp cũng vô ích.
    if (tk.khoa_den && new Date(tk.khoa_den) > new Date()) {
      const phut = Math.ceil((new Date(tk.khoa_den).getTime() - Date.now()) / 60_000)
      throw new HttpException(
        `Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ${phut} phút.`,
        HttpStatus.LOCKED,
      )
    }

    const dung = await kiemMatKhau(matKhau, tk.mat_khau_bam)
    await khongNguCanh(this.db, (tx) => tx.execute(sql`select dang_nhap_ghi(${tk.id}::uuid, ${dung})`))
    if (!dung) throw new UnauthorizedException(SAI_DANG_NHAP)
    // Báo "bị khóa" chỉ SAU khi mật khẩu đúng — người lạ không dò được tài khoản nào bị khóa.
    if (tk.trang_thai !== 'hoat-dong')
      throw new ForbiddenException('Tài khoản đã bị khóa. Liên hệ quản trị hệ thống.')

    return this.moPhien(tk.id, tk.don_vi_id, tk.la_quan_tri, tb)
  }

  async lamMoi(tokenCu: string, tb: ThietBi): Promise<KetQuaPhien> {
    const tokenMoi = randomBytes(32).toString('base64url')
    const [p] = await khongNguCanh(this.db, (tx) =>
      truyVan<{ tai_khoan_id: string; don_vi_id: string; la_quan_tri: boolean }>(
        tx,
        sql`select * from phien_doi(${bamToken(tokenCu)}, ${bamToken(tokenMoi)}, ${hetHanPhien()},
                                    ${tb.ip ?? null}, ${tb.trinhDuyet ?? null})`,
      ),
    )
    if (!p) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    const nd = await this.dungVe(p.tai_khoan_id, p.don_vi_id, p.la_quan_tri)
    return { ve: kyVe(nd, this.cauHinh.khoaKyVe), tokenPhien: tokenMoi, thongTin: await this.thongTin(nd) }
  }

  async dangXuat(token: string): Promise<void> {
    await khongNguCanh(this.db, (tx) => tx.execute(sql`select phien_thu_hoi(${bamToken(token)})`))
  }

  async thongTinCua(nd: NguoiDungPhien): Promise<ThongTinToi> {
    return this.thongTin({
      tk: nd.taiKhoanId,
      dv: nd.donViIds,
      qt: nd.laQuanTri,
      pc: nd.phanCong.map((p) => ({ v: p.vai, p: p.phamVi === 'tat-ca' ? null : [...p.phamVi] })),
      het: 0,
    })
  }

  /**
   * Đổi mật khẩu của chính mình. Xong thì thu hồi MỌI phiên khác — nếu đổi vì
   * nghi bị lộ, kẻ đang cầm phiên cũ phải bị đá ra ngay.
   */
  async doiMatKhau(nd: NguoiDungPhien, matKhauCu: string, matKhauMoi: string, tokenHienTai?: string) {
    const [tk] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select({ ten: taiKhoan.tenDangNhap }).from(taiKhoan).where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    if (!tk) throw new UnauthorizedException('Không tìm thấy tài khoản')
    const [dong] = await khongNguCanh(this.db, (tx) =>
      truyVan<DongDangNhap>(tx, sql`select * from dang_nhap_tim(${tk.ten})`),
    )
    if (!dong || !(await kiemMatKhau(matKhauCu, dong.mat_khau_bam)))
      throw new BadRequestException('Mật khẩu hiện tại không đúng')
    const loi = kiemTraMatKhauMoi(matKhauMoi, tk.ten)
    if (loi) throw new BadRequestException(loi)

    const bamMoi = await bamMatKhau(matKhauMoi)
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      await tx
        .update(taiKhoan)
        .set({ matKhauBam: bamMoi, doiMatKhauLuc: new Date() })
        .where(eq(taiKhoan.id, nd.taiKhoanId))
      await tx
        .update(phienDangNhap)
        .set({ thuHoiLuc: new Date() })
        .where(
          and(
            eq(phienDangNhap.taiKhoanId, nd.taiKhoanId),
            isNull(phienDangNhap.thuHoiLuc),
            tokenHienTai ? ne(phienDangNhap.tokenBam, bamToken(tokenHienTai)) : undefined,
          ),
        )
    })
  }

  // ── nội bộ ──────────────────────────────────────────────────────────────

  private async moPhien(taiKhoanId: string, donViId: string, laQuanTri: boolean, tb: ThietBi) {
    const nd = await this.dungVe(taiKhoanId, donViId, laQuanTri)
    const tokenPhien = randomBytes(32).toString('base64url')
    await trongPhamVi(this.db, nguCanhCua(nd), (tx) =>
      tx.insert(phienDangNhap).values({
        taiKhoanId,
        tokenBam: bamToken(tokenPhien),
        hetHan: hetHanPhien(),
        diaChiIp: tb.ip ?? null,
        trinhDuyet: tb.trinhDuyet?.slice(0, 300) ?? null,
      }),
    )
    return { ve: kyVe(nd, this.cauHinh.khoaKyVe), tokenPhien, thongTin: await this.thongTin(nd) }
  }

  /** Nội dung vé: phạm vi đơn vị (kể cả cấp dưới) + phân công còn hiệu lực. */
  private async dungVe(taiKhoanId: string, donViId: string, laQuanTri: boolean): Promise<NoiDungVe> {
    const [pv] = await khongNguCanh(this.db, (tx) =>
      truyVan<{ ids: string[] }>(tx, sql`select don_vi_pham_vi(${donViId}::uuid) as ids`),
    )
    const donViIds = pv?.ids ?? []
    if (donViIds.length === 0) throw new ForbiddenException('Đơn vị của tài khoản không còn hoạt động')

    const ds = await trongPhamVi(this.db, { taiKhoanId, donViIds }, (tx) =>
      tx
        .select({ vai: phanCong.vai, phamVi: phanCong.phamVi })
        .from(phanCong)
        .where(and(eq(phanCong.taiKhoanId, taiKhoanId), isNull(phanCong.deletedAt))),
    )
    return {
      tk: taiKhoanId,
      dv: donViIds,
      qt: laQuanTri,
      pc: ds.map((p) => ({ v: p.vai as MaVai, p: p.phamVi })),
      het: Math.floor(Date.now() / 1000) + THOI_HAN_VE_GIAY,
    }
  }

  private async thongTin(nd: NoiDungVe): Promise<ThongTinToi> {
    const [dong] = await trongPhamVi(this.db, nguCanhCua(nd), (tx) =>
      tx
        .select({
          id: taiKhoan.id,
          tenDangNhap: taiKhoan.tenDangNhap,
          hoTen: taiKhoan.hoTen,
          laQuanTri: taiKhoan.laQuanTri,
          donViId: donVi.id,
          donViTen: donVi.ten,
          donViCap: donVi.cap,
        })
        .from(taiKhoan)
        .innerJoin(donVi, eq(donVi.id, taiKhoan.donViId))
        .where(eq(taiKhoan.id, nd.tk)),
    )
    if (!dong) throw new UnauthorizedException('Không tìm thấy tài khoản')
    const pc: PhanCong[] = nd.pc.map((p) => ({ vai: p.v, phamVi: p.p ?? 'tat-ca' }))
    return {
      id: dong.id,
      tenDangNhap: dong.tenDangNhap,
      hoTen: dong.hoTen,
      laQuanTri: dong.laQuanTri,
      donVi: { id: dong.donViId, ten: dong.donViTen, cap: dong.donViCap },
      phanCong: pc,
      quyen: [...tinhQuyen(DANH_SACH_MODULE, pc, nd.qt)].sort(),
    }
  }
}

const nguCanhCua = (nd: NoiDungVe): NguCanh => ({ taiKhoanId: nd.tk, donViIds: nd.dv })
const hetHanPhien = () => new Date(Date.now() + THOI_HAN_PHIEN_NGAY * 24 * 3600 * 1000)
