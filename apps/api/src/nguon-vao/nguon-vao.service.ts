import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  docTheoAnhXa,
  kiemLoNap,
  kiemNguonApi,
  kyHienTai,
  type AnhXaNguon,
  type DongSoLieu,
  type KenhNap,
  type KetQuaKiemNap,
  type KetQuaThuNguon,
  type LanNap,
  type NguonApi,
  type NguonApiGhi,
  type SoLieuDaNap,
  type XacThucNguon,
} from '@gdos/shared'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type GiaoDich } from '../db/pham-vi.js'
import { chiTieuLanNap, chiTieuSoLieu, nguonDuLieu, nguonDuLieuBiMat, taiKhoan } from '../db/schema/index.js'
import type { TepTaiLen } from '../du-an/ho-so.service.js'
import { MaHoaBiMat } from '../native/xac-thuc-native.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { docTepSoLieu, taoTepMauSoLieu } from './excel.js'
import { GOI_NGUON_NGOAI, kiemDiaChiNguon, type GoiNguonNgoai } from './goi-ngoai.js'

export const KICH_THUOC_TEP_SO_LIEU = 5 * 1024 * 1024
const SO_LOI_GIU = 50
const SO_LAN_NAP_HIEN = 300
const SO_LIEU_HIEN = 5000
const MAU_JSON_DAI = 3000

const XAC_THUC: readonly XacThucNguon[] = ['khong', 'bearer', 'header']
const chu = (v: unknown, toiDa: number): string => (typeof v === 'string' ? v.trim().slice(0, toiDa) : '')

/** Thân request → cấu hình nguồn (không tin kiểu của trình duyệt). */
function docNguon(than: unknown): NguonApiGhi {
  const t = (than ?? {}) as Record<string, unknown>
  const a = (t.anhXa ?? {}) as Record<string, unknown>
  const xacThuc = XAC_THUC.includes(t.xacThuc as XacThucNguon) ? (t.xacThuc as XacThucNguon) : 'khong'
  const anhXa: AnhXaNguon = {
    kieu: a.kieu === 'truong' ? 'truong' : 'dong',
    duongDan: chu(a.duongDan, 201),
    truongMa: chu(a.truongMa, 201),
    truongGiaTri: chu(a.truongGiaTri, 201),
    truongKy: chu(a.truongKy, 201),
    cap: (Array.isArray(a.cap) ? a.cap : []).slice(0, 201).map((c: unknown) => {
      const x = (c ?? {}) as Record<string, unknown>
      return { truong: chu(x.truong, 201), maChiTieu: chu(x.maChiTieu, 40).toUpperCase() }
    }),
  }
  const n: NguonApiGhi = {
    ten: chu(t.ten, 201),
    diaChi: chu(t.diaChi, 1001),
    xacThuc,
    tenHeader: xacThuc === 'header' ? chu(t.tenHeader, 65) : null,
    anhXa,
    bat: t.bat !== false,
  }
  if (typeof t.biMat === 'string' && t.biMat !== '') {
    if (t.biMat.length > 4000) throw new BadRequestException('Khóa / token quá dài')
    n.biMat = t.biMat
  }
  const loi = kiemNguonApi(n)
  if (loi.length > 0) throw new BadRequestException(loi.join('; '))
  return n
}

/**
 * Tầng 2 › Kết nối › Nguồn dữ liệu vào. Hai kênh nạp số liệu chỉ tiêu — API của khách và tệp
 * Excel — cùng ghi vào kho `chi_tieu_so_lieu` (đơn vị của người nạp), mỗi lần nạp để lại một
 * dòng `chi_tieu_lan_nap`. Gọi ra ngoài NGOÀI giao dịch database.
 */
@Injectable()
export class NguonVaoService {
  private readonly maHoa: MaHoaBiMat

  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
    @Inject(GOI_NGUON_NGOAI) private readonly goi: GoiNguonNgoai,
  ) {
    this.maHoa = new MaHoaBiMat(cauHinh.khoaKyVe)
  }

  private get db() {
    return dbCua(this.csdl)
  }

  private async donViCua(nd: NguoiDungPhien): Promise<string> {
    const [t] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select({ donViId: taiKhoan.donViId }).from(taiKhoan).where(eq(taiKhoan.id, nd.taiKhoanId)),
    )
    if (!t) throw new NotFoundException('Không đọc được tài khoản của bạn')
    return t.donViId
  }

  // ── Nguồn API ─────────────────────────────────────────────────────────────

  async dsNguon(nd: NguoiDungPhien): Promise<NguonApi[]> {
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const ds = await tx
        .select({ n: nguonDuLieu, coBiMat: sql<boolean>`${nguonDuLieuBiMat.nguonId} is not null` })
        .from(nguonDuLieu)
        .leftJoin(nguonDuLieuBiMat, eq(nguonDuLieuBiMat.nguonId, nguonDuLieu.id))
        .where(isNull(nguonDuLieu.deletedAt))
        .orderBy(nguonDuLieu.ten)
      const lan = await tx
        .selectDistinctOn([chiTieuLanNap.nguonId])
        .from(chiTieuLanNap)
        .where(eq(chiTieuLanNap.kenh, 'api'))
        .orderBy(chiTieuLanNap.nguonId, desc(chiTieuLanNap.createdAt))
      const cuoi = new Map(lan.map((l) => [l.nguonId, l]))
      return ds.map(({ n, coBiMat }) => {
        const l = cuoi.get(n.id)
        return {
          id: n.id,
          ten: n.ten,
          diaChi: n.diaChi,
          xacThuc: n.xacThuc as XacThucNguon,
          tenHeader: n.tenHeader,
          anhXa: n.anhXa as AnhXaNguon,
          bat: n.bat,
          coBiMat: !!coBiMat,
          lanCuoi: l
            ? {
                luc: l.createdAt.toISOString(),
                trangThai: l.trangThai as 'xong' | 'loi',
                soDong: l.soDong,
                soLoi: l.soLoi,
              }
            : null,
        }
      })
    })
  }

  async taoNguon(nd: NguoiDungPhien, than: unknown): Promise<NguonApi[]> {
    const n = docNguon(than)
    kiemDiaChiNguon(n.diaChi, this.cauHinh.moiTruong === 'production')
    const donViId = await this.donViCua(nd)
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [moi] = await tx
        .insert(nguonDuLieu)
        .values({
          donViId,
          ten: n.ten,
          diaChi: n.diaChi,
          xacThuc: n.xacThuc,
          tenHeader: n.tenHeader,
          anhXa: n.anhXa,
          bat: n.bat,
        })
        .returning({ id: nguonDuLieu.id })
      await this.ghiBiMat(tx, moi!.id, donViId, n)
    })
    return this.dsNguon(nd)
  }

  async suaNguon(nd: NguoiDungPhien, id: string, than: unknown): Promise<NguonApi[]> {
    const n = docNguon(than)
    kiemDiaChiNguon(n.diaChi, this.cauHinh.moiTruong === 'production')
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [cu] = await tx
        .update(nguonDuLieu)
        .set({
          ten: n.ten,
          diaChi: n.diaChi,
          xacThuc: n.xacThuc,
          tenHeader: n.tenHeader,
          anhXa: n.anhXa,
          bat: n.bat,
        })
        .where(and(eq(nguonDuLieu.id, id), isNull(nguonDuLieu.deletedAt)))
        .returning({ donViId: nguonDuLieu.donViId })
      if (!cu) throw new NotFoundException('Không có nguồn này')
      await this.ghiBiMat(tx, id, cu.donViId, n)
    })
    return this.dsNguon(nd)
  }

  /** Bí mật: có gửi lên thì thay; đổi sang "không cần xác thực" thì xóa; còn lại giữ nguyên. */
  private async ghiBiMat(tx: GiaoDich, nguonId: string, donViId: string, n: NguonApiGhi) {
    if (n.xacThuc === 'khong') {
      await tx.delete(nguonDuLieuBiMat).where(eq(nguonDuLieuBiMat.nguonId, nguonId))
    } else if (n.biMat !== undefined) {
      const maHoa = this.maHoa.ma(n.biMat)
      await tx
        .insert(nguonDuLieuBiMat)
        .values({ nguonId, donViId, maHoa })
        .onConflictDoUpdate({ target: nguonDuLieuBiMat.nguonId, set: { maHoa, updatedAt: new Date() } })
    }
  }

  async xoaNguon(nd: NguoiDungPhien, id: string): Promise<NguonApi[]> {
    await trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const xoa = await tx
        .update(nguonDuLieu)
        .set({ deletedAt: new Date(), bat: false })
        .where(and(eq(nguonDuLieu.id, id), isNull(nguonDuLieu.deletedAt)))
        .returning({ id: nguonDuLieu.id })
      if (xoa.length === 0) throw new NotFoundException('Không có nguồn này')
      await tx.delete(nguonDuLieuBiMat).where(eq(nguonDuLieuBiMat.nguonId, id))
    })
    return this.dsNguon(nd)
  }

  private async biMatCua(nd: NguoiDungPhien, nguonId: string): Promise<string | null> {
    const [b] = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx.select().from(nguonDuLieuBiMat).where(eq(nguonDuLieuBiMat.nguonId, nguonId)),
    )
    return b ? this.maHoa.giai(b.maHoa) : null
  }

  /** Gọi nguồn + đọc theo ánh xạ + kiểm từng dòng. Không ghi gì. */
  private async goiNguon(
    n: Pick<NguonApiGhi, 'diaChi' | 'xacThuc' | 'tenHeader' | 'anhXa'>,
    biMat: string | null,
  ): Promise<{ ketQua: KetQuaThuNguon; hopLe: DongSoLieu[] }> {
    const rong: KetQuaKiemNap = { soHopLe: 0, soLoi: 0, dong: [] }
    const hong = (loi: string, mauJson: string | null = null) => ({
      ketQua: { ...rong, loi, mauJson },
      hopLe: [],
    })
    if (n.xacThuc !== 'khong' && !biMat) return hong('Nguồn cần khóa / token nhưng chưa nhập.')
    const headers: Record<string, string> =
      n.xacThuc === 'bearer'
        ? { Authorization: `Bearer ${biMat}` }
        : n.xacThuc === 'header'
          ? { [n.tenHeader!]: biMat! }
          : {}
    let ph
    try {
      ph = await this.goi(n.diaChi, headers)
    } catch (e) {
      if (e instanceof HttpException) return hong(e.message)
      return hong('Không tới được nguồn — kiểm tra địa chỉ và đường truyền.')
    }
    if (ph.ma < 200 || ph.ma >= 300) return hong(`Nguồn trả về lỗi HTTP ${ph.ma}.`)
    let json: unknown
    try {
      json = JSON.parse(ph.than)
    } catch {
      return hong('Nguồn không trả về JSON.')
    }
    const mauJson = JSON.stringify(json, null, 2).slice(0, MAU_JSON_DAI)
    let tho
    try {
      tho = docTheoAnhXa(json, n.anhXa)
    } catch (e) {
      return hong(e instanceof Error ? e.message : 'JSON trả về không đúng hình đã khai.', mauJson)
    }
    const { ketQua, hopLe } = kiemLoNap(tho, kyHienTai())
    return { ketQua: { ...ketQua, loi: null, mauJson }, hopLe }
  }

  /** "Lấy thử" khi đang cấu hình: dùng bí mật vừa nhập, hoặc bí mật đã lưu của nguồn `id`. */
  async thuNguon(nd: NguoiDungPhien, than: unknown): Promise<KetQuaThuNguon> {
    const n = docNguon(than)
    const id = (than as { id?: unknown } | null)?.id
    const biMat = n.biMat ?? (typeof id === 'string' ? await this.biMatCua(nd, id) : null)
    return (await this.goiNguon(n, biMat)).ketQua
  }

  /** Lấy số liệu từ một nguồn đã lưu và GHI vào kho. Dòng sai bị bỏ, dòng đúng vẫn vào. */
  async layTuNguon(nd: NguoiDungPhien, id: string): Promise<LanNap> {
    const n = (await this.dsNguon(nd)).find((x) => x.id === id)
    if (!n) throw new NotFoundException('Không có nguồn này')
    if (!n.bat) throw new BadRequestException('Nguồn đang tắt — bật lại trước khi lấy.')
    const { ketQua, hopLe } = await this.goiNguon(n, await this.biMatCua(nd, id))
    const loi = ketQua.loi
      ? [ketQua.loi]
      : ketQua.dong.filter((d) => d.loi.length > 0).map((d) => `Dòng ${d.hang}: ${d.loi.join('; ')}`)
    const donViId = await this.donViCua(nd)
    const lanId = await this.ghi(nd, donViId, {
      kenh: 'api',
      nguonId: id,
      tenNguon: n.ten,
      hopLe,
      soLoi: ketQua.loi ? 1 : ketQua.soLoi,
      loi,
    })
    return (await this.dsLanNap(nd)).find((l) => l.id === lanId)!
  }

  // ── Excel ─────────────────────────────────────────────────────────────────

  tepMau(): Promise<Buffer> {
    return taoTepMauSoLieu()
  }

  private async docTep(tep: TepTaiLen | undefined) {
    if (!tep) throw new BadRequestException('Chưa chọn tệp')
    if (!/\.xlsx$/i.test(tep.originalname)) throw new BadRequestException('Cần tệp Excel .xlsx')
    return kiemLoNap(await docTepSoLieu(tep.buffer))
  }

  async kiemTep(tep: TepTaiLen | undefined): Promise<KetQuaKiemNap> {
    return (await this.docTep(tep)).ketQua
  }

  /** Nạp từ Excel là TẤT CẢ HOẶC KHÔNG: có dòng sai thì không dòng nào vào. */
  async napTep(nd: NguoiDungPhien, tep: TepTaiLen | undefined): Promise<LanNap> {
    const { ketQua, hopLe } = await this.docTep(tep)
    if (ketQua.soLoi > 0)
      throw new BadRequestException(
        `Có ${ketQua.soLoi} dòng chưa hợp lệ — chưa nạp số nào. Sửa tệp rồi thử lại.`,
      )
    const donViId = await this.donViCua(nd)
    const lanId = await this.ghi(nd, donViId, {
      kenh: 'excel',
      nguonId: null,
      // Multer đọc tên tệp theo latin1 — đổi lại UTF-8 để tên tiếng Việt không vỡ.
      tenNguon: Buffer.from(tep!.originalname, 'latin1').toString('utf8').slice(0, 300),
      hopLe,
      soLoi: 0,
      loi: [],
    })
    return (await this.dsLanNap(nd)).find((l) => l.id === lanId)!
  }

  // ── Ghi kho ───────────────────────────────────────────────────────────────

  private ghi(
    nd: NguoiDungPhien,
    donViId: string,
    v: {
      kenh: KenhNap
      nguonId: string | null
      tenNguon: string
      hopLe: DongSoLieu[]
      soLoi: number
      loi: string[]
    },
  ): Promise<string> {
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [lan] = await tx
        .insert(chiTieuLanNap)
        .values({
          donViId,
          kenh: v.kenh,
          nguonId: v.nguonId,
          tenNguon: v.tenNguon,
          trangThai: v.hopLe.length > 0 ? 'xong' : 'loi',
          soDong: v.hopLe.length,
          soLoi: v.soLoi,
          loi: v.loi.slice(0, SO_LOI_GIU),
          nguoiNap: nd.taiKhoanId,
        })
        .returning({ id: chiTieuLanNap.id })
      for (let i = 0; i < v.hopLe.length; i += 500) {
        await tx
          .insert(chiTieuSoLieu)
          .values(
            v.hopLe.slice(i, i + 500).map((d) => ({
              donViId,
              maChiTieu: d.maChiTieu,
              ky: d.ky,
              giaTri: d.giaTri,
              kenh: v.kenh,
              tenNguon: v.tenNguon,
              lanNapId: lan!.id,
            })),
          )
          .onConflictDoUpdate({
            target: [chiTieuSoLieu.donViId, chiTieuSoLieu.maChiTieu, chiTieuSoLieu.ky],
            set: {
              giaTri: sql`excluded.gia_tri`,
              kenh: sql`excluded.kenh`,
              tenNguon: sql`excluded.ten_nguon`,
              lanNapId: sql`excluded.lan_nap_id`,
              deletedAt: null,
            },
          })
      }
      return lan!.id
    })
  }

  // ── Kết quả lấy về ────────────────────────────────────────────────────────

  async dsLanNap(nd: NguoiDungPhien): Promise<LanNap[]> {
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({ l: chiTieuLanNap, nguoi: taiKhoan.hoTen })
        .from(chiTieuLanNap)
        .leftJoin(taiKhoan, eq(taiKhoan.id, chiTieuLanNap.nguoiNap))
        .orderBy(desc(chiTieuLanNap.createdAt))
        .limit(SO_LAN_NAP_HIEN),
    )
    return ds.map(({ l, nguoi }) => ({
      id: l.id,
      kenh: l.kenh as KenhNap,
      tenNguon: l.tenNguon,
      trangThai: l.trangThai as 'xong' | 'loi',
      soDong: l.soDong,
      soLoi: l.soLoi,
      loi: l.loi as string[],
      nguoiNap: nguoi,
      luc: l.createdAt.toISOString(),
    }))
  }

  async dsSoLieu(nd: NguoiDungPhien): Promise<SoLieuDaNap[]> {
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select()
        .from(chiTieuSoLieu)
        .where(isNull(chiTieuSoLieu.deletedAt))
        .orderBy(desc(chiTieuSoLieu.ky), chiTieuSoLieu.maChiTieu)
        .limit(SO_LIEU_HIEN),
    )
    return ds.map((d) => ({
      id: d.id,
      maChiTieu: d.maChiTieu,
      ky: d.ky,
      giaTri: d.giaTri,
      kenh: d.kenh as KenhNap,
      tenNguon: d.tenNguon,
      luc: d.updatedAt.toISOString(),
    }))
  }

  /** Bỏ một số đã nạp nhầm — Điều hành quay về số minh họa / chưa có cho chỉ tiêu, kỳ đó. */
  async xoaSoLieu(nd: NguoiDungPhien, id: string): Promise<{ ok: true }> {
    const xoa = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .update(chiTieuSoLieu)
        .set({ deletedAt: new Date() })
        .where(and(eq(chiTieuSoLieu.id, id), isNull(chiTieuSoLieu.deletedAt)))
        .returning({ id: chiTieuSoLieu.id }),
    )
    if (xoa.length === 0) throw new NotFoundException('Không có số liệu này')
    return { ok: true }
  }
}
