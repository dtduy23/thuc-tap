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
  homNay,
  ngayKetThucDuKien,
  soNgayGiua,
  tinhTaiChinh,
  type BenThucHien,
  type GiaiDoan,
  type PhienBanKeHoach,
  kiemMaDuAn,
  LOAI_CHI,
  NHOM_DU_AN,
  thongKeTienDo,
  tinhHan,
  TRANG_THAI_DU_AN,
  VAI_DUYET,
  VAI_TRO_THANH_VIEN,
  type BuocDuAn,
  type BuocDuyetDaQua,
  type BuocMau,
  type CapDuyet,
  type CapNhatCho,
  type DuAnDong,
  type HoSoDuAn,
  type LocDuAn,
  type LoaiChi,
  type LuongDuyet,
  type NhomDuAn,
  type TrangThaiDuAn,
  type TrangThaiYeuCau,
  type VaiTroThanhVien,
  type VuongMacDuAn,
  type YeuCauGiaHan,
} from '@gdos/shared'
import { and, asc, desc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  chuoi,
  chuoiHoacRong,
  coKhong,
  maUuid,
  motTrong,
  ngay,
  ngayHoacRong,
  soNguyen,
} from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { maLoiPg, trongPhamVi, TRUNG_KHOA, truyVan, type GiaoDich } from '../db/pham-vi.js'
import {
  danhMucGiaTri,
  donVi,
  duAn,
  duAnBuoc,
  duAnGiaHan,
  duAnGiaiNgan,
  duAnPhienBan,
  duAnThanhVien,
  duAnVanBan,
  duAnVon,
  duAnVuongMac,
  quyTrinhMau,
} from '../db/schema/index.js'
import { ThietLapService } from '../thiet-lap/thiet-lap.service.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'

const VAI_TRO = Object.keys(VAI_TRO_THANH_VIEN) as VaiTroThanhVien[]
const TRANG_THAI = Object.keys(TRANG_THAI_DU_AN) as TrangThaiDuAn[]
const LOAI = Object.keys(LOAI_CHI) as LoaiChi[]
const GD = Object.keys(GIAI_DOAN) as GiaiDoan[]
const BEN = Object.keys(BEN_THUC_HIEN) as BenThucHien[]

/** Cột đọc của dự án. Tên đơn vị, cán bộ qua hàm — nhà thầu vẫn thấy tên chủ đầu tư dù RLS che dòng đơn vị. */
/** Dữ liệu tạo một dự án, đã kiểm kiểu (kiểm theo phạm vi làm trong taoMot). */
export interface DuAnMoi {
  ten: string
  donViId: string
  quyTrinhMa: string
  loaiChi: LoaiChi
  nhomDuAn: NhomDuAn | null
  linhVucId: string | null
  tongMuc: number
  ngayBatDau: string
  canCu: string | null
  diaDiem: string | null
  canBoId: string
  ma: string | null
}

export function docDuAnMoi(than: unknown, macDinhCanBo: string): DuAnMoi {
  const ten = chuoi(than, 'ten', 500, true)
  const donViId = maUuid((than as { donViId?: unknown } | null)?.donViId, 'donViId')
  const quyTrinhMa = chuoi(than, 'quyTrinhMa', 60, true)
  const loaiChi = motTrong(than, 'loaiChi', LOAI) ?? 'dtpt'
  const nhomDuAn = motTrong(than, 'nhomDuAn', NHOM_DU_AN) ?? null
  const linhVucId = chuoiHoacRong(than, 'linhVucId', 40)
  const tongMuc = soNguyen(than, 'tongMuc', 0, 1e12) ?? 0
  const ngayBatDau = ngay(than, 'ngayBatDau')
  const canCu = chuoiHoacRong(than, 'canCu', 500) ?? null
  const diaDiem = chuoiHoacRong(than, 'diaDiem', 300) ?? null
  const canBoId = chuoiHoacRong(than, 'canBoId', 40) ?? macDinhCanBo
  const ma = chuoiHoacRong(than, 'ma', 40) ?? null
  if (ma) {
    const loi = kiemMaDuAn(ma)
    if (loi) throw new BadRequestException(loi)
  }
  return {
    ten,
    donViId,
    quyTrinhMa,
    loaiChi,
    nhomDuAn,
    linhVucId: linhVucId ?? null,
    tongMuc,
    ngayBatDau,
    canCu,
    diaDiem,
    canBoId,
    ma,
  }
}

const COT_DU_AN = {
  id: duAn.id,
  ma: duAn.ma,
  ten: duAn.ten,
  trangThai: duAn.trangThai,
  donViId: duAn.donViId,
  donViTen: sql<string>`ten_don_vi(${duAn.donViId})`,
  hinhThuc: duAn.hinhThuc,
  loaiChi: duAn.loaiChi,
  nhomDuAn: duAn.nhomDuAn,
  linhVucId: duAn.linhVucId,
  linhVucTen: danhMucGiaTri.ten,
  tongMuc: duAn.tongMuc,
  ngayBatDau: duAn.ngayBatDau,
  capNhatNgay: duAn.capNhatNgay,
  quyTrinhMa: duAn.quyTrinhMa,
  canBoId: duAn.canBoId,
  canBoTen: sql<string | null>`ten_tai_khoan(${duAn.canBoId})`,
  canCu: duAn.canCu,
  tienDoMoTa: duAn.tienDoMoTa,
  diaDiem: duAn.diaDiem,
  vuongMacMo: sql<number>`(select count(*)::int from du_an_vuong_mac v
                            where v.du_an_id = "du_an"."id" and v.ngay_giai_quyet is null and v.deleted_at is null)`,
  daGiaiNgan: sql<number>`(select coalesce(sum(g.so_tien), 0)::float8 from du_an_giai_ngan g
                            where g.du_an_id = "du_an"."id" and g.deleted_at is null)`,
}

const COT_BUOC = {
  id: duAnBuoc.id,
  duAnId: duAnBuoc.duAnId,
  thuTu: duAnBuoc.thuTu,
  chaId: duAnBuoc.chaId,
  giaiDoan: duAnBuoc.giaiDoan,
  stt: duAnBuoc.stt,
  laNhom: duAnBuoc.laNhom,
  batBuoc: duAnBuoc.batBuoc,
  ten: duAnBuoc.ten,
  soNgay: duAnBuoc.soNgay,
  hanGhiDe: duAnBuoc.hanGhiDe,
  han: duAnBuoc.han,
  ngayHoanThanh: duAnBuoc.ngayHoanThanh,
  soVanBan: duAnBuoc.soVanBan,
  donViThucHien: duAnBuoc.donViThucHien,
  benThucHien: duAnBuoc.benThucHien,
  ghiChu: duAnBuoc.ghiChu,
  boQua: duAnBuoc.boQua,
  lyDoBoQua: duAnBuoc.lyDoBoQua,
  choXacNhan: duAnBuoc.choXacNhan,
  sanPham: duAnBuoc.sanPham,
  anTongQuan: duAnBuoc.anTongQuan,
  laNhap: duAnBuoc.laNhap,
}

type DongDuAn = Awaited<ReturnType<typeof docDuAn>>[number]
type DongBuoc = Awaited<ReturnType<typeof docBuoc>>[number]

/**
 * Dự án — Tác nghiệp › Dự án (ADR-0008). Mọi truy cập đi qua `trongPhamVi()`: RLS
 * quyết định THẤY dự án nào (đơn vị trong phạm vi hoặc là thành viên); service
 * quyết định LÀM được gì trên dự án đó (`quyenTren`).
 */
@Injectable()
export class DuAnService {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(ThietLapService) private readonly thietLap: ThietLapService,
  ) {}

  private get db() {
    return dbCua(this.csdl)
  }

  /** Ngưỡng "sắp hạn" đang cấu hình. Đọc TRƯỚC khi mở giao dịch — không lồng giao dịch. */
  private async nguongSapHan(): Promise<number> {
    return (await this.thietLap.nguong()).sapHanNgay
  }

  async danhSach(nd: NguoiDungPhien, loc: LocDuAn): Promise<DuAnDong[]> {
    const sapHanNgay = await this.nguongSapHan()
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const dk: SQL | undefined =
        loc === 'cua-toi'
          ? or(eq(duAn.canBoId, nd.taiKhoanId), sql`${duAn.id} = any (app_du_an_thanh_vien())`)
          : loc === 'cho-xac-nhan'
            ? sql`exists (select 1 from du_an_buoc b where b.du_an_id = ${duAn.id}
                            and b.cho_xac_nhan is not null and b.deleted_at is null)`
            : undefined
      const ds = await docDuAn(tx, dk)
      const buoc = await docBuoc(
        tx,
        ds.map((d) => d.id),
      )
      const hn = homNay()
      return ds.map((d) =>
        chuyenDuAn(
          d,
          buoc.filter((b) => b.duAnId === d.id),
          hn,
          sapHanNgay,
        ),
      )
    })
  }

  async hoSo(nd: NguoiDungPhien, id: string): Promise<HoSoDuAn> {
    const ng = await this.nguongSapHan()
    const luong = await this.luongGiaHan()
    return trongPhamVi(this.db, nd.nguCanh, (tx) => docHoSo(tx, nd, id, ng, luong))
  }

  private async luongGiaHan(): Promise<LuongDuyet> {
    return (await this.thietLap.luongDuyet())['gia-han-buoc']
  }

  async tao(nd: NguoiDungPhien, than: unknown): Promise<HoSoDuAn> {
    const dl = docDuAnMoi(than, nd.taiKhoanId)
    const ng = await this.nguongSapHan()
    const luong = await this.luongGiaHan()
    try {
      return await trongPhamVi(this.db, nd.nguCanh, async (tx) =>
        docHoSo(tx, nd, await this.taoMot(tx, nd, dl), ng, luong),
      )
    } catch (e) {
      if (maLoiPg(e) === TRUNG_KHOA) throw new ConflictException(`Mã dự án "${dl.ma}" đã có`)
      throw e
    }
  }

  /** Tạo MỘT dự án trong giao dịch đang mở — tạo tay và nhập Excel dùng chung luật. Trả id. */
  async taoMot(tx: GiaoDich, nd: NguoiDungPhien, dl: DuAnMoi): Promise<string> {
    const {
      ten,
      donViId,
      quyTrinhMa,
      loaiChi,
      nhomDuAn,
      linhVucId,
      tongMuc,
      ngayBatDau,
      canCu,
      diaDiem,
      canBoId,
    } = dl
    let ma = dl.ma
    const id = randomUUID()
    const [dv] = await tx
      .select({ cap: donVi.cap })
      .from(donVi)
      .where(and(eq(donVi.id, donViId), isNull(donVi.deletedAt)))
    if (!dv) throw new BadRequestException('Chủ đầu tư không có trong phạm vi quản lý')
    if (dv.cap === 'doanh-nghiep')
      throw new BadRequestException('Chủ đầu tư phải là cơ quan, đơn vị — doanh nghiệp là nhà thầu, tư vấn')

    const [qt] = await tx
      .select({ hinhThuc: quyTrinhMau.hinhThuc, buoc: quyTrinhMau.buoc })
      .from(quyTrinhMau)
      .where(and(eq(quyTrinhMau.ma, quyTrinhMa), isNull(quyTrinhMau.deletedAt)))
    if (!qt) throw new BadRequestException(`Không có quy trình mẫu "${quyTrinhMa}"`)

    if (linhVucId) {
      const [lv] = await tx
        .select({ id: danhMucGiaTri.id })
        .from(danhMucGiaTri)
        .where(and(eq(danhMucGiaTri.id, maUuid(linhVucId, 'linhVucId')), eq(danhMucGiaTri.loai, 'linh-vuc')))
      if (!lv) throw new BadRequestException('Lĩnh vực không có')
    }

    if (!ma) {
      const [so] = await truyVan<{ so: string }>(tx, sql`select nextval('du_an_so_thu_tu')::text as so`)
      ma = `DA-${ngayBatDau.slice(0, 4)}-${so!.so.padStart(4, '0')}`
    }

    await tx.insert(duAn).values({
      id,
      donViId,
      ma,
      ten,
      quyTrinhMa,
      hinhThuc: qt.hinhThuc,
      loaiChi,
      nhomDuAn,
      linhVucId: linhVucId ?? null,
      canCu,
      diaDiem,
      tongMuc,
      ngayBatDau,
      canBoId: maUuid(canBoId, 'canBoId'),
      capNhatNgay: homNay(),
      nguoiTao: nd.taiKhoanId,
    })

    // Chép quy trình mẫu sang dự án — sửa mẫu về sau không ảnh hưởng dự án này.
    const mau = qt.buoc as BuocMau[]
    const ids = mau.map(() => randomUUID())
    const han = tinhHan(
      mau.map((b) => ({ soNgay: b.soNgay, hanGhiDe: null, laNhap: false })),
      ngayBatDau,
    )
    if (mau.length)
      await tx.insert(duAnBuoc).values(
        mau.map((b, i) => ({
          id: ids[i],
          duAnId: id,
          donViId, // trigger đặt lại theo dự án — ghi cho rõ
          thuTu: i,
          chaId: b.cha === null ? null : ids[b.cha]!,
          giaiDoan: b.gd,
          stt: b.stt,
          laNhom: b.nhom,
          ten: b.ten,
          soNgay: b.soNgay,
          han: han[i] ?? null,
          donViThucHien: b.donVi || null,
          benThucHien: b.ben,
          soVanBan: null,
          ghiChu: b.vanBan ? `Văn bản: ${b.vanBan}` : null,
        })),
      )
    await ghiPhienBan(tx, nd, id, donViId, 'Kế hoạch gốc theo quy trình mẫu', null)
    return id
  }

  /** Sửa thông tin chung. Đổi ngày bắt đầu thì tính lại hạn mọi bước. */
  sua(nd: NguoiDungPhien, id: string, than: unknown): Promise<HoSoDuAn> {
    const gt = {
      ten: chuoiHoacRong(than, 'ten', 500) ?? undefined,
      trangThai: motTrong(than, 'trangThai', TRANG_THAI),
      loaiChi: motTrong(than, 'loaiChi', LOAI),
      nhomDuAn: motTrong(than, 'nhomDuAn', NHOM_DU_AN),
      linhVucId: chuoiHoacRong(than, 'linhVucId', 40),
      tongMuc: soNguyen(than, 'tongMuc', 0, 1e12),
      ngayBatDau: ngayHoacRong(than, 'ngayBatDau') ?? undefined,
      canCu: chuoiHoacRong(than, 'canCu', 500),
      tienDoMoTa: chuoiHoacRong(than, 'tienDoMoTa', 4000),
      diaDiem: chuoiHoacRong(than, 'diaDiem', 300),
      canBoId: chuoiHoacRong(than, 'canBoId', 40),
    }
    if (gt.linhVucId) maUuid(gt.linhVucId, 'linhVucId')
    if (gt.canBoId) maUuid(gt.canBoId, 'canBoId')
    return this.voiDuAn(nd, id, 'sua', async (tx) => {
      await tx
        .update(duAn)
        .set({ ...gt, capNhatNgay: homNay() })
        .where(eq(duAn.id, id))
    })
  }

  // ── Bước ────────────────────────────────────────────────────────────────

  hoanThanh(nd: NguoiDungPhien, id: string, buocId: string, than: unknown) {
    const ngayXong = ngay(than, 'ngay')
    const soVanBan = chuoiHoacRong(than, 'soVanBan', 300)
    const ghiChu = chuoiHoacRong(than, 'ghiChu', 2000)
    return this.voiBuoc(nd, id, buocId, 'sua', async (tx, b) => {
      if (b.laNhom) throw new BadRequestException('Đây là nhóm bước — ghi nhận ở từng bước con')
      if (b.boQua) throw new BadRequestException('Bước đã bỏ qua — khôi phục trước')
      if (b.laNhap) throw new BadRequestException('Bước nháp — chốt kế hoạch trước khi ghi nhận')
      await capNhatBuoc(tx, b.id, { ngayHoanThanh: ngayXong, soVanBan, ghiChu, choXacNhan: null })
    })
  }

  boHoanThanh(nd: NguoiDungPhien, id: string, buocId: string) {
    return this.voiBuoc(nd, id, buocId, 'sua', (tx, b) =>
      capNhatBuoc(tx, b.id, { ngayHoanThanh: null, choXacNhan: null }),
    )
  }

  boQua(nd: NguoiDungPhien, id: string, buocId: string, than: unknown) {
    const lyDo = chuoi(than, 'lyDo', 1000, true)
    return this.voiBuoc(nd, id, buocId, 'sua', (tx, b) =>
      capNhatBuoc(tx, b.id, { boQua: true, lyDoBoQua: lyDo, choXacNhan: null }),
    )
  }

  khoiPhuc(nd: NguoiDungPhien, id: string, buocId: string) {
    return this.voiBuoc(nd, id, buocId, 'sua', (tx, b) =>
      capNhatBuoc(tx, b.id, { boQua: false, lyDoBoQua: null }),
    )
  }

  /**
   * Sửa số ngày, hạn ghi đè, văn bản, đơn vị thực hiện, ghi chú, sản phẩm. Tên, số thứ
   * tự, bên thực hiện chỉ đổi được ở bước TỰ THÊM — bước theo quy trình mẫu giữ nguyên.
   */
  suaBuoc(nd: NguoiDungPhien, id: string, buocId: string, than: unknown) {
    const ten = chuoiHoacRong(than, 'ten', 500) ?? undefined
    const stt = chuoiHoacRong(than, 'stt', 30) ?? undefined
    const benThucHien = motTrong(than, 'benThucHien', BEN)
    const gt = {
      soNgay: soNguyen(than, 'soNgay', 0, 3650),
      hanGhiDe: ngayHoacRong(than, 'hanGhiDe'),
      soVanBan: chuoiHoacRong(than, 'soVanBan', 300),
      donViThucHien: chuoiHoacRong(than, 'donViThucHien', 300),
      ghiChu: chuoiHoacRong(than, 'ghiChu', 2000),
      sanPham: chuoiHoacRong(than, 'sanPham', 2000),
      anTongQuan: coKhong(than, 'anTongQuan'),
    }
    return this.voiBuoc(nd, id, buocId, 'sua', (tx, b) => {
      if (b.batBuoc && (ten !== undefined || stt !== undefined || benThucHien !== undefined))
        throw new BadRequestException('Bước theo quy trình mẫu không đổi tên, số thứ tự, bên thực hiện được')
      return capNhatBuoc(tx, b.id, { ...gt, ten, stt, benThucHien })
    })
  }

  // ── Kế hoạch & điều chỉnh ──────────────────────────────────────────────

  /**
   * Thêm bước tự khai (không bắt buộc). Luôn vào dạng NHÁP: chưa tính hạn, chưa vào
   * tiến độ — tới khi "Chốt kế hoạch". Chèn ngay sau `sauBuocId`, hoặc cuối giai đoạn.
   */
  themBuoc(nd: NguoiDungPhien, id: string, than: unknown) {
    const giaiDoan = motTrong(than, 'giaiDoan', GD)
    if (!giaiDoan) throw new BadRequestException('Thiếu "giaiDoan"')
    const ten = chuoi(than, 'ten', 500, true)
    const soNgay = soNguyen(than, 'soNgay', 0, 3650) ?? 0
    const benThucHien = motTrong(than, 'benThucHien', BEN) ?? 'chu-dau-tu'
    const donViThucHien = chuoiHoacRong(than, 'donViThucHien', 300) ?? null
    const laNhom = coKhong(than, 'laNhom') ?? false
    const stt = chuoiHoacRong(than, 'stt', 30) ?? null
    const sauBuocId = chuoiHoacRong(than, 'sauBuocId', 40)
    if (sauBuocId) maUuid(sauBuocId, 'sauBuocId')
    return this.voiDuAn(nd, id, 'sua', async (tx, da) => {
      const ds = await docBuoc(tx, [id])
      let truoc: DongBuoc | undefined
      let chaId: string | null = null
      if (sauBuocId) {
        truoc = ds.find((b) => b.id === sauBuocId)
        if (!truoc) throw new NotFoundException('Không tìm thấy bước đứng trước')
        if (truoc.giaiDoan !== giaiDoan) throw new BadRequestException('Bước đứng trước ở giai đoạn khác')
        chaId = truoc.laNhom ? truoc.id : truoc.chaId
      } else {
        // Cuối giai đoạn: sau bước cuối cùng của giai đoạn này hoặc các giai đoạn trước ('I' < 'II' < 'III').
        truoc = ds.filter((b) => b.giaiDoan <= giaiDoan).at(-1)
      }
      const sau = truoc ? ds.find((b) => b.thuTu > truoc.thuTu) : ds[0]
      const thuTu =
        truoc && sau ? (truoc.thuTu + sau.thuTu) / 2 : truoc ? truoc.thuTu + 1 : sau ? sau.thuTu - 1 : 0
      await tx.insert(duAnBuoc).values({
        duAnId: id,
        donViId: da.donViId,
        thuTu,
        chaId,
        giaiDoan,
        stt: stt ?? `${giaiDoan}.+`,
        laNhom,
        batBuoc: false,
        ten,
        soNgay: laNhom ? 0 : soNgay,
        benThucHien,
        donViThucHien,
        laNhap: true,
      })
    })
  }

  /** Xóa (mềm) bước tự thêm. Bước theo quy trình mẫu thì chỉ bỏ qua được, có lý do. */
  xoaBuoc(nd: NguoiDungPhien, id: string, buocId: string) {
    return this.voiBuoc(nd, id, buocId, 'sua', async (tx, b) => {
      if (b.batBuoc)
        throw new BadRequestException('Bước theo quy trình mẫu không xóa được — dùng "Bỏ qua bước"')
      const con = (await docBuoc(tx, [id])).some((x) => x.chaId === b.id)
      if (con) throw new BadRequestException('Nhóm còn bước con — xóa các bước con trước')
      await capNhatBuoc(tx, b.id, { deletedAt: new Date() })
    })
  }

  /**
   * Chốt kế hoạch: bước nháp thành chính thức, tính lại hạn, ghi một PHIÊN BẢN mới
   * (ảnh chụp hạn, lý do, số ngày lùi so với lần chốt trước). Phiên bản không sửa được.
   */
  chotKeHoach(nd: NguoiDungPhien, id: string, than: unknown) {
    const lyDo = chuoi(than, 'lyDo', 1000, true)
    const canCu = chuoiHoacRong(than, 'canCu', 500) ?? null
    return this.voiDuAn(nd, id, 'sua', async (tx, da) => {
      await tx
        .update(duAnBuoc)
        .set({ laNhap: false })
        .where(and(eq(duAnBuoc.duAnId, id), eq(duAnBuoc.laNhap, true), isNull(duAnBuoc.deletedAt)))
      await tinhLaiHan(tx, id)
      await ghiPhienBan(tx, nd, id, da.donViId, lyDo, canCu)
    })
  }

  // ── Xin gia hạn bước (qua luồng phê duyệt — Tầng 2 › Luồng phê duyệt) ─────

  /**
   * Gửi yêu cầu lùi hạn một bước. Các cấp duyệt chụp lại lúc gửi. Một bước chỉ có một yêu cầu
   * đang chờ. Hạn CHƯA đổi — chỉ đổi khi cấp cuối duyệt.
   */
  async xinGiaHan(nd: NguoiDungPhien, id: string, buocId: string, than: unknown): Promise<HoSoDuAn> {
    const hanMoi = ngay(than, 'hanMoi')
    const lyDo = chuoi(than, 'lyDo', 1000, true)
    const canCu = chuoiHoacRong(than, 'canCu', 500) ?? null
    const luong = await this.luongGiaHan()
    if (!luong.bat)
      throw new BadRequestException(
        'Chức năng xin gia hạn đang tắt — quản trị bật ở Quản trị hệ thống › Luồng phê duyệt.',
      )
    return this.voiDuAn(nd, id, 'xinGiaHan', async (tx, da) => {
      const [b] = (await docBuoc(tx, [id])).filter((x) => x.id === buocId)
      if (!b) throw new NotFoundException('Không tìm thấy bước')
      if (b.laNhom || b.laNhap || b.boQua || b.ngayHoanThanh || !b.han)
        throw new BadRequestException('Bước này không xin gia hạn được (nhóm, nháp, đã bỏ qua hoặc đã xong)')
      if (hanMoi <= b.han) throw new BadRequestException('Hạn mới phải sau hạn hiện tại của bước')
      const [dangCho] = await tx
        .select({ id: duAnGiaHan.id })
        .from(duAnGiaHan)
        .where(
          and(
            eq(duAnGiaHan.buocId, buocId),
            eq(duAnGiaHan.trangThai, 'cho-duyet'),
            isNull(duAnGiaHan.deletedAt),
          ),
        )
      if (dangCho) throw new ConflictException('Bước này đang có một yêu cầu gia hạn chờ duyệt')
      await tx.insert(duAnGiaHan).values({
        duAnId: id,
        donViId: da.donViId,
        buocId,
        hanCu: b.han,
        hanMoi,
        lyDo,
        canCu,
        nguoiXin: nd.taiKhoanId,
        ngayXin: homNay(),
        cacCap: luong.cap,
        daQua: [],
      })
    })
  }

  /**
   * Ra quyết định ở cấp đang chờ. Đồng ý ở cấp cuối: đặt hạn mới cho bước (các bước sau dời
   * theo) và chốt kế hoạch thành phiên bản mới. Từ chối ở bất kỳ cấp nào: kết thúc, hạn giữ nguyên.
   */
  async duyetGiaHan(nd: NguoiDungPhien, id: string, yeuCauId: string, than: unknown): Promise<HoSoDuAn> {
    const dongY = coKhong(than, 'dongY')
    if (dongY === undefined) throw new BadRequestException('Thiếu quyết định đồng ý / từ chối')
    const yKien = chuoiHoacRong(than, 'yKien', 1000) ?? null
    if (!dongY && !yKien) throw new BadRequestException('Từ chối phải ghi lý do')
    const luong = await this.luongGiaHan()
    return this.voiDuAn(nd, id, 'xacNhan', async (tx, da) => {
      const [yc] = await tx
        .select()
        .from(duAnGiaHan)
        .where(and(eq(duAnGiaHan.id, yeuCauId), eq(duAnGiaHan.duAnId, id), isNull(duAnGiaHan.deletedAt)))
      if (!yc) throw new NotFoundException('Không tìm thấy yêu cầu gia hạn')
      if (yc.trangThai !== 'cho-duyet') throw new BadRequestException('Yêu cầu này đã kết thúc')
      const cacCap = yc.cacCap as CapDuyet[]
      const cap = cacCap[yc.capHienTai - 1]
      if (!cap) throw new BadRequestException('Yêu cầu không còn cấp nào chờ duyệt')
      if (!nd.quyen.has(VAI_DUYET[cap.vai].quyen))
        throw new ForbiddenException(`Cấp “${cap.ten}” do ${VAI_DUYET[cap.vai].ten} duyệt`)
      if (yc.nguoiXin === nd.taiKhoanId && !luong.choTuDuyet)
        throw new ForbiddenException('Người gửi yêu cầu không tự duyệt được')
      const daQua = [
        ...(yc.daQua as Omit<BuocDuyetDaQua, 'nguoiTen'>[]),
        {
          cap: yc.capHienTai,
          tenCap: cap.ten,
          nguoiId: nd.taiKhoanId,
          dongY,
          yKien,
          luc: new Date().toISOString(),
        },
      ]
      const ghi = (gt: Partial<typeof duAnGiaHan.$inferInsert>) =>
        tx.update(duAnGiaHan).set(gt).where(eq(duAnGiaHan.id, yc.id))
      if (!dongY) return ghi({ trangThai: 'tu-choi', daQua })
      if (yc.capHienTai < cacCap.length) return ghi({ capHienTai: yc.capHienTai + 1, daQua })
      const [b] = (await docBuoc(tx, [id])).filter((x) => x.id === yc.buocId)
      if (!b || b.ngayHoanThanh || b.boQua)
        throw new BadRequestException('Bước đã xong hoặc đã bỏ qua — không gia hạn được nữa')
      await ghi({ trangThai: 'da-duyet', daQua })
      await capNhatBuoc(tx, b.id, { hanGhiDe: yc.hanMoi })
      await tinhLaiHan(tx, id)
      await ghiPhienBan(tx, nd, id, da.donViId, `Gia hạn bước ${b.stt}: ${yc.lyDo}`.slice(0, 1000), yc.canCu)
    })
  }

  /** Người gửi rút yêu cầu khi còn chờ duyệt. */
  rutGiaHan(nd: NguoiDungPhien, id: string, yeuCauId: string): Promise<HoSoDuAn> {
    return this.voiDuAn(nd, id, 'xinGiaHan', async (tx) => {
      const [yc] = await tx
        .select({ id: duAnGiaHan.id, nguoiXin: duAnGiaHan.nguoiXin, trangThai: duAnGiaHan.trangThai })
        .from(duAnGiaHan)
        .where(and(eq(duAnGiaHan.id, yeuCauId), eq(duAnGiaHan.duAnId, id), isNull(duAnGiaHan.deletedAt)))
      if (!yc) throw new NotFoundException('Không tìm thấy yêu cầu gia hạn')
      if (yc.nguoiXin !== nd.taiKhoanId) throw new ForbiddenException('Chỉ người gửi được rút yêu cầu')
      if (yc.trangThai !== 'cho-duyet') throw new BadRequestException('Yêu cầu này đã kết thúc')
      await tx.update(duAnGiaHan).set({ trangThai: 'da-rut' }).where(eq(duAnGiaHan.id, yc.id))
    })
  }

  /** Nhà thầu / tư vấn gửi cập nhật — database tự kiểm là thành viên (hàm buoc_gui_cap_nhat). */
  gui(nd: NguoiDungPhien, id: string, buocId: string, than: unknown) {
    const ngayGui = ngay(than, 'ngay')
    const ghiChu = chuoiHoacRong(than, 'ghiChu', 2000) ?? ''
    return this.voiBuoc(nd, id, buocId, 'gui', async (tx) => {
      try {
        await tx.execute(sql`select buoc_gui_cap_nhat(${buocId}::uuid, ${ngayGui}::date, ${ghiChu})`)
      } catch (e) {
        if (maLoiPg(e) === '22023') throw new BadRequestException('Bước này không nhận cập nhật')
        throw e
      }
    })
  }

  /** Chủ đầu tư xác nhận (ghi nhận hoàn thành theo ngày nhà thầu báo) hoặc trả lại. */
  xacNhan(nd: NguoiDungPhien, id: string, buocId: string, than: unknown) {
    const dongY = (than as { dongY?: unknown } | null)?.dongY
    if (typeof dongY !== 'boolean') throw new BadRequestException('Thiếu "dongY" (true/false)')
    return this.voiBuoc(nd, id, buocId, 'xacNhan', async (tx, b) => {
      const cho = b.choXacNhan as CapNhatCho | null
      if (!cho) throw new BadRequestException('Bước này không có cập nhật chờ xác nhận')
      await capNhatBuoc(
        tx,
        b.id,
        dongY
          ? { ngayHoanThanh: cho.ngay, ghiChu: cho.ghiChu || b.ghiChu, choXacNhan: null }
          : { choXacNhan: null },
      )
    })
  }

  // ── Thành viên ─────────────────────────────────────────────────────────

  themThanhVien(nd: NguoiDungPhien, id: string, than: unknown) {
    const taiKhoanId = maUuid((than as { taiKhoanId?: unknown } | null)?.taiKhoanId, 'taiKhoanId')
    const vaiTro = motTrong(than, 'vaiTro', VAI_TRO)
    if (!vaiTro) throw new BadRequestException('Thiếu "vaiTro"')
    return this.voiDuAn(nd, id, 'thanhVien', async (tx, da) => {
      if (!(await coTaiKhoan(tx, taiKhoanId))) throw new BadRequestException('Không tìm thấy tài khoản')
      const [trung] = await tx
        .select({ id: duAnThanhVien.id })
        .from(duAnThanhVien)
        .where(
          and(
            eq(duAnThanhVien.duAnId, id),
            eq(duAnThanhVien.taiKhoanId, taiKhoanId),
            eq(duAnThanhVien.vaiTro, vaiTro),
            isNull(duAnThanhVien.deletedAt),
          ),
        )
      if (trung) throw new ConflictException('Người này đã có vai trò đó trong dự án')
      await tx.insert(duAnThanhVien).values({ duAnId: id, donViId: da.donViId, taiKhoanId, vaiTro })
    })
  }

  boThanhVien(nd: NguoiDungPhien, id: string, thanhVienId: string) {
    return this.voiDuAn(nd, id, 'thanhVien', async (tx) => {
      const kq = await tx
        .update(duAnThanhVien)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(duAnThanhVien.id, thanhVienId),
            eq(duAnThanhVien.duAnId, id),
            isNull(duAnThanhVien.deletedAt),
          ),
        )
        .returning({ id: duAnThanhVien.id })
      if (!kq.length) throw new NotFoundException('Không tìm thấy thành viên')
    })
  }

  /** Đơn vị làm được chủ đầu tư — trong phạm vi, không phải doanh nghiệp. */
  chonChuDauTu(nd: NguoiDungPhien) {
    return trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({ id: donVi.id, ten: donVi.ten, cap: donVi.cap })
        .from(donVi)
        .where(and(isNull(donVi.deletedAt), sql`${donVi.cap} <> 'doanh-nghiep'`))
        .orderBy(asc(donVi.ten)),
    )
  }

  // ── nội bộ ─────────────────────────────────────────────────────────────

  /**
   * Mở dự án (RLS: không thấy → 404), kiểm quyền trên CHÍNH dự án, làm việc, tính lại
   * hạn, trả hồ sơ. Dùng chung cho mọi thao tác ghi của hồ sơ (cả HoSoDuAnService).
   */
  async voiDuAn(
    nd: NguoiDungPhien,
    id: string,
    can: keyof HoSoDuAn['quyen'],
    viec: (tx: GiaoDich, da: DongDuAn) => Promise<unknown>,
  ): Promise<HoSoDuAn> {
    const ng = await this.nguongSapHan()
    const luong = await this.luongGiaHan()
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const [da] = await docDuAn(tx, eq(duAn.id, id))
      if (!da) throw new NotFoundException('Không tìm thấy dự án')
      const tv = await vaiTroCuaToi(tx, id, nd.taiKhoanId)
      if (!quyenTren(nd, da, tv)[can]) throw new ForbiddenException('Không có quyền thao tác này trên dự án')
      await viec(tx, da)
      await tinhLaiHan(tx, id)
      // Gửi cập nhật, xin gia hạn chưa phải là "đơn vị đã cập nhật dự án" (và nhà thầu không sửa được dự án).
      if (can !== 'gui' && can !== 'xinGiaHan')
        await tx.update(duAn).set({ capNhatNgay: homNay() }).where(eq(duAn.id, id))
      return docHoSo(tx, nd, id, ng, luong)
    })
  }

  private voiBuoc(
    nd: NguoiDungPhien,
    id: string,
    buocId: string,
    can: keyof HoSoDuAn['quyen'],
    viec: (tx: GiaoDich, b: DongBuoc) => Promise<unknown>,
  ): Promise<HoSoDuAn> {
    return this.voiDuAn(nd, id, can, async (tx) => {
      const [b] = (await docBuoc(tx, [id])).filter((x) => x.id === buocId)
      if (!b) throw new NotFoundException('Không tìm thấy bước')
      await viec(tx, b)
    })
  }
}

// ── truy vấn ───────────────────────────────────────────────────────────────

function docDuAn(tx: GiaoDich, dk?: SQL) {
  return tx
    .select(COT_DU_AN)
    .from(duAn)
    .leftJoin(danhMucGiaTri, eq(danhMucGiaTri.id, duAn.linhVucId))
    .where(and(isNull(duAn.deletedAt), dk))
    .orderBy(desc(duAn.createdAt), asc(duAn.ma))
}

function docBuoc(tx: GiaoDich, duAnIds: string[]) {
  if (duAnIds.length === 0) return Promise.resolve([])
  return tx
    .select(COT_BUOC)
    .from(duAnBuoc)
    .where(and(inArray(duAnBuoc.duAnId, duAnIds), isNull(duAnBuoc.deletedAt)))
    .orderBy(asc(duAnBuoc.duAnId), asc(duAnBuoc.thuTu))
}

async function coTaiKhoan(tx: GiaoDich, id: string): Promise<boolean> {
  const [r] = await truyVan<{ ten: string | null }>(tx, sql`select ten_tai_khoan(${id}::uuid) as ten`)
  return !!r?.ten
}

async function vaiTroCuaToi(tx: GiaoDich, duAnId: string, taiKhoanId: string): Promise<VaiTroThanhVien[]> {
  const ds = await tx
    .select({ vaiTro: duAnThanhVien.vaiTro })
    .from(duAnThanhVien)
    .where(
      and(
        eq(duAnThanhVien.duAnId, duAnId),
        eq(duAnThanhVien.taiKhoanId, taiKhoanId),
        isNull(duAnThanhVien.deletedAt),
      ),
    )
  return ds.map((d) => d.vaiTro as VaiTroThanhVien)
}

/**
 * Quyền trên MỘT dự án = quyền theo vai (tinhQuyen) ∩ vị trí so với dự án.
 * Đơn vị chủ đầu tư trong phạm vi → sửa; thành viên ngoài đơn vị → chỉ gửi.
 * Database chặn lần nữa bằng RLS và hàm buoc_gui_cap_nhat.
 */
function quyenTren(
  nd: NguoiDungPhien,
  da: { donViId: string },
  vaiTro: VaiTroThanhVien[],
): HoSoDuAn['quyen'] {
  const trong = nd.donViIds.includes(da.donViId)
  const sua = trong && nd.quyen.has('DU_AN.UPDATE')
  const gui = !trong && nd.quyen.has('DU_AN.READ') && vaiTro.some((v) => v === 'nha-thau' || v === 'tu-van')
  return {
    sua,
    xacNhan: trong && (nd.quyen.has('DU_AN.UPDATE') || nd.quyen.has('DU_AN.APPROVE')),
    thanhVien: sua,
    gui,
    xinGiaHan: sua || gui,
  }
}

async function docHoSo(
  tx: GiaoDich,
  nd: NguoiDungPhien,
  id: string,
  nguongSapHan: number,
  luongGiaHan: LuongDuyet,
): Promise<HoSoDuAn> {
  const [da] = await docDuAn(tx, eq(duAn.id, id))
  if (!da) throw new NotFoundException('Không tìm thấy dự án')
  const buoc = await docBuoc(tx, [id])
  const tv = await tx
    .select({
      id: duAnThanhVien.id,
      taiKhoanId: duAnThanhVien.taiKhoanId,
      vaiTro: duAnThanhVien.vaiTro,
      hoTen: sql<string>`ten_tai_khoan(${duAnThanhVien.taiKhoanId})`,
      donViTen: sql<string>`ten_don_vi_cua_tai_khoan(${duAnThanhVien.taiKhoanId})`,
    })
    .from(duAnThanhVien)
    .where(and(eq(duAnThanhVien.duAnId, id), isNull(duAnThanhVien.deletedAt)))
    .orderBy(asc(duAnThanhVien.vaiTro))
  // Tên người gửi cập nhật chờ xác nhận.
  const nguoiGui = [
    ...new Set(
      buoc.map((b) => (b.choXacNhan as CapNhatCho | null)?.nguoiGui).filter((x): x is string => !!x),
    ),
  ]
  const ten: Record<string, string | null> = {}
  for (const g of nguoiGui) {
    const [r] = await truyVan<{ ten: string | null }>(tx, sql`select ten_tai_khoan(${g}::uuid) as ten`)
    ten[g] = r?.ten ?? null
  }
  const vaiToi = tv.filter((t) => t.taiKhoanId === nd.taiKhoanId).map((t) => t.vaiTro as VaiTroThanhVien)
  const pb = await tx
    .select({
      id: duAnPhienBan.id,
      so: duAnPhienBan.so,
      ngay: duAnPhienBan.ngay,
      lyDo: duAnPhienBan.lyDo,
      canCu: duAnPhienBan.canCu,
      soNgayLui: duAnPhienBan.soNgayLui,
      ngayKetThuc: duAnPhienBan.ngayKetThuc,
      nguoiChot: sql<string | null>`ten_tai_khoan(${duAnPhienBan.nguoiChot})`,
      anhChup: duAnPhienBan.anhChup,
    })
    .from(duAnPhienBan)
    .where(eq(duAnPhienBan.duAnId, id))
    .orderBy(desc(duAnPhienBan.so))
  const anh = (pb[0]?.anhChup ?? []) as { id: string; han: string | null }[]
  const phienBan: PhienBanKeHoach[] = pb.map(({ anhChup: _bo, ...p }) => p)
  return {
    ...chuyenDuAn(da, buoc, homNay(), nguongSapHan),
    canCu: da.canCu,
    tienDoMoTa: da.tienDoMoTa,
    diaDiem: da.diaDiem,
    buoc: buoc.map((b) => chuyenBuoc(b, ten)),
    thanhVien: tv.map((t) => ({ ...t, vaiTro: t.vaiTro as VaiTroThanhVien })),
    phienBan,
    hanDaChot: Object.fromEntries(anh.map((a) => [a.id, a.han])),
    ...(await docHoSoPhu(tx, id, Number(da.tongMuc))),
    giaHan: await docGiaHan(tx, nd, id, da.donViId, luongGiaHan),
    luongGiaHan: { bat: luongGiaHan.bat, cap: luongGiaHan.cap },
    quyen: quyenTren(nd, da, vaiToi),
  }
}

/** Yêu cầu gia hạn của một dự án + người đang xem được làm gì với từng yêu cầu. */
async function docGiaHan(
  tx: GiaoDich,
  nd: NguoiDungPhien,
  duAnId: string,
  donViId: string,
  luong: LuongDuyet,
): Promise<YeuCauGiaHan[]> {
  const ds = await tx
    .select()
    .from(duAnGiaHan)
    .where(and(eq(duAnGiaHan.duAnId, duAnId), isNull(duAnGiaHan.deletedAt)))
    .orderBy(desc(duAnGiaHan.createdAt))
  const ten = new Map<string, string | null>()
  const tenCua = async (tk: string) => {
    if (!ten.has(tk)) {
      const [r] = await truyVan<{ ten: string | null }>(tx, sql`select ten_tai_khoan(${tk}::uuid) as ten`)
      ten.set(tk, r?.ten ?? null)
    }
    return ten.get(tk) ?? null
  }
  const trong = nd.donViIds.includes(donViId)
  const kq: YeuCauGiaHan[] = []
  for (const y of ds) {
    const cacCap = y.cacCap as CapDuyet[]
    const choDuyet = y.trangThai === 'cho-duyet'
    const cap = choDuyet ? cacCap[y.capHienTai - 1] : undefined
    const daQua: BuocDuyetDaQua[] = []
    for (const d of y.daQua as Omit<BuocDuyetDaQua, 'nguoiTen'>[])
      daQua.push({ ...d, nguoiTen: await tenCua(d.nguoiId) })
    kq.push({
      id: y.id,
      buocId: y.buocId,
      hanCu: y.hanCu,
      hanMoi: y.hanMoi,
      lyDo: y.lyDo,
      canCu: y.canCu,
      trangThai: y.trangThai as TrangThaiYeuCau,
      nguoiXinId: y.nguoiXin,
      nguoiXinTen: await tenCua(y.nguoiXin),
      ngayXin: y.ngayXin,
      cacCap,
      capHienTai: choDuyet ? y.capHienTai : null,
      daQua,
      duocDuyet:
        !!cap &&
        trong &&
        nd.quyen.has(VAI_DUYET[cap.vai].quyen) &&
        (y.nguoiXin !== nd.taiKhoanId || luong.choTuDuyet),
      duocRut: choDuyet && y.nguoiXin === nd.taiKhoanId,
    })
  }
  return kq
}

function chuyenBuoc(b: DongBuoc, tenNguoi: Record<string, string | null> = {}): BuocDuAn {
  const { duAnId: _bo, choXacNhan, ...con } = b
  const cho = choXacNhan as Omit<CapNhatCho, 'nguoiGuiTen'> | null
  return {
    ...con,
    giaiDoan: b.giaiDoan as BuocDuAn['giaiDoan'],
    benThucHien: b.benThucHien as BuocDuAn['benThucHien'],
    choXacNhan: cho ? { ...cho, nguoiGuiTen: tenNguoi[cho.nguoiGui] ?? null } : null,
  }
}

function chuyenDuAn(d: DongDuAn, buoc: DongBuoc[], hn: string, nguongSapHan: number): DuAnDong {
  return {
    id: d.id,
    ma: d.ma,
    ten: d.ten,
    trangThai: d.trangThai as TrangThaiDuAn,
    donViId: d.donViId,
    donViTen: d.donViTen,
    hinhThuc: d.hinhThuc as DuAnDong['hinhThuc'],
    loaiChi: d.loaiChi as LoaiChi,
    nhomDuAn: d.nhomDuAn as NhomDuAn | null,
    linhVucId: d.linhVucId,
    linhVucTen: d.linhVucTen,
    tongMuc: Number(d.tongMuc),
    ngayBatDau: d.ngayBatDau,
    capNhatNgay: d.capNhatNgay,
    quyTrinhMa: d.quyTrinhMa,
    canBo: d.canBoId && d.canBoTen ? { id: d.canBoId, hoTen: d.canBoTen } : null,
    vuongMacMo: Number(d.vuongMacMo),
    daGiaiNgan: Number(d.daGiaiNgan),
    thongKe: thongKeTienDo(
      buoc.map((b) => ({ ...b, giaiDoan: b.giaiDoan as BuocDuAn['giaiDoan'] })),
      hn,
      nguongSapHan,
    ),
  }
}

/** Văn bản, vốn, giải ngân, vướng mắc của một dự án (RLS lọc như mọi bảng khác). */
async function docHoSoPhu(tx: GiaoDich, id: string, tongMuc: number) {
  const [vanBan, von, giaiNgan, vuongMac] = [
    await tx
      .select({
        id: duAnVanBan.id,
        buocId: duAnVanBan.buocId,
        giaiNganId: duAnVanBan.giaiNganId,
        tenTep: duAnVanBan.tenTep,
        loaiTep: duAnVanBan.loaiTep,
        kichThuoc: duAnVanBan.kichThuoc,
        tieuDe: duAnVanBan.tieuDe,
        soKyHieu: duAnVanBan.soKyHieu,
        ngayKy: duAnVanBan.ngayKy,
        nguoiKy: duAnVanBan.nguoiKy,
        toSo: duAnVanBan.toSo,
        ghiChu: duAnVanBan.ghiChu,
        nguoiTai: sql<string | null>`ten_tai_khoan(${duAnVanBan.nguoiTai})`,
        taiLuc: duAnVanBan.createdAt,
      })
      .from(duAnVanBan)
      .where(and(eq(duAnVanBan.duAnId, id), isNull(duAnVanBan.deletedAt)))
      .orderBy(desc(duAnVanBan.createdAt)),
    await tx
      .select({
        id: duAnVon.id,
        nam: duAnVon.nam,
        nguonVonId: duAnVon.nguonVonId,
        nguonVonTen: danhMucGiaTri.ten,
        keHoach: duAnVon.keHoach,
        ghiChu: duAnVon.ghiChu,
      })
      .from(duAnVon)
      .innerJoin(danhMucGiaTri, eq(danhMucGiaTri.id, duAnVon.nguonVonId))
      .where(and(eq(duAnVon.duAnId, id), isNull(duAnVon.deletedAt)))
      .orderBy(asc(duAnVon.nam), asc(danhMucGiaTri.thuTu)),
    await tx
      .select({
        id: duAnGiaiNgan.id,
        nam: duAnGiaiNgan.nam,
        nguonVonId: duAnGiaiNgan.nguonVonId,
        nguonVonTen: danhMucGiaTri.ten,
        ngay: duAnGiaiNgan.ngay,
        soTien: duAnGiaiNgan.soTien,
        dot: duAnGiaiNgan.dot,
        soKyHieu: duAnGiaiNgan.soKyHieu,
        ghiChu: duAnGiaiNgan.ghiChu,
      })
      .from(duAnGiaiNgan)
      .innerJoin(danhMucGiaTri, eq(danhMucGiaTri.id, duAnGiaiNgan.nguonVonId))
      .where(and(eq(duAnGiaiNgan.duAnId, id), isNull(duAnGiaiNgan.deletedAt)))
      .orderBy(asc(duAnGiaiNgan.ngay)),
    await tx
      .select({
        id: duAnVuongMac.id,
        buocId: duAnVuongMac.buocId,
        noiDung: duAnVuongMac.noiDung,
        ngayNeu: duAnVuongMac.ngayNeu,
        ngayGiaiQuyet: duAnVuongMac.ngayGiaiQuyet,
        ketQua: duAnVuongMac.ketQua,
        nguoiNeu: sql<string | null>`ten_tai_khoan(${duAnVuongMac.nguoiNeu})`,
        nhomNguyenNhan: duAnVuongMac.nhomNguyenNhan,
        nguyenNhan: duAnVuongMac.nguyenNhan,
        giaiPhap: duAnVuongMac.giaiPhap,
        donViXuLy: duAnVuongMac.donViXuLy,
        hanXuLy: duAnVuongMac.hanXuLy,
        mucDo: duAnVuongMac.mucDo,
      })
      .from(duAnVuongMac)
      .where(and(eq(duAnVuongMac.duAnId, id), isNull(duAnVuongMac.deletedAt)))
      .orderBy(sql`${duAnVuongMac.ngayGiaiQuyet} is not null`, desc(duAnVuongMac.ngayNeu)),
  ]
  const vonSo = von.map((v) => ({ ...v, keHoach: Number(v.keHoach) }))
  const dotSo = giaiNgan.map((g) => ({ ...g, soTien: Number(g.soTien) }))
  return {
    vanBan: vanBan.map((v) => ({ ...v, taiLuc: v.taiLuc.toISOString() })),
    von: vonSo,
    giaiNgan: dotSo,
    vuongMac: vuongMac.map((v) => ({
      ...v,
      nhomNguyenNhan: v.nhomNguyenNhan as VuongMacDuAn['nhomNguyenNhan'],
      mucDo: v.mucDo as VuongMacDuAn['mucDo'],
    })),
    taiChinh: tinhTaiChinh(tongMuc, vonSo, dotSo, Number(homNay().slice(0, 4))),
  }
}

async function capNhatBuoc(tx: GiaoDich, id: string, gt: Partial<typeof duAnBuoc.$inferInsert>) {
  await tx.update(duAnBuoc).set(gt).where(eq(duAnBuoc.id, id))
}

/** Tính lại hạn theo chuỗi; chỉ ghi những bước hạn đổi (mỗi lần ghi là một dòng nhật ký). */
async function tinhLaiHan(tx: GiaoDich, duAnId: string) {
  const [da] = await tx.select({ batDau: duAn.ngayBatDau }).from(duAn).where(eq(duAn.id, duAnId))
  if (!da) return
  const buoc = await docBuoc(tx, [duAnId])
  const han = tinhHan(buoc, da.batDau)
  for (const [i, b] of buoc.entries())
    if ((han[i] ?? null) !== b.han) await capNhatBuoc(tx, b.id, { han: han[i] ?? null })
}

/** Ghi một phiên bản kế hoạch: ảnh chụp các bước chính thức + số ngày kết thúc lùi so với lần trước. */
async function ghiPhienBan(
  tx: GiaoDich,
  nd: NguoiDungPhien,
  duAnId: string,
  donViId: string,
  lyDo: string,
  canCu: string | null,
) {
  const buoc = (await docBuoc(tx, [duAnId])).filter((b) => !b.laNhap)
  const ketThuc = ngayKetThucDuKien(buoc)
  const [truoc] = await tx
    .select({ so: duAnPhienBan.so, ngayKetThuc: duAnPhienBan.ngayKetThuc })
    .from(duAnPhienBan)
    .where(eq(duAnPhienBan.duAnId, duAnId))
    .orderBy(desc(duAnPhienBan.so))
    .limit(1)
  await tx.insert(duAnPhienBan).values({
    duAnId,
    donViId,
    so: (truoc?.so ?? 0) + 1,
    ngay: homNay(),
    lyDo,
    canCu,
    soNgayLui: truoc?.ngayKetThuc && ketThuc ? Math.max(0, soNgayGiua(truoc.ngayKetThuc, ketThuc)) : 0,
    ngayKetThuc: ketThuc,
    anhChup: buoc.map((b) => ({ id: b.id, stt: b.stt, ten: b.ten, han: b.han })),
    nguoiChot: nd.taiKhoanId,
  })
}
