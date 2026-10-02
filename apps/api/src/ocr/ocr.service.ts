import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import type {
  ChungTuOcr,
  DinhNghiaOcr,
  GiaTriOcr,
  KetQuaDongBoLoaiOcr,
  KetQuaLayVeOcr,
  LoaiChungTuOcr,
  TrangThaiChungTuOcr,
} from '@gdos/shared'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi } from '../db/pham-vi.js'
import { ocrChungTu, ocrLoai, taiKhoan } from '../db/schema/index.js'
import { GOI_NATIVE } from '../native/chuyen-tiep.controller.js'
import { thongDiepLoiNative } from '../native/chuyen-tiep.js'
import { LienKetNativeService } from '../native/lien-ket.service.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import {
  dongTuNative,
  dsTuNative,
  ketQuaTuNative,
  loaiTuNative,
  type KetQuaTuNative,
  type LoaiTuNative,
} from './ocr-native.js'

const HET_LIEN_KET = 'Liên kết FOXAI Native đã hết hạn hoặc bị thu hồi — vào Cài đặt cá nhân để liên kết lại.'
const HET_GIO_MS = 30_000
/** Mỗi lần lấy về duyệt tối đa chừng này chứng từ mới nhất trên Native (10 trang × 100). */
const CO_TRANG = 100
const SO_TRANG_TOI_DA = 10
/** Số lời gọi Native chạy cùng lúc. */
const SONG_SONG = 4
/** Danh sách trả về cho màn hình / trang khác. */
const GIOI_HAN_DOC = 2000

async function theoLo<T, R>(ds: readonly T[], viec: (x: T) => Promise<R>): Promise<R[]> {
  const kq: R[] = []
  for (let i = 0; i < ds.length; i += SONG_SONG)
    kq.push(...(await Promise.all(ds.slice(i, i + SONG_SONG).map(viec))))
  return kq
}

/**
 * Quản trị › Kết nối › Nhận dạng chứng từ (OCR): nối OCR Service của FOXAI Native và LẤY
 * KẾT QUẢ VỀ kho của GDOS (RLS theo đơn vị). GDOS chỉ đọc Native — không tải lên, không
 * sửa gì bên đó. Gọi Native bằng token của CHÍNH người bấm (ADR-0009), NGOÀI giao dịch
 * database. Kết quả giữ nguyên dạng động (trường → giá trị); dùng thế nào là việc của
 * phân hệ tác nghiệp — gọi `danhSach()` / `GET /api/ocr/chung-tu`.
 */
@Injectable()
export class OcrService {
  /** Đơn vị đang có một lần lấy về chạy dở. */
  private readonly dangLay = new Set<string>()

  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
    @Inject(LienKetNativeService) private readonly lienKet: LienKetNativeService,
    @Inject(GOI_NATIVE) private readonly goi: typeof fetch,
  ) {}

  private get db() {
    return dbCua(this.csdl)
  }

  get cheDo(): 'that' | 'chua' {
    return this.cauHinh.native.url && !this.cauHinh.native.gia ? 'that' : 'chua'
  }

  get diaChi(): string | null {
    return this.cheDo === 'that' ? this.cauHinh.native.url! : null
  }

  private goc(): string {
    if (!this.diaChi)
      throw new ServiceUnavailableException(
        'Nhận dạng chứng từ cần FOXAI Native thật (NATIVE_URL) — bản giả không có OCR.',
      )
    return this.diaChi
  }

  /** Máy chủ OCR có trả lời không (không cần đăng nhập: 401 cũng là "có trả lời"). */
  async kiemTra(): Promise<{ ok: boolean; thongDiep: string }> {
    if (!this.diaChi) return { ok: false, thongDiep: 'Chưa nối Native thật (NATIVE_URL).' }
    try {
      const res = await this.goi(`${this.diaChi}/api/ocr/schemas`, { signal: AbortSignal.timeout(8000) })
      return { ok: res.status < 500, thongDiep: `Máy chủ OCR trả lời HTTP ${res.status}.` }
    } catch (e) {
      return {
        ok: false,
        thongDiep: `Không tới được máy chủ OCR: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }

  private async hoi(nd: NguoiDungPhien, duongDan: string): Promise<unknown> {
    const goc = this.goc()
    const gui = (token: string) =>
      this.goi(`${goc}/api/ocr${duongDan}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(HET_GIO_MS),
      }).catch(() => {
        throw new ServiceUnavailableException('Không tới được FOXAI Native — vui lòng thử lại sau.')
      })
    let kq = await gui(await this.lienKet.tokenCua(nd))
    if (kq.status === 401) {
      this.lienKet.quenToken(nd.taiKhoanId)
      kq = await gui(await this.lienKet.tokenCua(nd))
      if (kq.status === 401) throw new ForbiddenException(HET_LIEN_KET)
    }
    if (!kq.ok)
      throw new HttpException(
        thongDiepLoiNative(kq.status, await kq.text()),
        kq.status >= 500 ? 502 : kq.status,
      )
    return kq.json()
  }

  /** Đọc hết các trang của một danh sách (Native trả mảng trần thì chỉ có một trang). */
  private async moiTrang(
    nd: NguoiDungPhien,
    duongDan: string,
  ): Promise<{ dong: unknown[]; conNua: boolean }> {
    const dong: unknown[] = []
    for (let trang = 1; trang <= SO_TRANG_TOI_DA; trang++) {
      const r = await this.hoi(nd, `${duongDan}?page=${trang}&pageSize=${CO_TRANG}`)
      const ds = dsTuNative(r)
      dong.push(...ds)
      const tongTrang =
        r !== null && typeof r === 'object' && 'totalPages' in r && typeof r.totalPages === 'number'
          ? r.totalPages
          : 1
      if (Array.isArray(r) || ds.length === 0 || trang >= tongTrang) return { dong, conNua: false }
    }
    return { dong, conNua: true }
  }

  /** Đơn vị của người đang thao tác — kết quả lấy về thuộc đơn vị này. */
  private async donViCua(nd: NguoiDungPhien): Promise<string> {
    const [t] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select({ donViId: taiKhoan.donViId }).from(taiKhoan).where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    if (!t) throw new ForbiddenException('Không đọc được tài khoản của bạn')
    return t.donViId
  }

  // ── Loại chứng từ ─────────────────────────────────────────────────────────

  async dsLoai(nd: NguoiDungPhien, chiBat = false): Promise<LoaiChungTuOcr[]> {
    const { loai, dem } = await trongPhamVi(this.db, nd.nguCanh, async (tx) => ({
      loai: await tx.select().from(ocrLoai).where(isNull(ocrLoai.deletedAt)).orderBy(ocrLoai.ten),
      dem: await tx
        .select({ ma: ocrChungTu.maLoai, so: sql<number>`count(*)::int` })
        .from(ocrChungTu)
        .where(isNull(ocrChungTu.deletedAt))
        .groupBy(ocrChungTu.maLoai),
    }))
    const so = new Map(dem.map((d) => [d.ma, d.so]))
    // Người thấy nhiều đơn vị: cùng một mã loại gộp làm một (bật ở đơn vị nào cũng tính là bật).
    const theoMa = new Map<string, LoaiChungTuOcr>()
    for (const l of loai) {
      const co = theoMa.get(l.ma)
      if (co) {
        co.bat ||= l.bat
        continue
      }
      const dn = l.dinhNghia as DinhNghiaOcr
      theoMa.set(l.ma, {
        ma: l.ma,
        ten: l.ten,
        moTa: l.moTa,
        hoatDong: l.hoatDong,
        bat: l.bat,
        soChungTu: so.get(l.ma) ?? 0,
        dongBoLuc: l.dongBoLuc.toISOString(),
        truong: dn.truong,
        bang: dn.bang,
      })
    }
    return [...theoMa.values()].filter((l) => !chiBat || l.bat)
  }

  /** Chụp lại danh sách loại + định nghĩa trường từ Native. Loại mới mặc định CHƯA bật. */
  async dongBoLoai(nd: NguoiDungPhien): Promise<KetQuaDongBoLoaiOcr> {
    const donViId = await this.donViCua(nd)
    // /schemas không phân trang — Native từ chối tham số page / pageSize (400).
    const dong = dsTuNative(await this.hoi(nd, '/schemas'))
    const tho = dong.map(loaiTuNative).filter((l): l is LoaiTuNative => l !== null)
    // Danh sách không kèm trường thì hỏi chi tiết từng loại.
    const ds = await theoLo(tho, async (l) => {
      if (l.dinhNghia) return l
      const ct = loaiTuNative(await this.hoi(nd, `/schemas/${l.nativeId}`))
      return { ...l, dinhNghia: ct?.dinhNghia ?? { truong: [], bang: [] } }
    })
    const luc = new Date()
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const co = await tx.select({ ma: ocrLoai.ma }).from(ocrLoai).where(eq(ocrLoai.donViId, donViId))
      const daCo = new Set(co.map((c) => c.ma))
      const daGhi = new Set<string>()
      for (const l of ds) {
        if (daGhi.has(l.ma)) continue
        daGhi.add(l.ma)
        const dong = {
          ten: l.ten,
          moTa: l.moTa,
          nativeId: l.nativeId,
          hoatDong: l.hoatDong,
          dinhNghia: l.dinhNghia,
          dongBoLuc: luc,
        }
        await tx
          .insert(ocrLoai)
          .values({ donViId, ma: l.ma, ...dong })
          .onConflictDoUpdate({ target: [ocrLoai.donViId, ocrLoai.ma], set: dong })
      }
      return { tong: daGhi.size, moi: [...daGhi].filter((m) => !daCo.has(m)).length }
    })
  }

  async batLoai(nd: NguoiDungPhien, ma: string, bat: boolean): Promise<LoaiChungTuOcr[]> {
    const donViId = await this.donViCua(nd)
    const sua = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .update(ocrLoai)
        .set({ bat })
        .where(and(eq(ocrLoai.donViId, donViId), eq(ocrLoai.ma, ma)))
        .returning({ id: ocrLoai.id }),
    )
    if (sua.length === 0) throw new NotFoundException('Không có loại chứng từ này')
    return this.dsLoai(nd)
  }

  // ── Lấy kết quả về ────────────────────────────────────────────────────────

  async layVe(nd: NguoiDungPhien): Promise<KetQuaLayVeOcr> {
    const donViId = await this.donViCua(nd)
    if (this.dangLay.has(donViId))
      throw new ConflictException('Đang có một lần lấy về chạy dở — chờ xong đã.')
    this.dangLay.add(donViId)
    try {
      return await this.layVeCho(nd, donViId)
    } finally {
      this.dangLay.delete(donViId)
    }
  }

  private async layVeCho(nd: NguoiDungPhien, donViId: string): Promise<KetQuaLayVeOcr> {
    const { bat, co } = await trongPhamVi(this.db, nd.nguCanh, async (tx) => ({
      bat: await tx
        .select({ ma: ocrLoai.ma, nativeId: ocrLoai.nativeId })
        .from(ocrLoai)
        .where(and(eq(ocrLoai.donViId, donViId), eq(ocrLoai.bat, true), isNull(ocrLoai.deletedAt))),
      co: await tx
        .select({
          nativeId: ocrChungTu.nativeId,
          capNhatLuc: ocrChungTu.nativeCapNhatLuc,
          trangThai: ocrChungTu.trangThai,
        })
        .from(ocrChungTu)
        .where(eq(ocrChungTu.donViId, donViId)),
    }))
    if (bat.length === 0)
      throw new BadRequestException('Chưa bật loại chứng từ nào — bật ở "Loại chứng từ" trước khi lấy về.')
    const batMa = new Set(bat.map((b) => b.ma))
    const batId = new Set(bat.map((b) => b.nativeId))
    const daCo = new Map(co.map((c) => [c.nativeId, c]))

    const { dong, conNua } = await this.moiTrang(nd, '/documents')
    const kq: KetQuaLayVeOcr = {
      daXem: dong.length,
      moi: 0,
      capNhat: 0,
      khongDoi: 0,
      boQua: 0,
      loi: 0,
      conNua,
    }

    const canHoi = dong.flatMap((tho) => {
      const d = dongTuNative(tho)
      const khacLoai =
        d &&
        ((d.maLoai && !batMa.has(d.maLoai)) || (!d.maLoai && d.loaiNativeId && !batId.has(d.loaiNativeId)))
      if (!d || !d.trangThai || khacLoai) {
        kq.boQua++
        return []
      }
      const cu = daCo.get(d.nativeId)
      if (
        cu &&
        cu.trangThai === d.trangThai &&
        d.capNhatLuc &&
        cu.capNhatLuc?.toISOString() === d.capNhatLuc
      ) {
        kq.khongDoi++
        return []
      }
      return [d]
    })

    const ghi: (KetQuaTuNative & { trangThai: TrangThaiChungTuOcr; capNhatLuc: string | null })[] = []
    await theoLo(canHoi, async (d) => {
      let r: KetQuaTuNative | null
      try {
        r = ketQuaTuNative(await this.hoi(nd, `/documents/${d.nativeId}/result`))
      } catch (e) {
        // Native sập / liên kết hỏng giữa chừng: dừng cả lần lấy về. Lỗi riêng một chứng từ: đếm rồi đi tiếp.
        if (e instanceof ServiceUnavailableException || e instanceof ForbiddenException) throw e
        kq.loi++
        return
      }
      if (!r || r.nativeId !== d.nativeId) kq.loi++
      else if (!batMa.has(r.maLoai) || !r.trangThai) kq.boQua++
      else ghi.push({ ...r, trangThai: r.trangThai, capNhatLuc: d.capNhatLuc ?? r.capNhatLuc })
    })

    if (ghi.length > 0) {
      const luc = new Date()
      await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        for (const r of ghi) {
          const dong = {
            maLoai: r.maLoai,
            tenLoai: r.tenLoai,
            tenTep: r.tenTep,
            loaiTep: r.loaiTep,
            trangThai: r.trangThai,
            doTinCay: r.doTinCay,
            duLieu: r.duLieu,
            bang: r.bang,
            nativeTaoLuc: r.taoLuc ? new Date(r.taoLuc) : null,
            nativeCapNhatLuc: r.capNhatLuc ? new Date(r.capNhatLuc) : null,
            layVeLuc: luc,
            layBoi: nd.taiKhoanId,
          }
          await tx
            .insert(ocrChungTu)
            .values({ donViId, nativeId: r.nativeId, ...dong })
            .onConflictDoUpdate({ target: [ocrChungTu.donViId, ocrChungTu.nativeId], set: dong })
          if (daCo.has(r.nativeId)) kq.capNhat++
          else kq.moi++
        }
      })
    }
    return kq
  }

  // ── Đọc kết quả — cho màn quản trị VÀ cho các trang tác nghiệp ────────────

  /** Chứng từ đã lấy về (mới nhất trước); `loai` = mã loại, bỏ trống = mọi loại. */
  async danhSach(nd: NguoiDungPhien, loai?: string): Promise<ChungTuOcr[]> {
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select()
        .from(ocrChungTu)
        .where(and(isNull(ocrChungTu.deletedAt), loai ? eq(ocrChungTu.maLoai, loai) : undefined))
        .orderBy(sql`${ocrChungTu.nativeCapNhatLuc} desc nulls last`, desc(ocrChungTu.layVeLuc))
        .limit(GIOI_HAN_DOC),
    )
    return ds.map(chuyen)
  }

  async mot(nd: NguoiDungPhien, id: string): Promise<ChungTuOcr> {
    const [d] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select()
        .from(ocrChungTu)
        .where(and(eq(ocrChungTu.id, id), isNull(ocrChungTu.deletedAt))),
    )
    if (!d) throw new NotFoundException('Không có chứng từ này')
    return chuyen(d)
  }
}

function chuyen(d: typeof ocrChungTu.$inferSelect): ChungTuOcr {
  return {
    id: d.id,
    maLoai: d.maLoai,
    tenLoai: d.tenLoai,
    tenTep: d.tenTep,
    trangThai: d.trangThai as TrangThaiChungTuOcr,
    doTinCay: d.doTinCay,
    duLieu: d.duLieu as Record<string, GiaTriOcr>,
    bang: d.bang as Record<string, Record<string, GiaTriOcr>[]>,
    taoLuc: d.nativeTaoLuc?.toISOString() ?? null,
    capNhatLuc: d.nativeCapNhatLuc?.toISOString() ?? null,
    layVeLuc: d.layVeLuc.toISOString(),
  }
}
