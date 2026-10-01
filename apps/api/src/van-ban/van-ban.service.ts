import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  DUOI_TEP_VAN_BAN,
  KICH_THUOC_VAN_BAN_TOI_DA,
  LOAI_VAN_BAN,
  type NguonVanBan,
  type TrangThaiVanBan,
  type TrangThaiXuLyVanBan,
  type VanBanChiTiet,
  type VanBanDong,
} from '@gdos/shared'
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { chuoi, chuoiHoacRong, maUuid, motTrong } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type GiaoDich } from '../db/pham-vi.js'
import { lienKetNative, taiKhoan, vanBan } from '../db/schema/index.js'
import type { TepTaiLen } from '../du-an/ho-so.service.js'
import { KHO_TEP, type KhoTep } from '../kho-tep/kho-tep.js'
import {
  KET_NOI_NATIVE,
  LoiNative,
  type KetNoiNative,
  type KetQuaTomTat,
  type NguoiGoi,
} from '../native/ket-noi-native.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

const COT = {
  id: vanBan.id,
  ten: vanBan.ten,
  loai: vanBan.loai,
  nguon: vanBan.nguon,
  tenTep: vanBan.tenTep,
  kichThuoc: vanBan.kichThuoc,
  trangThai: vanBan.trangThai,
  soKyTuGoc: vanBan.soKyTuGoc,
  soKyTuTomTat: vanBan.soKyTuTomTat,
  daHieuChinh: vanBan.daHieuChinh,
  nativeId: vanBan.nativeId,
  // Văn bản kéo về từ Native: người tạo ghi bên Native; còn lại: tài khoản GDOS.
  nguoiTao: sql<string | null>`coalesce(${vanBan.nguoiTaoNative}, ten_tai_khoan(${vanBan.nguoiTao}))`,
  donViTen: sql<string>`ten_don_vi(${vanBan.donViId})`,
  createdAt: vanBan.createdAt,
}
interface DongDb {
  id: string
  ten: string
  loai: string
  nguon: string
  tenTep: string
  kichThuoc: number | null
  trangThai: string
  soKyTuGoc: number | null
  soKyTuTomTat: number | null
  daHieuChinh: boolean
  nativeId: string | null
  nguoiTao: string | null
  donViTen: string
  createdAt: Date
}

const chuyen = (d: DongDb): VanBanDong => ({
  id: d.id,
  ten: d.ten,
  loai: d.loai,
  nguon: d.nguon as NguonVanBan,
  tenTep: d.tenTep,
  kichThuoc: d.kichThuoc,
  trangThai: d.trangThai as TrangThaiVanBan,
  soKyTuGoc: d.soKyTuGoc,
  soKyTuTomTat: d.soKyTuTomTat,
  tyLeRutGon:
    // Tóm tắt không ngắn hơn gốc (văn bản rất ngắn, bản giả) thì không có "rút gọn" để nói.
    d.soKyTuGoc && d.soKyTuTomTat && d.soKyTuTomTat < d.soKyTuGoc
      ? Math.round((1 - d.soKyTuTomTat / d.soKyTuGoc) * 1000) / 10
      : null,
  daHieuChinh: d.daHieuChinh,
  // Mã bản giả không có ở Native thật — không đưa ra ngoài.
  nativeId: d.nativeId && !d.nativeId.startsWith('gia-') ? d.nativeId : null,
  nguoiTao: d.nguoiTao,
  donViTen: d.donViTen,
  taoLuc: d.createdAt.toISOString(),
})

/** Trạng thái chưa xong — đọc lại từ Native khi có người xem. */
const DANG_CHAY: TrangThaiVanBan[] = ['cho', 'dang-xu-ly']
/** Mỗi lần xem danh sách chỉ hỏi Native tối đa chừng này văn bản đang chạy. */
const DONG_BO_TOI_DA = 20
/** Kéo văn bản từ Native về: tối đa chừng này văn bản mới nhất, mỗi người một lần mỗi phút. */
const KEO_VE_TOI_DA = 200
const KEO_VE_CACH_MS = 60_000

const NGUON_NATIVE: Record<string, NguonVanBan> = {
  QLVB: 'qlvb',
  CONG_DVC: 'cong-dvc',
  EMAIL: 'email',
  OTHER: 'khac',
  UPLOAD: 'tai-len',
}

/** Mã bản giả ("gia-…") không có ở Native thật — gửi lại từ tệp gốc thay vì gọi theo mã đó. */
const laMaGia = (nativeId: string) => nativeId.startsWith('gia-')

/**
 * Xử lý văn bản (ADR-0009): hồ sơ ở GDOS (RLS theo đơn vị), FOXAI Native xử lý. Văn
 * bản đã có trong tài khoản Native của người dùng được KÉO VỀ hồ sơ GDOS khi họ xem
 * danh sách (như màn của GDOS cũ). Gọi Native NGOÀI giao dịch database.
 */
@Injectable()
export class VanBanService {
  /** Lần kéo văn bản từ Native gần nhất của từng người. */
  private readonly keoVeLuc = new Map<string, number>()

  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(KHO_TEP) private readonly kho: KhoTep,
    @Inject(KET_NOI_NATIVE) private readonly native: KetNoiNative,
  ) {}

  private get db() {
    return dbCua(this.csdl)
  }

  /** Người đang dùng + liên kết Native của CHÍNH họ (null: chưa liên kết → không gọi Native). */
  private async toi(nd: NguoiDungPhien) {
    const [t] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({
          donViId: taiKhoan.donViId,
          hoTen: taiKhoan.hoTen,
          nativeUserId: lienKetNative.nativeUserId,
        })
        .from(taiKhoan)
        .leftJoin(lienKetNative, eq(lienKetNative.taiKhoanId, taiKhoan.id))
        .where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    if (!t) throw new ForbiddenException('Không đọc được tài khoản của bạn')
    const goi: NguoiGoi | null = t.nativeUserId
      ? { taiKhoanId: nd.taiKhoanId, nativeUserId: t.nativeUserId, hoTen: t.hoTen, nguCanh: nd.nguCanh }
      : null
    return { donViId: t.donViId, goi }
  }

  private canGoi(goi: NguoiGoi | null): NguoiGoi {
    if (!goi)
      throw new ForbiddenException(
        'Tài khoản chưa liên kết FOXAI Native — vào Cài đặt cá nhân › Liên kết FOXAI Native.',
      )
    return goi
  }

  async trangThai(nd: NguoiDungPhien): Promise<TrangThaiXuLyVanBan> {
    const { goi } = await this.toi(nd)
    return { cheDo: this.native.cheDo, moTa: this.native.moTa, daLienKet: !!goi }
  }

  async danhSach(nd: NguoiDungPhien): Promise<VanBanDong[]> {
    await this.keoTuNative(nd)
    await this.dongBo(nd)
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select(COT).from(vanBan).where(isNull(vanBan.deletedAt)).orderBy(desc(vanBan.createdAt)),
    )
    return ds.map((d) => chuyen(d))
  }

  async chiTiet(nd: NguoiDungPhien, id: string): Promise<VanBanChiTiet> {
    maUuid(id)
    await this.dongBo(nd, id)
    const { goi } = await this.toi(nd)
    const [d] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({
          ...COT,
          noiDungGoc: vanBan.noiDungGoc,
          tomTat: vanBan.tomTat,
          moHinh: vanBan.moHinh,
          loi: vanBan.loi,
        })
        .from(vanBan)
        .where(and(eq(vanBan.id, id), isNull(vanBan.deletedAt))),
    )
    if (!d) throw new NotFoundException('Không tìm thấy văn bản')
    return {
      ...chuyen(d),
      noiDungGoc: d.noiDungGoc,
      tomTat: d.tomTat,
      moHinh: d.moHinh,
      loi: d.loi,
      quyen: {
        xuLy: !!goi && this.native.cheDo !== 'chua' && nd.quyen.has('VAN_BAN.UPDATE'),
        sua: nd.quyen.has('VAN_BAN.UPDATE'),
        xoa: nd.quyen.has('VAN_BAN.DELETE'),
      },
    }
  }

  /** Tải lên + gửi Native tóm tắt. Native lỗi: văn bản vẫn lưu với trạng thái lỗi. */
  async taiLen(nd: NguoiDungPhien, tep: TepTaiLen | undefined, than: unknown): Promise<VanBanChiTiet> {
    if (!tep) throw new BadRequestException('Chưa chọn tệp')
    if (tep.size > KICH_THUOC_VAN_BAN_TOI_DA) throw new BadRequestException('Tệp quá 20 MB')
    // Tên gốc từ trình duyệt: multer đọc theo latin1 — đổi lại UTF-8 để giữ dấu tiếng Việt.
    const tenTep = Buffer.from(tep.originalname, 'latin1').toString('utf8').replace(/[\\/]/g, '_').slice(-200)
    const duoi = tenTep.split('.').pop()?.toLowerCase() ?? ''
    if (!(DUOI_TEP_VAN_BAN as readonly string[]).includes(duoi))
      throw new BadRequestException(`Chỉ nhận tệp: ${DUOI_TEP_VAN_BAN.join(', ')}`)
    const loai = motTrong(than, 'loai', LOAI_VAN_BAN)
    if (!loai) throw new BadRequestException(`"loai" phải là một trong: ${LOAI_VAN_BAN.join(', ')}`)
    const ten = chuoiHoacRong(than, 'ten', 500) ?? tenTep.replace(/\.[^.]+$/, '')

    const { donViId, goi } = await this.toi(nd)
    const ai = this.canGoi(goi)
    if (this.native.cheDo === 'chua')
      throw new ServiceUnavailableException(`Chưa kết nối FOXAI Native. ${this.native.moTa}`)

    const id = randomUUID()
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const khoaTep = `van-ban/${donViId}/${id}`
      await tx.insert(vanBan).values({
        id,
        donViId,
        ten,
        loai,
        tenTep,
        khoaTep,
        loaiTep: tep.mimetype.slice(0, 100) || 'application/octet-stream',
        kichThuoc: tep.size,
        nguoiTao: nd.taiKhoanId,
      })
      // Ghi tệp TRONG giao dịch: ghi hỏng thì dòng database cũng không còn.
      await this.kho.ghi(khoaTep, tep.buffer)
    })
    await this.gui(nd, id, { ten, loai, tenTep, mime: tep.mimetype, noiDung: tep.buffer, tuDong: true }, ai)
    return this.chiTiet(nd, id)
  }

  /**
   * Gửi lại (chưa gửi được) hoặc tóm tắt lại. Mã bản giả, hoặc Native báo không còn văn
   * bản (404, 422) → gửi lại từ tệp gốc trong kho GDOS thay vì gọi theo mã cũ.
   */
  async chayLai(nd: NguoiDungPhien, id: string): Promise<VanBanChiTiet> {
    const vb = await this.mot(nd, id)
    const ai = this.canGoi((await this.toi(nd)).goi)
    if (vb.trangThai === 'dang-xu-ly')
      throw new BadRequestException('AI đang tóm tắt văn bản này — chờ xong đã')
    const guiLaiTuTep = async () => {
      if (!vb.khoaTep) throw new BadRequestException('Văn bản không có tệp gốc trong GDOS để gửi lại')
      const noiDung = await docHet(await this.kho.mo(vb.khoaTep))
      await this.gui(
        nd,
        id,
        {
          ten: vb.ten,
          loai: vb.loai,
          tenTep: vb.tenTep,
          mime: vb.loaiTep ?? 'application/octet-stream',
          noiDung,
          tuDong: true,
        },
        ai,
      )
    }
    if (!vb.nativeId || (laMaGia(vb.nativeId) && this.native.cheDo === 'that')) await guiLaiTuTep()
    else {
      try {
        await this.capNhat(nd, id, await this.native.chayLai(vb.nativeId, ai))
      } catch (e) {
        if (e instanceof LoiNative && (e.ma === 404 || e.ma === 422) && vb.khoaTep) await guiLaiTuTep()
        else await this.capNhat(nd, id, { loi: e instanceof Error ? e.message : String(e) })
      }
    }
    return this.chiTiet(nd, id)
  }

  /** Sửa bản tóm tắt: GDOS là nơi giữ; báo sang Native nếu gọi được (không được thì thôi). */
  async suaTomTat(nd: NguoiDungPhien, id: string, than: unknown): Promise<VanBanChiTiet> {
    const tomTat = chuoi(than, 'tomTat', 50_000, true)
    const vb = await this.mot(nd, id)
    await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .update(vanBan)
        .set({ tomTat, soKyTuTomTat: tomTat.length, daHieuChinh: true, trangThai: 'xong', loi: null })
        .where(eq(vanBan.id, id)),
    )
    const { goi } = await this.toi(nd)
    if (vb.nativeId && !laMaGia(vb.nativeId) && goi && this.native.cheDo !== 'chua')
      await this.native.suaTomTat(vb.nativeId, tomTat, goi).catch(() => undefined)
    return this.chiTiet(nd, id)
  }

  /** Xóa (mềm) ở GDOS và xóa bên Native. Dòng xóa mềm giữ mã Native — lần kéo sau không kéo lại. */
  async xoa(nd: NguoiDungPhien, id: string): Promise<{ ok: true }> {
    const vb = await this.mot(nd, id)
    await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.update(vanBan).set({ deletedAt: new Date() }).where(eq(vanBan.id, id)),
    )
    const { goi } = await this.toi(nd)
    if (vb.nativeId && !laMaGia(vb.nativeId) && goi && this.native.cheDo !== 'chua')
      await this.native.xoa(vb.nativeId, goi).catch(() => undefined)
    return { ok: true }
  }

  /** Tệp gốc: trong kho GDOS; văn bản kéo về từ Native thì tải từ Native. */
  async moTep(
    nd: NguoiDungPhien,
    id: string,
  ): Promise<{ ten: string; loai: string; kichThuoc: number; noiDung: Readable }> {
    const vb = await this.mot(nd, id)
    if (vb.khoaTep) {
      try {
        return {
          ten: vb.tenTep,
          loai: vb.loaiTep ?? 'application/octet-stream',
          kichThuoc: vb.kichThuoc ?? 0,
          noiDung: await this.kho.mo(vb.khoaTep),
        }
      } catch {
        throw new NotFoundException('Tệp không còn trong kho — liên hệ bộ phận kỹ thuật')
      }
    }
    if (!vb.nativeId) throw new NotFoundException('Văn bản không có tệp gốc')
    const t = await this.native.taiTep(vb.nativeId, this.canGoi((await this.toi(nd)).goi))
    return { ten: t.ten, loai: t.loai, kichThuoc: t.noiDung.length, noiDung: Readable.from(t.noiDung) }
  }

  // ── nội bộ ─────────────────────────────────────────────────────────────

  private async mot(nd: NguoiDungPhien, id: string) {
    const [vb] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select()
        .from(vanBan)
        .where(and(eq(vanBan.id, maUuid(id)), isNull(vanBan.deletedAt))),
    )
    if (!vb) throw new NotFoundException('Không tìm thấy văn bản')
    return vb
  }

  private async gui(
    nd: NguoiDungPhien,
    id: string,
    tep: Parameters<KetNoiNative['guiTomTat']>[0],
    ai: NguoiGoi,
  ) {
    await this.capNhat(nd, id, await this.thu(() => this.native.guiTomTat(tep, ai)))
  }

  /** Gọi Native; lỗi thì trả lỗi thành dữ liệu để lưu vào văn bản, không làm hỏng yêu cầu. */
  private async thu(viec: () => Promise<KetQuaTomTat>): Promise<KetQuaTomTat | { loi: string }> {
    try {
      return await viec()
    } catch (e) {
      return { loi: e instanceof Error ? e.message : String(e) }
    }
  }

  private capNhat(nd: NguoiDungPhien, id: string, kq: KetQuaTomTat | { loi: string }) {
    return trongPhamVi(this.db, nd.nguCanh, (tx) => ghiKetQua(tx, id, kq))
  }

  /**
   * Kéo văn bản đã có trong tài khoản Native của người này về hồ sơ GDOS (đơn vị của họ).
   * Mỗi người tối đa một lần mỗi phút. Đã có mã Native trong GDOS (kể cả đã xóa) thì bỏ qua.
   */
  private async keoTuNative(nd: NguoiDungPhien) {
    if (this.native.cheDo === 'chua') return
    const truoc = this.keoVeLuc.get(nd.taiKhoanId)
    if (truoc && Date.now() - truoc < KEO_VE_CACH_MS) return
    const { donViId, goi } = await this.toi(nd)
    if (!goi) return
    this.keoVeLuc.set(nd.taiKhoanId, Date.now())
    let ds
    try {
      ds = await this.native.dsTomTat(goi, KEO_VE_TOI_DA)
    } catch {
      return // Native không trả lời: danh sách vẫn hiện văn bản đã có trong GDOS.
    }
    if (ds.length === 0) return
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const co = await tx
        .select({ nativeId: vanBan.nativeId })
        .from(vanBan)
        .where(
          inArray(
            vanBan.nativeId,
            ds.map((d) => d.nativeId),
          ),
        )
      const daCo = new Set(co.map((c) => c.nativeId))
      const moi = ds.filter((d) => !daCo.has(d.nativeId))
      if (moi.length === 0) return
      await tx.insert(vanBan).values(
        moi.map((d) => ({
          donViId,
          ten: d.ten.slice(0, 500),
          loai: d.loai,
          nguon: (d.nguon && NGUON_NATIVE[d.nguon]) || 'tai-len',
          tenTep: d.ten.slice(0, 200),
          nativeId: d.nativeId,
          trangThai: d.trangThai,
          soKyTuGoc: d.soKyTuGoc,
          soKyTuTomTat: d.soKyTuTomTat,
          loi: d.loi ?? null,
          nguoiTao: nd.taiKhoanId,
          nguoiTaoNative: d.nguoiTao,
          createdAt: d.taoLuc ? new Date(d.taoLuc) : new Date(),
          dongBoLuc: new Date(),
        })),
      )
    })
  }

  /**
   * Hỏi Native bằng token của NGƯỜI ĐANG XEM (đã liên kết): văn bản đang chạy; khi mở
   * một văn bản, cả văn bản đã xong mà GDOS chưa có nội dung (vừa kéo về từ Native).
   */
  private async dongBo(nd: NguoiDungPhien, chiId?: string) {
    if (this.native.cheDo === 'chua') return
    const { goi } = await this.toi(nd)
    if (!goi) return
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({ id: vanBan.id, nativeId: vanBan.nativeId })
        .from(vanBan)
        .where(
          and(
            isNull(vanBan.deletedAt),
            sql`${vanBan.nativeId} is not null`,
            chiId
              ? and(
                  eq(vanBan.id, chiId),
                  or(inArray(vanBan.trangThai, DANG_CHAY), isNull(vanBan.tomTat), isNull(vanBan.noiDungGoc)),
                )
              : inArray(vanBan.trangThai, DANG_CHAY),
          ),
        )
        .limit(DONG_BO_TOI_DA),
    )
    for (const v of ds) {
      if (this.native.cheDo === 'that' && laMaGia(v.nativeId!)) continue
      const kq = await this.thu(() => this.native.docTomTat(v.nativeId!, goi))
      // Đọc lỗi (mạng chập chờn, hết liên kết) không đánh dấu văn bản là lỗi — lần sau đọc lại.
      if (!('nativeId' in kq)) continue
      await this.capNhat(nd, v.id, kq)
    }
  }
}

async function ghiKetQua(tx: GiaoDich, id: string, kq: KetQuaTomTat | { loi: string }) {
  if (!('nativeId' in kq)) {
    await tx
      .update(vanBan)
      .set({
        trangThai: 'loi',
        loi: `Chưa gửi được tới FOXAI Native: ${kq.loi}`.slice(0, 1000),
        dongBoLuc: new Date(),
      })
      .where(eq(vanBan.id, id))
    return
  }
  await tx
    .update(vanBan)
    .set({
      nativeId: kq.nativeId,
      trangThai: kq.trangThai,
      soKyTuGoc: kq.soKyTuGoc,
      soKyTuTomTat: kq.soKyTuTomTat,
      ...(kq.noiDungGoc != null ? { noiDungGoc: kq.noiDungGoc } : {}),
      ...(kq.tomTat != null ? { tomTat: kq.tomTat } : {}),
      ...(kq.moHinh != null ? { moHinh: kq.moHinh } : {}),
      loi: kq.loi ?? null,
      dongBoLuc: new Date(),
    })
    .where(eq(vanBan.id, id))
}

async function docHet(luong: Readable): Promise<Buffer> {
  const phan: Buffer[] = []
  for await (const c of luong) phan.push(Buffer.isBuffer(c) ? c : Buffer.from(c as Uint8Array))
  return Buffer.concat(phan)
}
