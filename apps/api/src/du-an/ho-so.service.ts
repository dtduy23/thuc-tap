import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  DUOI_TEP_CHO_PHEP,
  homNay,
  KICH_THUOC_TEP_TOI_DA,
  MUC_DO_VUONG_MAC,
  NHOM_NGUYEN_NHAN,
  type HoSoDuAn,
  type MucDoVuongMac,
  type NhomNguyenNhan,
} from '@gdos/shared'
import { and, eq, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import {
  chuoi,
  chuoiHoacRong,
  chuoiTuyChon,
  maUuid,
  motTrong,
  ngay,
  ngayHoacRong,
  soNguyen,
} from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type GiaoDich } from '../db/pham-vi.js'
import {
  danhMucGiaTri,
  duAnBuoc,
  duAnGiaiNgan,
  duAnVanBan,
  duAnVon,
  duAnVuongMac,
} from '../db/schema/index.js'
import { KHO_TEP, type KhoTep } from '../kho-tep/kho-tep.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import { DuAnService } from './du-an.service.js'

/** Tệp nhận từ multer (bộ nhớ). Khai kiểu hẹp — không kéo @types/multer vào chỉ vì bốn trường. */
export interface TepTaiLen {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

/**
 * Bốn thẻ hồ sơ: Văn bản · Kinh phí & giải ngân · Vướng mắc. Mọi thao tác ghi đi
 * qua `DuAnService.voiDuAn` — cùng một chỗ kiểm quyền trên dự án và trả hồ sơ mới.
 */
@Injectable()
export class HoSoDuAnService {
  constructor(
    @Inject(DuAnService) private readonly duAn: DuAnService,
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(KHO_TEP) private readonly kho: KhoTep,
  ) {}

  // ── Văn bản ──────────────────────────────────────────────────────────────

  taiLen(nd: NguoiDungPhien, id: string, tep: TepTaiLen | undefined, than: unknown): Promise<HoSoDuAn> {
    if (!tep) throw new BadRequestException('Chưa chọn tệp')
    if (tep.size > KICH_THUOC_TEP_TOI_DA) throw new BadRequestException('Tệp quá lớn')
    // Tên gốc từ trình duyệt: multer đọc theo latin1 — đổi lại UTF-8 để giữ dấu tiếng Việt.
    const tenTep = Buffer.from(tep.originalname, 'latin1').toString('utf8').replace(/[\\/]/g, '_').slice(-200)
    const duoi = tenTep.split('.').pop()?.toLowerCase() ?? ''
    if (!(DUOI_TEP_CHO_PHEP as readonly string[]).includes(duoi))
      throw new BadRequestException(`Chỉ nhận tệp: ${DUOI_TEP_CHO_PHEP.join(', ')}`)
    const tt = docThongTinVanBan(than)
    const buocId = chuoiHoacRong(than, 'buocId', 40) ?? null
    const giaiNganId = chuoiHoacRong(than, 'giaiNganId', 40) ?? null
    if (buocId) maUuid(buocId, 'buocId')
    if (giaiNganId) maUuid(giaiNganId, 'giaiNganId')

    return this.duAn.voiDuAn(nd, id, 'sua', async (tx, da) => {
      if (buocId) await phaiThuocDuAn(tx, duAnBuoc, buocId, id, 'bước')
      if (giaiNganId) await phaiThuocDuAn(tx, duAnGiaiNgan, giaiNganId, id, 'đợt giải ngân')
      const khoaTep = `du-an/${id}/${randomUUID()}`
      await tx.insert(duAnVanBan).values({
        duAnId: id,
        donViId: da.donViId,
        buocId,
        giaiNganId,
        tenTep,
        khoaTep,
        loaiTep: tep.mimetype.slice(0, 100) || 'application/octet-stream',
        kichThuoc: tep.size,
        ...tt,
        nguoiTai: nd.taiKhoanId,
      })
      // Ghi tệp TRONG giao dịch: ghi hỏng thì dòng database cũng không còn.
      await this.kho.ghi(khoaTep, tep.buffer)
    })
  }

  /** Mở tệp để tải về — RLS quyết định thấy văn bản nào (chủ đầu tư, thành viên). */
  async moTep(
    nd: NguoiDungPhien,
    id: string,
    vbId: string,
  ): Promise<{ ten: string; loai: string; kichThuoc: number; noiDung: Readable }> {
    const [vb] = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          ten: duAnVanBan.tenTep,
          loai: duAnVanBan.loaiTep,
          khoa: duAnVanBan.khoaTep,
          kichThuoc: duAnVanBan.kichThuoc,
        })
        .from(duAnVanBan)
        .where(and(eq(duAnVanBan.id, vbId), eq(duAnVanBan.duAnId, id), isNull(duAnVanBan.deletedAt))),
    )
    if (!vb) throw new NotFoundException('Không tìm thấy văn bản')
    try {
      return { ten: vb.ten, loai: vb.loai, kichThuoc: vb.kichThuoc, noiDung: await this.kho.mo(vb.khoa) }
    } catch {
      throw new NotFoundException('Tệp không còn trong kho — liên hệ bộ phận kỹ thuật')
    }
  }

  suaVanBan(nd: NguoiDungPhien, id: string, vbId: string, than: unknown) {
    const tt = docThongTinVanBan(than)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVanBan, vbId, id, 'văn bản')
      await tx.update(duAnVanBan).set(tt).where(eq(duAnVanBan.id, vbId))
    })
  }

  /** Xóa MỀM — tệp vẫn nằm trong kho, dòng vẫn trong database (nhật ký ghi lại). */
  xoaVanBan(nd: NguoiDungPhien, id: string, vbId: string) {
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVanBan, vbId, id, 'văn bản')
      await tx.update(duAnVanBan).set({ deletedAt: new Date() }).where(eq(duAnVanBan.id, vbId))
    })
  }

  // ── Kế hoạch vốn ────────────────────────────────────────────────────────

  themVon(nd: NguoiDungPhien, id: string, than: unknown) {
    const nam = batBuoc(soNguyen(than, 'nam', 2000, 2100), 'nam')
    const nguonVonId = maUuid((than as { nguonVonId?: unknown } | null)?.nguonVonId, 'nguonVonId')
    const keHoach = soNguyen(than, 'keHoach', 0, 1e12) ?? 0
    const ghiChu = chuoiHoacRong(than, 'ghiChu', 1000) ?? null
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx, da) => {
      await phaiLaNguonVon(tx, nguonVonId)
      const trung = await tx
        .select({ id: duAnVon.id })
        .from(duAnVon)
        .where(
          and(
            eq(duAnVon.duAnId, id),
            eq(duAnVon.nam, nam),
            eq(duAnVon.nguonVonId, nguonVonId),
            isNull(duAnVon.deletedAt),
          ),
        )
      if (trung.length)
        throw new BadRequestException('Năm và nguồn vốn này đã có dòng kế hoạch — sửa dòng đó')
      await tx.insert(duAnVon).values({ duAnId: id, donViId: da.donViId, nam, nguonVonId, keHoach, ghiChu })
    })
  }

  suaVon(nd: NguoiDungPhien, id: string, vonId: string, than: unknown) {
    const keHoach = soNguyen(than, 'keHoach', 0, 1e12)
    const ghiChu = chuoiHoacRong(than, 'ghiChu', 1000)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVon, vonId, id, 'dòng kế hoạch vốn')
      await tx.update(duAnVon).set({ keHoach, ghiChu }).where(eq(duAnVon.id, vonId))
    })
  }

  xoaVon(nd: NguoiDungPhien, id: string, vonId: string) {
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVon, vonId, id, 'dòng kế hoạch vốn')
      await tx.update(duAnVon).set({ deletedAt: new Date() }).where(eq(duAnVon.id, vonId))
    })
  }

  // ── Giải ngân ───────────────────────────────────────────────────────────

  themGiaiNgan(nd: NguoiDungPhien, id: string, than: unknown) {
    const gt = docDotGiaiNgan(than)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx, da) => {
      await phaiLaNguonVon(tx, gt.nguonVonId)
      await tx
        .insert(duAnGiaiNgan)
        .values({ ...gt, duAnId: id, donViId: da.donViId, nguoiTao: nd.taiKhoanId })
    })
  }

  suaGiaiNgan(nd: NguoiDungPhien, id: string, gnId: string, than: unknown) {
    const gt = docDotGiaiNgan(than)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnGiaiNgan, gnId, id, 'đợt giải ngân')
      await phaiLaNguonVon(tx, gt.nguonVonId)
      await tx.update(duAnGiaiNgan).set(gt).where(eq(duAnGiaiNgan.id, gnId))
    })
  }

  xoaGiaiNgan(nd: NguoiDungPhien, id: string, gnId: string) {
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnGiaiNgan, gnId, id, 'đợt giải ngân')
      await tx.update(duAnGiaiNgan).set({ deletedAt: new Date() }).where(eq(duAnGiaiNgan.id, gnId))
    })
  }

  // ── Vướng mắc ───────────────────────────────────────────────────────────

  neuVuongMac(nd: NguoiDungPhien, id: string, than: unknown) {
    const noiDung = chuoi(than, 'noiDung', 4000, true)
    const ngayNeu = ngayHoacRong(than, 'ngayNeu') ?? homNay()
    const buocId = chuoiHoacRong(than, 'buocId', 40) ?? null
    if (buocId) maUuid(buocId, 'buocId')
    const pt = docPhanTich(than)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx, da) => {
      if (buocId) await phaiThuocDuAn(tx, duAnBuoc, buocId, id, 'bước')
      await tx
        .insert(duAnVuongMac)
        .values({ duAnId: id, donViId: da.donViId, buocId, noiDung, ngayNeu, nguoiNeu: nd.taiKhoanId, ...pt })
    })
  }

  /** Phân tích nguyên nhân và giải pháp của một vướng mắc (ghi lại được nhiều lần). */
  phanTichVuongMac(nd: NguoiDungPhien, id: string, vmId: string, than: unknown) {
    const pt = docPhanTich(than)
    const noiDung = chuoiTuyChon(than, 'noiDung', 4000)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVuongMac, vmId, id, 'vướng mắc')
      await tx
        .update(duAnVuongMac)
        .set({ ...pt, ...(noiDung ? { noiDung } : {}) })
        .where(eq(duAnVuongMac.id, vmId))
    })
  }

  giaiQuyetVuongMac(nd: NguoiDungPhien, id: string, vmId: string, than: unknown) {
    const ngayGq = ngay(than, 'ngay')
    const ketQua = chuoi(than, 'ketQua', 4000, true)
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVuongMac, vmId, id, 'vướng mắc')
      await tx.update(duAnVuongMac).set({ ngayGiaiQuyet: ngayGq, ketQua }).where(eq(duAnVuongMac.id, vmId))
    })
  }

  moLaiVuongMac(nd: NguoiDungPhien, id: string, vmId: string) {
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVuongMac, vmId, id, 'vướng mắc')
      await tx.update(duAnVuongMac).set({ ngayGiaiQuyet: null }).where(eq(duAnVuongMac.id, vmId))
    })
  }

  xoaVuongMac(nd: NguoiDungPhien, id: string, vmId: string) {
    return this.duAn.voiDuAn(nd, id, 'sua', async (tx) => {
      await phaiThuocDuAn(tx, duAnVuongMac, vmId, id, 'vướng mắc')
      await tx.update(duAnVuongMac).set({ deletedAt: new Date() }).where(eq(duAnVuongMac.id, vmId))
    })
  }
}

// ── kiểm thân request ─────────────────────────────────────────────────────

function batBuoc<T>(v: T | undefined, ten: string): T {
  if (v === undefined) throw new BadRequestException(`Thiếu "${ten}"`)
  return v
}

const NHOM = Object.keys(NHOM_NGUYEN_NHAN) as NhomNguyenNhan[]
const MUC_DO = Object.keys(MUC_DO_VUONG_MAC) as MucDoVuongMac[]

/** Các trường phân tích — vắng thì không đụng tới (undefined), rỗng thì xóa (null). */
function docPhanTich(than: unknown) {
  return {
    nhomNguyenNhan:
      (than as { nhomNguyenNhan?: unknown } | null)?.nhomNguyenNhan === null
        ? null
        : motTrong(than, 'nhomNguyenNhan', NHOM),
    nguyenNhan: chuoiHoacRong(than, 'nguyenNhan', 4000),
    giaiPhap: chuoiHoacRong(than, 'giaiPhap', 4000),
    donViXuLy: chuoiHoacRong(than, 'donViXuLy', 300),
    hanXuLy: ngayHoacRong(than, 'hanXuLy'),
    mucDo: motTrong(than, 'mucDo', MUC_DO),
  }
}

function docThongTinVanBan(than: unknown) {
  return {
    tieuDe: chuoiHoacRong(than, 'tieuDe', 400),
    soKyHieu: chuoiHoacRong(than, 'soKyHieu', 120),
    ngayKy: ngayHoacRong(than, 'ngayKy'),
    nguoiKy: chuoiHoacRong(than, 'nguoiKy', 200),
    toSo: chuoiHoacRong(than, 'toSo', 60),
    ghiChu: chuoiHoacRong(than, 'ghiChu', 400),
  }
}

function docDotGiaiNgan(than: unknown) {
  return {
    nam: batBuoc(soNguyen(than, 'nam', 2000, 2100), 'nam'),
    nguonVonId: maUuid((than as { nguonVonId?: unknown } | null)?.nguonVonId, 'nguonVonId'),
    ngay: ngay(than, 'ngay'),
    soTien: batBuoc(soNguyen(than, 'soTien', 1, 1e12), 'soTien'),
    dot: chuoiHoacRong(than, 'dot', 60) ?? null,
    soKyHieu: chuoiHoacRong(than, 'soKyHieu', 120) ?? null,
    ghiChu: chuoiHoacRong(than, 'ghiChu', 1000) ?? null,
  }
}

// ── kiểm thuộc về ─────────────────────────────────────────────────────────

type BangCon =
  typeof duAnBuoc | typeof duAnVanBan | typeof duAnVon | typeof duAnGiaiNgan | typeof duAnVuongMac

/** Bản ghi phải thuộc ĐÚNG dự án đang thao tác — không cho mượn mã của dự án khác. */
async function phaiThuocDuAn(tx: GiaoDich, bang: BangCon, id: string, duAnId: string, ten: string) {
  const [r] = await tx
    .select({ id: bang.id })
    .from(bang)
    .where(and(eq(bang.id, id), eq(bang.duAnId, duAnId), isNull(bang.deletedAt)))
  if (!r) throw new NotFoundException(`Không tìm thấy ${ten} trong dự án này`)
}

async function phaiLaNguonVon(tx: GiaoDich, id: string) {
  const [r] = await tx
    .select({ id: danhMucGiaTri.id })
    .from(danhMucGiaTri)
    .where(
      and(eq(danhMucGiaTri.id, id), eq(danhMucGiaTri.loai, 'nguon-von'), isNull(danhMucGiaTri.deletedAt)),
    )
  if (!r) throw new BadRequestException('Nguồn vốn không có trong danh mục')
}
