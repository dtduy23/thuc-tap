import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  congNgay,
  DANH_SACH_MODULE,
  homNay,
  NGUONG_LAU_CAP_NHAT,
  NGUONG_SAP_HAN,
  soNgayGiua,
  type CanhBaoDef,
  type DongCanhBao,
  type DotDonDoc,
  type MucViec,
} from '@gdos/shared'
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { chuoi, mang, maUuid } from '../chung/kiem-than.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, type GiaoDich } from '../db/pham-vi.js'
import { duAn, duAnBuoc, duAnDonDoc, duAnVuongMac } from '../db/schema/index.js'
import type { NguoiDungPhien } from '../xac-thuc/bao-ve.js'
import type { NguonDongGop } from '../xuyen-suot/nguon-dong-gop.js'

const TEN = 'Dự án'

/** Bước "đang chạy": không nhóm, không nháp, không bỏ qua, chưa xong, dự án đang thực hiện. */
const BUOC_DANG_CHAY = and(
  eq(duAnBuoc.laNhom, false),
  eq(duAnBuoc.laNhap, false),
  eq(duAnBuoc.boQua, false),
  isNull(duAnBuoc.ngayHoanThanh),
  isNull(duAnBuoc.deletedAt),
  eq(duAn.trangThai, 'dang-thuc-hien'),
  isNull(duAn.deletedAt),
)

/** Dự án người này phụ trách: cán bộ phụ trách chính, hoặc thành viên vai "phụ trách". */
const cuaToi = (taiKhoanId: string): SQL =>
  sql`(${duAn.canBoId} = ${taiKhoanId} or exists (
        select 1 from du_an_thanh_vien tv where tv.du_an_id = ${duAn.id}
          and tv.tai_khoan_id = ${taiKhoanId} and tv.vai_tro = 'phu-trach' and tv.deleted_at is null))`

/**
 * Dự án ĐÓNG GÓP cho nhóm xuyên suốt: cảnh báo (Giám sát › Hồ sơ quá hạn), việc
 * (trang chủ), đôn đốc. Quyền: của chủ — DU_AN.* — RLS lọc phạm vi như mọi nơi khác.
 */
@Injectable()
export class DongGopDuAnService implements NguonDongGop {
  readonly module = DANH_SACH_MODULE.find((m) => m.id === 'du-an')!

  constructor(@Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu) {}

  private get db() {
    return dbCua(this.csdl)
  }

  async canhBao(nd: NguoiDungPhien, loai: CanhBaoDef['loai']): Promise<DongCanhBao[]> {
    if (!nd.quyen.has('DU_AN.READ')) return []
    const hn = homNay()
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      if (loai === 'lau-khong-cap-nhat') {
        const moc = congNgay(hn, -NGUONG_LAU_CAP_NHAT)
        const ds = await tx
          .select({
            id: duAn.id,
            ma: duAn.ma,
            ten: duAn.ten,
            donViTen: sql<string>`ten_don_vi(${duAn.donViId})`,
            capNhat: duAn.capNhatNgay,
            batDau: duAn.ngayBatDau,
          })
          .from(duAn)
          .where(
            and(
              eq(duAn.trangThai, 'dang-thuc-hien'),
              isNull(duAn.deletedAt),
              or(isNull(duAn.capNhatNgay), lt(duAn.capNhatNgay, moc)),
            ),
          )
          .orderBy(asc(duAn.capNhatNgay))
        return ds.map((d) => ({
          nguon: 'du-an-lau-cap-nhat',
          nghiepVu: TEN,
          loai,
          hoSoId: d.id,
          hoSoMa: d.ma,
          hoSoTen: d.ten,
          donViTen: d.donViTen,
          noiDung: d.capNhat
            ? `Cập nhật lần cuối ${d.capNhat.split('-').reverse().join('/')}`
            : 'Chưa cập nhật lần nào',
          han: null,
          soNgay: soNgayGiua(d.capNhat ?? d.batDau, hn),
          lienKet: `/du-an/${d.id}`,
        }))
      }
      const dk =
        loai === 'qua-han'
          ? lt(duAnBuoc.han, hn)
          : and(gte(duAnBuoc.han, hn), lte(duAnBuoc.han, congNgay(hn, NGUONG_SAP_HAN)))
      const ds = await docBuocCanhBao(tx, and(BUOC_DANG_CHAY, dk))
      return ds.map((b) => ({
        nguon: loai === 'qua-han' ? 'du-an-qua-han' : 'du-an-sap-han',
        nghiepVu: TEN,
        loai,
        hoSoId: b.duAnId,
        hoSoMa: b.ma,
        hoSoTen: b.duAnTen,
        donViTen: b.donViTen,
        noiDung: `Bước ${b.stt}. ${b.ten}`,
        han: b.han,
        soNgay: loai === 'qua-han' ? soNgayGiua(b.han!, hn) : soNgayGiua(hn, b.han!),
        lienKet: `/du-an/${b.duAnId}?the=checklist`,
      }))
    })
  }

  async viec(nd: NguoiDungPhien): Promise<MucViec[]> {
    if (!nd.quyen.has('DU_AN.READ')) return []
    const hn = homNay()
    const xacNhan = nd.quyen.has('DU_AN.UPDATE') || nd.quyen.has('DU_AN.APPROVE')
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const viec: MucViec[] = []

      // Bước sắp / quá hạn ở dự án tôi phụ trách.
      const buoc = await docBuocCanhBao(
        tx,
        and(BUOC_DANG_CHAY, cuaToi(nd.taiKhoanId), lte(duAnBuoc.han, congNgay(hn, NGUONG_SAP_HAN))),
      )
      for (const b of buoc)
        viec.push({
          nguon: 'du-an-buoc',
          nghiepVu: TEN,
          tieuDe: `${b.stt}. ${b.ten}`,
          moTa: b.han! < hn ? `Quá hạn ${soNgayGiua(b.han!, hn)} ngày` : `Còn ${soNgayGiua(hn, b.han!)} ngày`,
          hoSoTen: b.duAnTen,
          han: b.han,
          mucDo: b.han! < hn ? 'qua-han' : 'sap-han',
          lienKet: `/du-an/${b.duAnId}?the=checklist`,
        })

      // Cập nhật nhà thầu gửi, chờ tôi xác nhận — dự án của đơn vị tôi.
      if (xacNhan) {
        const cho = await docBuocCanhBao(
          tx,
          and(
            isNotNull(duAnBuoc.choXacNhan),
            isNull(duAnBuoc.deletedAt),
            isNull(duAn.deletedAt),
            inArray(duAn.donViId, nd.donViIds),
          ),
        )
        for (const b of cho)
          viec.push({
            nguon: 'du-an-xac-nhan',
            nghiepVu: TEN,
            tieuDe: `Xác nhận: ${b.stt}. ${b.ten}`,
            moTa: 'Nhà thầu / tư vấn đã gửi cập nhật',
            hoSoTen: b.duAnTen,
            han: b.han,
            mucDo: 'thuong',
            lienKet: `/du-an/${b.duAnId}?the=checklist`,
          })
      }

      // Đôn đốc gửi tới dự án tôi phụ trách, 30 ngày gần nhất.
      const dd = await tx
        .select({ duAnId: duAn.id, ten: duAn.ten, ngay: duAnDonDoc.ngay, noiDung: duAnDonDoc.noiDung })
        .from(duAnDonDoc)
        .innerJoin(duAn, eq(duAn.id, duAnDonDoc.duAnId))
        .where(
          and(cuaToi(nd.taiKhoanId), gte(duAnDonDoc.ngay, congNgay(hn, -30)), isNull(duAnDonDoc.deletedAt)),
        )
        .orderBy(desc(duAnDonDoc.ngay))
      for (const d of dd)
        viec.push({
          nguon: 'du-an-don-doc',
          nghiepVu: TEN,
          tieuDe: `Bị đôn đốc: ${d.noiDung.length > 90 ? `${d.noiDung.slice(0, 90)}…` : d.noiDung}`,
          moTa: `Ngày ${d.ngay.split('-').reverse().join('/')}`,
          hoSoTen: d.ten,
          han: null,
          mucDo: 'qua-han',
          lienKet: `/du-an/${d.duAnId}`,
        })

      // Vướng mắc chưa giải quyết ở dự án tôi phụ trách.
      const vm = await tx
        .select({
          duAnId: duAn.id,
          ten: duAn.ten,
          noiDung: duAnVuongMac.noiDung,
          ngayNeu: duAnVuongMac.ngayNeu,
        })
        .from(duAnVuongMac)
        .innerJoin(duAn, eq(duAn.id, duAnVuongMac.duAnId))
        .where(and(cuaToi(nd.taiKhoanId), isNull(duAnVuongMac.ngayGiaiQuyet), isNull(duAnVuongMac.deletedAt)))
      for (const v of vm)
        viec.push({
          nguon: 'du-an-vuong-mac',
          nghiepVu: TEN,
          tieuDe: `Vướng mắc: ${v.noiDung.length > 90 ? `${v.noiDung.slice(0, 90)}…` : v.noiDung}`,
          moTa: v.ngayNeu === hn ? 'Nêu hôm nay' : `Nêu ${soNgayGiua(v.ngayNeu, hn)} ngày trước`,
          hoSoTen: v.ten,
          han: null,
          mucDo: 'thuong',
          lienKet: `/du-an/${v.duAnId}?the=vuong-mac`,
        })
      return viec
    })
  }

  // ── Đôn đốc (Điều 36) ────────────────────────────────────────────────────

  /** Gửi đôn đốc tới nhiều dự án cùng lúc — chỉ dự án thuộc đơn vị trong phạm vi (không tính dự án chỉ là thành viên). */
  guiDonDoc(nd: NguoiDungPhien, than: unknown): Promise<{ dot: string; soDuAn: number }> {
    const ids = [...new Set(mang(than, 'duAnIds', 500).map((x) => maUuid(x, 'duAnIds')))]
    if (ids.length === 0) throw new BadRequestException('Chọn ít nhất một dự án')
    const noiDung = chuoi(than, 'noiDung', 2000, true)
    const hn = homNay()
    const dot = randomUUID()
    return trongPhamVi(this.db, nd.nguCanh, async (tx) => {
      const ds = await tx
        .select({ id: duAn.id, donViId: duAn.donViId })
        .from(duAn)
        .where(and(inArray(duAn.id, ids), isNull(duAn.deletedAt), inArray(duAn.donViId, nd.donViIds)))
      if (ds.length !== ids.length)
        throw new NotFoundException('Có dự án không tìm thấy hoặc ngoài phạm vi đôn đốc')
      await tx.insert(duAnDonDoc).values(
        ds.map((d) => ({
          duAnId: d.id,
          donViId: d.donViId,
          ngay: hn,
          noiDung,
          dot,
          nguoiGui: nd.taiKhoanId,
        })),
      )
      await tx.update(duAn).set({ donDocNgay: hn }).where(inArray(duAn.id, ids))
      return { dot, soDuAn: ds.length }
    })
  }

  async lichSuDonDoc(nd: NguoiDungPhien): Promise<DotDonDoc[]> {
    const ds = await trongPhamVi(this.db, nd.nguCanh, (tx) =>
      tx
        .select({
          dot: duAnDonDoc.dot,
          ngay: duAnDonDoc.ngay,
          noiDung: duAnDonDoc.noiDung,
          nguoiGui: sql<string | null>`ten_tai_khoan(${duAnDonDoc.nguoiGui})`,
          id: duAn.id,
          ma: duAn.ma,
          ten: duAn.ten,
        })
        .from(duAnDonDoc)
        .innerJoin(duAn, eq(duAn.id, duAnDonDoc.duAnId))
        .where(isNull(duAnDonDoc.deletedAt))
        .orderBy(desc(duAnDonDoc.createdAt))
        .limit(500),
    )
    const theoDot = new Map<string, DotDonDoc>()
    for (const d of ds) {
      const dot = theoDot.get(d.dot) ?? {
        dot: d.dot,
        ngay: d.ngay,
        noiDung: d.noiDung,
        nguoiGui: d.nguoiGui,
        duAn: [],
      }
      dot.duAn.push({ id: d.id, ma: d.ma, ten: d.ten })
      theoDot.set(d.dot, dot)
    }
    return [...theoDot.values()].slice(0, 50)
  }
}

function docBuocCanhBao(tx: GiaoDich, dk: SQL | undefined) {
  return tx
    .select({
      duAnId: duAn.id,
      ma: duAn.ma,
      duAnTen: duAn.ten,
      donViTen: sql<string>`ten_don_vi(${duAn.donViId})`,
      stt: duAnBuoc.stt,
      ten: duAnBuoc.ten,
      han: duAnBuoc.han,
    })
    .from(duAnBuoc)
    .innerJoin(duAn, eq(duAn.id, duAnBuoc.duAnId))
    .where(dk)
    .orderBy(asc(duAnBuoc.han))
    .limit(500)
}
