import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  BEN_THUC_HIEN,
  GIAI_DOAN,
  HINH_THUC,
  MA_DANH_MUC,
  QUYEN_DANH_MUC,
  type BuocMau,
  type DanhMucQuanLy,
  type GiaTriDanhMuc,
  type HinhThuc,
  type QuyTrinhMauChiTiet,
} from '@gdos/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { chuoi, chuoiHoacRong, mang, maUuid, motTrong, soNguyen } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { maLoiPg, trongPhamVi, TRUNG_KHOA, truyVan, type GiaoDich } from '../db/pham-vi.js'
import { danhMucGiaTri, quyTrinhMau } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

const LOAI = Object.keys(QUYEN_DANH_MUC) as GiaTriDanhMuc['loai'][]
const HT = Object.keys(HINH_THUC) as HinhThuc[]
/** Postgres: vi phạm RLS khi INSERT. */
const VI_PHAM_RLS = '42501'
const CHI_DON_VI_GOC = 'Danh mục dùng chung toàn hệ thống — chỉ tài khoản ở đơn vị gốc được sửa'

async function oDonViGoc(tx: GiaoDich): Promise<boolean> {
  const [r] = await truyVan<{ goc: boolean }>(tx, sql`select app_o_don_vi_goc() as goc`)
  return !!r?.goc
}

function kiemMa(ma: string): string {
  if (!MA_DANH_MUC.test(ma))
    throw new BadRequestException(
      'Mã: chữ thường không dấu, số, gạch nối; 2–60 ký tự (vd: cong-nghe-thong-tin)',
    )
  return ma
}

/** Kiểm mảng bước của quy trình mẫu: đúng kiểu, `cha` trỏ tới một NHÓM đứng trước. */
export function docBuocMau(than: unknown): BuocMau[] {
  const ds = mang(than, 'buoc', 300)
  const kq = ds.map((b, i): BuocMau => {
    const ten = `buoc[${i}]`
    if (typeof b !== 'object' || b === null) throw new BadRequestException(`${ten} phải là đối tượng`)
    const gd = motTrong(b, 'gd', Object.keys(GIAI_DOAN) as (keyof typeof GIAI_DOAN)[])
    const ben = motTrong(b, 'ben', Object.keys(BEN_THUC_HIEN) as (keyof typeof BEN_THUC_HIEN)[])
    if (!gd) throw new BadRequestException(`${ten}: thiếu giai đoạn`)
    const r = b as Record<string, unknown>
    const cha = r.cha === null || r.cha === undefined ? null : Number(r.cha)
    return {
      gd,
      stt: chuoi(b, 'stt', 20, true),
      nhom: r.nhom === true,
      ten: chuoi(b, 'ten', 500, true),
      soNgay: soNguyen(b, 'soNgay', 0, 3650) ?? 0,
      donVi: chuoiHoacRong(b, 'donVi', 200) ?? '',
      ben: ben ?? 'chu-dau-tu',
      vanBan: chuoiHoacRong(b, 'vanBan', 500) ?? '',
      cha,
    }
  })
  kq.forEach((b, i) => {
    if (b.cha === null) return
    if (!Number.isInteger(b.cha) || b.cha < 0 || b.cha >= i || !kq[b.cha]!.nhom)
      throw new BadRequestException(`Bước "${b.stt}": nhóm cha phải là một nhóm đứng trước nó`)
  })
  return kq
}

/**
 * Quản lý Danh mục nghiệp vụ (lĩnh vực, loại văn bản), tham số nguồn vốn, quy trình
 * mẫu. Quyền: theo module sở hữu loại đó (QUYEN_DANH_MUC). Database chặn lần nữa:
 * chỉ tài khoản ở đơn vị gốc ghi được; quy trình khóa (theo luật) không ai sửa.
 */
@Injectable()
export class QuanLyDanhMucService {
  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private get db() {
    return dbCua(this.csdl)
  }

  private kiemQuyen(nd: NguoiDungPhien, maQuyen: string, hd: string) {
    if (!nd.quyen.has(`${maQuyen}.${hd}`))
      throw new ForbiddenException('Tài khoản không có quyền thao tác này')
  }

  private loai(v: unknown): GiaTriDanhMuc['loai'] {
    if (!LOAI.includes(v as GiaTriDanhMuc['loai']))
      throw new BadRequestException(`"loai" phải là một trong: ${LOAI.join(', ')}`)
    return v as GiaTriDanhMuc['loai']
  }

  /** Giao dịch ghi danh mục: đổi lỗi RLS thành câu dễ hiểu. */
  private async ghi<T>(nd: NguoiDungPhien, viec: (tx: GiaoDich) => Promise<T>): Promise<T> {
    try {
      return await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
        if (!(await oDonViGoc(tx))) throw new ForbiddenException(CHI_DON_VI_GOC)
        return viec(tx)
      })
    } catch (e) {
      if (maLoiPg(e) === VI_PHAM_RLS) throw new ForbiddenException(CHI_DON_VI_GOC)
      if (maLoiPg(e) === TRUNG_KHOA) throw new ConflictException('Mã đã có')
      throw e
    }
  }

  // ── Giá trị danh mục ─────────────────────────────────────────────────────

  async danhSach(nd: NguoiDungPhien, loaiQ: unknown): Promise<DanhMucQuanLy> {
    const loai = this.loai(loaiQ)
    this.kiemQuyen(nd, QUYEN_DANH_MUC[loai], 'READ')
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const ds = await tx
        .select({
          id: danhMucGiaTri.id,
          ma: danhMucGiaTri.ma,
          ten: danhMucGiaTri.ten,
          mau: danhMucGiaTri.mau,
          thuTu: danhMucGiaTri.thuTu,
          soDung: sql<number>`dem_dung_danh_muc(${danhMucGiaTri.id})`,
        })
        .from(danhMucGiaTri)
        .where(and(eq(danhMucGiaTri.loai, loai), isNull(danhMucGiaTri.deletedAt)))
        .orderBy(asc(danhMucGiaTri.thuTu), asc(danhMucGiaTri.ten))
      return {
        suaDuoc: nd.quyen.has(`${QUYEN_DANH_MUC[loai]}.UPDATE`) && (await oDonViGoc(tx)),
        ds: ds.map((d) => ({ ...d, loai, soDung: Number(d.soDung) })),
      }
    })
  }

  async them(nd: NguoiDungPhien, than: unknown): Promise<DanhMucQuanLy> {
    const loai = this.loai((than as { loai?: unknown } | null)?.loai)
    this.kiemQuyen(nd, QUYEN_DANH_MUC[loai], 'CREATE')
    const ma = kiemMa(chuoi(than, 'ma', 60, true))
    const ten = chuoi(than, 'ten', 200, true)
    const mau = chuoiHoacRong(than, 'mau', 20) ?? null
    await this.ghi(nd, async (tx) => {
      const [cu] = await tx
        .select({ id: danhMucGiaTri.id, xoa: danhMucGiaTri.deletedAt })
        .from(danhMucGiaTri)
        .where(and(eq(danhMucGiaTri.loai, loai), eq(danhMucGiaTri.ma, ma)))
      const [max] = await truyVan<{ n: number }>(
        tx,
        sql`select coalesce(max(thu_tu), 0)::int as n from danh_muc_gia_tri where loai = ${loai}`,
      )
      // Mã từng xóa (mềm) thì dùng lại dòng cũ — mã là khóa, dữ liệu cũ có thể còn trỏ tới.
      if (cu?.xoa)
        await tx
          .update(danhMucGiaTri)
          .set({ ten, mau, deletedAt: null, thuTu: (max?.n ?? 0) + 1 })
          .where(eq(danhMucGiaTri.id, cu.id))
      else if (cu) throw new ConflictException(`Mã "${ma}" đã có`)
      else await tx.insert(danhMucGiaTri).values({ loai, ma, ten, mau, thuTu: (max?.n ?? 0) + 1 })
    })
    return this.danhSach(nd, loai)
  }

  async sua(nd: NguoiDungPhien, id: string, than: unknown): Promise<DanhMucQuanLy> {
    const dong = await this.mot(nd, id)
    this.kiemQuyen(nd, QUYEN_DANH_MUC[dong.loai], 'UPDATE')
    const gt = {
      ten: chuoiHoacRong(than, 'ten', 200) ?? undefined,
      mau: chuoiHoacRong(than, 'mau', 20),
      thuTu: soNguyen(than, 'thuTu', 0, 100000),
    }
    await this.ghi(nd, (tx) => tx.update(danhMucGiaTri).set(gt).where(eq(danhMucGiaTri.id, id)))
    return this.danhSach(nd, dong.loai)
  }

  async xoa(nd: NguoiDungPhien, id: string): Promise<DanhMucQuanLy> {
    const dong = await this.mot(nd, id)
    this.kiemQuyen(nd, QUYEN_DANH_MUC[dong.loai], 'DELETE')
    if (dong.soDung > 0)
      throw new ConflictException(`"${dong.ten}" đang được dùng ở ${dong.soDung} chỗ — không xóa được`)
    await this.ghi(nd, (tx) =>
      tx.update(danhMucGiaTri).set({ deletedAt: new Date() }).where(eq(danhMucGiaTri.id, id)),
    )
    return this.danhSach(nd, dong.loai)
  }

  private async mot(nd: NguoiDungPhien, id: string) {
    const [d] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({
          loai: danhMucGiaTri.loai,
          ten: danhMucGiaTri.ten,
          soDung: sql<number>`dem_dung_danh_muc(${danhMucGiaTri.id})`,
        })
        .from(danhMucGiaTri)
        .where(and(eq(danhMucGiaTri.id, maUuid(id)), isNull(danhMucGiaTri.deletedAt))),
    )
    if (!d) throw new NotFoundException('Không tìm thấy giá trị danh mục')
    return { ...d, loai: d.loai as GiaTriDanhMuc['loai'], soDung: Number(d.soDung) }
  }

  // ── Quy trình mẫu ────────────────────────────────────────────────────────

  async quyTrinh(nd: NguoiDungPhien, ma: string): Promise<QuyTrinhMauChiTiet> {
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [q] = await tx
        .select({
          id: quyTrinhMau.id,
          ma: quyTrinhMau.ma,
          ten: quyTrinhMau.ten,
          canCu: quyTrinhMau.canCu,
          hinhThuc: quyTrinhMau.hinhThuc,
          khoa: quyTrinhMau.khoa,
          buoc: quyTrinhMau.buoc,
          soDung: sql<number>`dem_dung_quy_trinh(${quyTrinhMau.ma})`,
        })
        .from(quyTrinhMau)
        .where(and(eq(quyTrinhMau.ma, ma), isNull(quyTrinhMau.deletedAt)))
      if (!q) throw new NotFoundException('Không có quy trình mẫu này')
      const buoc = q.buoc as BuocMau[]
      return {
        ...q,
        hinhThuc: q.hinhThuc as HinhThuc,
        buoc,
        soBuoc: buoc.length,
        soDung: Number(q.soDung),
        suaDuoc: !q.khoa && nd.quyen.has('DM_NGHIEP_VU.UPDATE') && (await oDonViGoc(tx)),
      }
    })
  }

  /** Nhân bản — cách duy nhất để "sửa" một quy trình theo luật (khóa). */
  async nhanBan(nd: NguoiDungPhien, ma: string, than: unknown): Promise<QuyTrinhMauChiTiet> {
    this.kiemQuyen(nd, 'DM_NGHIEP_VU', 'CREATE')
    const maMoi = kiemMa(chuoi(than, 'ma', 60, true))
    const ten = chuoi(than, 'ten', 300, true)
    const goc = await this.quyTrinh(nd, ma)
    await this.ghi(nd, async (tx) => {
      const [max] = await truyVan<{ n: number }>(
        tx,
        sql`select coalesce(max(thu_tu), 0)::int as n from quy_trinh_mau`,
      )
      await tx.insert(quyTrinhMau).values({
        ma: maMoi,
        ten,
        canCu: goc.canCu,
        hinhThuc: goc.hinhThuc,
        buoc: goc.buoc,
        khoa: false,
        thuTu: (max?.n ?? 0) + 1,
      })
    })
    return this.quyTrinh(nd, maMoi)
  }

  async suaQuyTrinh(nd: NguoiDungPhien, ma: string, than: unknown): Promise<QuyTrinhMauChiTiet> {
    this.kiemQuyen(nd, 'DM_NGHIEP_VU', 'UPDATE')
    const q = await this.quyTrinh(nd, ma)
    if (q.khoa) throw new ForbiddenException('Quy trình theo luật không sửa được — nhân bản rồi sửa bản sao')
    const gt = {
      ten: chuoiHoacRong(than, 'ten', 300) ?? undefined,
      canCu: chuoiHoacRong(than, 'canCu', 500),
      hinhThuc: motTrong(than, 'hinhThuc', HT),
      buoc: (than as { buoc?: unknown } | null)?.buoc === undefined ? undefined : docBuocMau(than),
    }
    // Dự án đã tạo giữ bản chép của mình — sửa mẫu không đụng tới dự án nào.
    await this.ghi(nd, (tx) => tx.update(quyTrinhMau).set(gt).where(eq(quyTrinhMau.id, q.id)))
    return this.quyTrinh(nd, ma)
  }

  async xoaQuyTrinh(nd: NguoiDungPhien, ma: string): Promise<{ ok: true }> {
    this.kiemQuyen(nd, 'DM_NGHIEP_VU', 'DELETE')
    const q = await this.quyTrinh(nd, ma)
    if (q.khoa) throw new ForbiddenException('Quy trình theo luật không xóa được')
    if (q.soDung > 0)
      throw new ConflictException(`Đang có ${q.soDung} dự án theo quy trình này — không xóa được`)
    await this.ghi(nd, (tx) =>
      tx.update(quyTrinhMau).set({ deletedAt: new Date() }).where(eq(quyTrinhMau.id, q.id)),
    )
    return { ok: true }
  }
}
