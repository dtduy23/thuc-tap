import { Controller, Get, Inject } from '@nestjs/common'
import type {
  DongLuuTru,
  HangDoiXuLy,
  LuuTruTep,
  MucHangDoi,
  SucKhoeHeThong,
  ThanhPhanSucKhoe,
} from '@gdos/shared'
import { access, constants } from 'node:fs/promises'
import { and, asc, inArray, isNull, sql } from 'drizzle-orm'
import { CAU_HINH, type CauHinh } from '../cau-hinh.js'
import { CoSoDuLieu, dbCua } from '../db/co-so-du-lieu.js'
import { trongPhamVi, truyVan } from '../db/pham-vi.js'
import { vanBan } from '../db/schema/index.js'
import { KET_NOI_NATIVE, type KetNoiNative } from '../native/ket-noi-native.js'
import { CanQuyen, NguoiDung, type NguoiDungPhien } from '../xac-thuc/bao-ve.js'

const KHOI_DONG = new Date()

/** Đo một phép kiểm: kết quả + mất bao lâu. Lỗi nào cũng thành trạng thái, không ném ra. */
async function do_<T>(viec: () => Promise<T>): Promise<{ kq: T | null; ms: number; loi?: string }> {
  const t = Date.now()
  try {
    return { kq: await viec(), ms: Date.now() - t }
  } catch (e) {
    return { kq: null, ms: Date.now() - t, loi: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Theo dõi vận hành — CHỈ ĐỌC, quyền QT_VAN_HANH. Số liệu về văn bản / tệp nằm trong
 * phạm vi đơn vị của người xem (RLS); quản trị ở đơn vị gốc thì thấy toàn hệ thống.
 * Không trả bí mật: địa chỉ Native hiện được, khóa và mật khẩu thì không bao giờ.
 */
@Controller('van-hanh')
export class VanHanhController {
  constructor(
    @Inject(CoSoDuLieu) private readonly csdl: CoSoDuLieu,
    @Inject(CAU_HINH) private readonly cauHinh: CauHinh,
    @Inject(KET_NOI_NATIVE) private readonly native: KetNoiNative,
  ) {}

  @Get('suc-khoe')
  @CanQuyen('QT_VAN_HANH.READ')
  async sucKhoe(): Promise<SucKhoeHeThong> {
    const [pg, nat, tep] = await Promise.all([
      do_(() => this.csdl.kiemTra()),
      do_(() => this.native.kiemTra()),
      do_(() => access(this.cauHinh.thuMucTep, constants.R_OK | constants.W_OK)),
    ])
    const thanhPhan: ThanhPhanSucKhoe[] = [
      { ma: 'api', ten: 'Máy chủ ứng dụng (API)', trangThai: 'ok', chiTiet: 'Đang phục vụ.', msPhanHoi: 0 },
      {
        ma: 'postgres',
        ten: 'Cơ sở dữ liệu',
        trangThai: pg.kq === 'ok' ? 'ok' : 'loi',
        chiTiet: pg.kq === 'ok' ? 'Kết nối và truy vấn được.' : 'Không truy vấn được cơ sở dữ liệu.',
        msPhanHoi: pg.ms,
      },
      {
        ma: 'kho-tep',
        ten: 'Kho tệp đính kèm',
        trangThai: tep.loi ? 'loi' : 'ok',
        chiTiet: tep.loi ? 'Không đọc / ghi được thư mục kho tệp.' : 'Đọc và ghi được.',
        msPhanHoi: tep.ms,
      },
      {
        ma: 'foxai-native',
        ten: 'FOXAI Native',
        trangThai:
          this.native.cheDo === 'that'
            ? nat.kq?.ok
              ? 'ok'
              : 'loi'
            : this.native.cheDo === 'gia'
              ? 'canh-bao'
              : 'canh-bao',
        chiTiet:
          this.native.cheDo === 'that'
            ? (nat.kq?.thongDiep ?? 'Không tới được FOXAI Native.')
            : this.native.cheDo === 'gia'
              ? 'Đang chạy bản giả (máy dev) — không gọi AI thật.'
              : 'Chưa cấu hình NATIVE_URL — các chức năng văn bản, nhiệm vụ không dùng được.',
        msPhanHoi: this.native.cheDo === 'that' ? nat.ms : null,
      },
    ]
    return {
      phienBan: this.cauHinh.phienBan,
      moiTruong: process.env.NODE_ENV ?? 'development',
      khoiDongLuc: KHOI_DONG.toISOString(),
      nodeJs: process.version,
      boNhoMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      kiemLuc: new Date().toISOString(),
      thanhPhan,
    }
  }

  /** Văn bản đang chờ / đang xử lý ở Native, và văn bản lỗi cần gửi lại. */
  @Get('hang-doi')
  @CanQuyen('QT_VAN_HANH.READ')
  async hangDoi(@NguoiDung() nd: NguoiDungPhien): Promise<HangDoiXuLy> {
    const ds = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, (tx) =>
      tx
        .select({
          id: vanBan.id,
          ten: vanBan.ten,
          trangThai: vanBan.trangThai,
          donViTen: sql<string>`ten_don_vi(${vanBan.donViId})`,
          nguoiTao: sql<string | null>`coalesce(${vanBan.nguoiTaoNative}, ten_tai_khoan(${vanBan.nguoiTao}))`,
          capNhat: vanBan.updatedAt,
          loi: vanBan.loi,
        })
        .from(vanBan)
        .where(and(isNull(vanBan.deletedAt), inArray(vanBan.trangThai, ['cho', 'dang-xu-ly', 'loi'])))
        .orderBy(asc(vanBan.updatedAt))
        .limit(500),
    )
    const nay = Date.now()
    const muc: MucHangDoi[] = ds.map((d) => ({
      id: d.id,
      ten: d.ten,
      trangThai: d.trangThai as MucHangDoi['trangThai'],
      donViTen: d.donViTen,
      nguoiTao: d.nguoiTao,
      capNhatLuc: d.capNhat.toISOString(),
      soPhutCho: Math.max(0, Math.round((nay - d.capNhat.getTime()) / 60_000)),
      loi: d.loi,
    }))
    const dem = (t: MucHangDoi['trangThai']) => muc.filter((m) => m.trangThai === t).length
    return { dem: { cho: dem('cho'), dangXuLy: dem('dang-xu-ly'), loi: dem('loi') }, muc }
  }

  /** Số tệp và dung lượng đang giữ, theo nghiệp vụ – đơn vị – loại tệp. */
  @Get('luu-tru')
  @CanQuyen('QT_VAN_HANH.READ')
  async luuTru(@NguoiDung() nd: NguoiDungPhien): Promise<LuuTruTep> {
    const { dong, oNative } = await trongPhamVi(dbCua(this.csdl), nd.nguCanh, async (tx) => ({
      dong: await truyVan<{
        nhom: string
        don_vi_ten: string
        loai_tep: string
        so_tep: number
        dung_luong: string
      }>(
        tx,
        sql`select nhom, don_vi_ten, loai_tep, count(*)::int as so_tep, coalesce(sum(kich_thuoc), 0)::text as dung_luong
            from (
              select 'Hồ sơ dự án' as nhom, ten_don_vi(don_vi_id) as don_vi_ten,
                     lower(coalesce(nullif(substring(ten_tep from '[.]([A-Za-z0-9]{1,8})$'), ''), 'khác')) as loai_tep,
                     kich_thuoc
              from du_an_van_ban where deleted_at is null
              union all
              select 'Xử lý văn bản', ten_don_vi(don_vi_id),
                     lower(coalesce(nullif(substring(ten_tep from '[.]([A-Za-z0-9]{1,8})$'), ''), 'khác')),
                     kich_thuoc
              from van_ban where deleted_at is null and khoa_tep is not null
            ) t
            group by nhom, don_vi_ten, loai_tep
            order by sum(kich_thuoc) desc nulls last`,
      ),
      oNative: await truyVan<{ n: number }>(
        tx,
        sql`select count(*)::int as n from van_ban where deleted_at is null and khoa_tep is null`,
      ),
    }))
    const ds: DongLuuTru[] = dong.map((d) => ({
      nhom: d.nhom,
      donViTen: d.don_vi_ten,
      loaiTep: d.loai_tep,
      soTep: Number(d.so_tep),
      dungLuong: Number(d.dung_luong),
    }))
    return {
      tongTep: ds.reduce((t, d) => t + d.soTep, 0),
      tongDungLuong: ds.reduce((t, d) => t + d.dungLuong, 0),
      tepONative: Number(oNative[0]?.n ?? 0),
      dong: ds,
    }
  }
}
