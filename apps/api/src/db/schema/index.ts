/**
 * Lược đồ Drizzle — Mốc 1: nền tài khoản, đơn vị, phân công, phiên, nhật ký.
 *
 * Luật cho MỌI bảng nghiệp vụ (ADR-0004):
 *   - có `don_vi_id` → RLS lọc theo đơn vị (policy nằm ở migration 0002)
 *   - có `deleted_at` → xóa mềm; role của app KHÔNG có quyền DELETE
 *   - có trigger ghi nhật ký thao tác; app KHÔNG ghi tay được vào nhật ký
 *
 * Tên bảng/cột tiếng Việt không dấu, gạch dưới — khớp cách PMS đã đặt.
 */
import { sql } from 'drizzle-orm'
import {
  bigserial,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/** Tên đăng nhập không phân biệt hoa thường — "NguyenVanA" và "nguyenvana" là một. */
const citext = customType<{ data: string }>({ dataType: () => 'citext' })

const thoiDiem = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

/**
 * Đơn vị hành chính: tỉnh, xã. Phạm vi DỮ LIỆU tính theo đơn vị này.
 * Phòng ban nội bộ của xã (Văn phòng, Phòng Kinh tế…) KHÔNG phải đơn vị ở đây —
 * chuyên viên phòng nào cũng thấy dữ liệu của xã trong phân hệ được phân (ADR-0006).
 */
export const donVi = pgTable(
  'don_vi',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ma: text('ma').notNull(),
    ten: text('ten').notNull(),
    cap: text('cap').notNull(),
    chaId: uuid('cha_id').references((): AnyPgColumn => donVi.id),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('don_vi_ma_uq').on(t.ma),
    check('don_vi_cap_ck', sql`${t.cap} in ('tinh', 'so-nganh', 'co-quan-dang', 'xa', 'doanh-nghiep')`),
  ],
)

export const taiKhoan = pgTable(
  'tai_khoan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    tenDangNhap: citext('ten_dang_nhap').notNull(),
    hoTen: text('ho_ten').notNull(),
    /** argon2id. Không bao giờ trả ra API, không bao giờ vào nhật ký. */
    matKhauBam: text('mat_khau_bam').notNull(),
    /** Cờ quản trị — độc lập với vai nghiệp vụ (ADR-0003). */
    laQuanTri: boolean('la_quan_tri').notNull().default(false),
    /** Tham chiếu tài khoản FOXAI Native. Rỗng = không dùng được tính năng gọi Native. */
    nativeUserId: text('native_user_id'),
    trangThai: text('trang_thai').notNull().default('hoat-dong'),
    soLanSai: integer('so_lan_sai').notNull().default(0),
    khoaDen: timestamp('khoa_den', { withTimezone: true }),
    doiMatKhauLuc: timestamp('doi_mat_khau_luc', { withTimezone: true }),
    /** Mật khẩu do quản trị cấp (tạo mới / đặt lại) — phải tự đổi trước khi làm việc. */
    phaiDoiMatKhau: boolean('phai_doi_mat_khau').notNull().default(false),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('tai_khoan_ten_dang_nhap_uq').on(t.tenDangNhap),
    index('tai_khoan_don_vi_idx').on(t.donViId),
    check('tai_khoan_trang_thai_ck', sql`${t.trangThai} in ('hoat-dong', 'khoa')`),
  ],
)

/**
 * Phân công = một vai trên một phạm vi phân hệ (ADR-0006). Một tài khoản có
 * nhiều phân công; quyền hiệu lực là hợp. `pham_vi` NULL nghĩa là "tất cả".
 */
export const phanCong = pgTable(
  'phan_cong',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taiKhoanId: uuid('tai_khoan_id')
      .notNull()
      .references(() => taiKhoan.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    vai: text('vai').notNull(),
    phamVi: text('pham_vi').array(),
    ...thoiDiem,
  },
  (t) => [
    index('phan_cong_tai_khoan_idx').on(t.taiKhoanId),
    check('phan_cong_vai_ck', sql`${t.vai} in ('LANH_DAO', 'CHUYEN_VIEN', 'THANH_TRA')`),
  ],
)

/** Refresh token — chỉ lưu bản băm, token gốc chỉ nằm trong cookie của người dùng. */
export const phienDangNhap = pgTable(
  'phien_dang_nhap',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taiKhoanId: uuid('tai_khoan_id')
      .notNull()
      .references(() => taiKhoan.id),
    tokenBam: text('token_bam').notNull(),
    hetHan: timestamp('het_han', { withTimezone: true }).notNull(),
    thuHoiLuc: timestamp('thu_hoi_luc', { withTimezone: true }),
    diaChiIp: text('dia_chi_ip'),
    trinhDuyet: text('trinh_duyet'),
    createdAt: thoiDiem.createdAt,
  },
  (t) => [uniqueIndex('phien_token_bam_uq').on(t.tokenBam), index('phien_tai_khoan_idx').on(t.taiKhoanId)],
)

/**
 * Nhật ký thao tác — bằng chứng pháp lý (NĐ 30/2020, TCVN 11930:2017).
 * CHỈ trigger ghi vào đây; role của app chỉ được SELECT. Không sửa, không xóa.
 */
export const nhatKyThaoTac = pgTable(
  'nhat_ky_thao_tac',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    luc: timestamp('luc', { withTimezone: true }).notNull().defaultNow(),
    taiKhoanId: uuid('tai_khoan_id'),
    donViId: uuid('don_vi_id'),
    hanhDong: text('hanh_dong').notNull(),
    bang: text('bang').notNull(),
    banGhiId: text('ban_ghi_id'),
    giaTriCu: jsonb('gia_tri_cu'),
    giaTriMoi: jsonb('gia_tri_moi'),
  },
  (t) => [
    index('nhat_ky_don_vi_luc_idx').on(t.donViId, t.luc),
    index('nhat_ky_ban_ghi_idx').on(t.bang, t.banGhiId),
  ],
)

/**
 * Cấu hình chung của cả hệ thống (chính sách bảo mật, tên hiển thị) — một dòng
 * một nhóm. Không có gì bí mật nên không cần RLS; app chỉ ĐỌC, ghi qua hàm
 * `cau_hinh_ghi` (migration 0007) — hàm tự kiểm người ghi là quản trị ở đơn vị gốc.
 */
export const cauHinh = pgTable('cau_hinh', {
  khoa: text('khoa').primaryKey(),
  giaTri: jsonb('gia_tri').notNull(),
  /** Đơn vị của người sửa gần nhất — để nhật ký thao tác hiện được dòng này. */
  donViId: uuid('don_vi_id').references(() => donVi.id),
  taiKhoanId: uuid('tai_khoan_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ════════════════════════════════════════════════════════════════════════════
// DANH MỤC & QUY TRÌNH MẪU — dùng chung toàn hệ thống (ADR-0008)
// Không có don_vi_id: ai cũng ĐỌC được; chỉ tài khoản ở đơn vị GỐC được sửa
// (policy ở migration 0009). Nhật ký của các bảng này ghi vào đơn vị gốc.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Giá trị danh mục, một bảng cho mọi loại (lĩnh vực, nguồn vốn, loại văn bản…).
 * Chuyển một loại từ "tham số của module" lên Danh mục chỉ là đổi chỗ trên menu —
 * dữ liệu nằm sẵn ở đây (docs/tu-duy-xay-dung.md mục 4).
 */
export const danhMucGiaTri = pgTable(
  'danh_muc_gia_tri',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    loai: text('loai').notNull(),
    ma: text('ma').notNull(),
    ten: text('ten').notNull(),
    mau: text('mau'),
    thuTu: integer('thu_tu').notNull().default(0),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('danh_muc_gia_tri_loai_ma_uq').on(t.loai, t.ma),
    check('danh_muc_gia_tri_loai_ck', sql`${t.loai} in ('linh-vuc', 'nguon-von', 'loai-van-ban')`),
  ],
)

/**
 * Quy trình mẫu: khung các bước theo 3 giai đoạn. Tạo dự án từ một mẫu là chép
 * các bước sang dự án — sửa mẫu về sau KHÔNG ảnh hưởng dự án đã tạo.
 * Mẫu `khoa` (theo NĐ 45) không sửa được; muốn khác thì nhân bản rồi sửa bản sao.
 */
export const quyTrinhMau = pgTable(
  'quy_trinh_mau',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ma: text('ma').notNull(),
    ten: text('ten').notNull(),
    canCu: text('can_cu'),
    /** Hình thức đầu tư đi theo quy trình — không bắt người dùng khai riêng. */
    hinhThuc: text('hinh_thuc').notNull(),
    /** Mảng BuocMau (packages/shared › du-an.ts). */
    buoc: jsonb('buoc').notNull(),
    khoa: boolean('khoa').notNull().default(false),
    thuTu: integer('thu_tu').notNull().default(0),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('quy_trinh_mau_ma_uq').on(t.ma),
    check(
      'quy_trinh_mau_hinh_thuc_ck',
      sql`${t.hinhThuc} in ('dau-tu', 'thue', 'mua-sam', 'chi-thuong-xuyen', 'khac')`,
    ),
  ],
)

// ════════════════════════════════════════════════════════════════════════════
// DỰ ÁN — Tác nghiệp › Dự án (ADR-0008)
// `don_vi_id` của dự án = đơn vị CHỦ ĐẦU TƯ. RLS: thấy khi đơn vị trong phạm vi
// HOẶC là thành viên dự án (nhà thầu, tư vấn…). Chỉ đơn vị trong phạm vi mới SỬA
// trực tiếp; thành viên ngoài đơn vị chỉ GỬI cập nhật chờ xác nhận.
// ════════════════════════════════════════════════════════════════════════════

export const duAn = pgTable(
  'du_an',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    ma: text('ma').notNull(),
    ten: text('ten').notNull(),
    trangThai: text('trang_thai').notNull().default('dang-thuc-hien'),
    quyTrinhMa: text('quy_trinh_ma'),
    hinhThuc: text('hinh_thuc').notNull(),
    loaiChi: text('loai_chi').notNull(),
    nhomDuAn: text('nhom_du_an'),
    linhVucId: uuid('linh_vuc_id').references(() => danhMucGiaTri.id),
    canCu: text('can_cu'),
    /** Tổng mức đầu tư, triệu đồng. */
    tongMuc: numeric('tong_muc', { precision: 15, scale: 0, mode: 'number' }).notNull().default(0),
    ngayBatDau: date('ngay_bat_dau', { mode: 'string' }).notNull(),
    tienDoMoTa: text('tien_do_mo_ta'),
    /** Ngày đơn vị cập nhật gần nhất — cảnh báo "lâu không cập nhật". */
    capNhatNgay: date('cap_nhat_ngay', { mode: 'string' }),
    canBoId: uuid('can_bo_id').references(() => taiKhoan.id),
    /** Kế hoạch đã chốt gần nhất (ảnh chụp các bước) — để so với nháp. */
    keHoachChot: jsonb('ke_hoach_chot'),
    donDocNgay: date('don_doc_ngay', { mode: 'string' }),
    nguoiTao: uuid('nguoi_tao'),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('du_an_ma_uq').on(t.ma),
    index('du_an_don_vi_idx').on(t.donViId),
    check('du_an_trang_thai_ck', sql`${t.trangThai} in ('dang-thuc-hien', 'hoan-thanh', 'tam-dung', 'huy')`),
    check('du_an_loai_chi_ck', sql`${t.loaiChi} in ('dtpt', 'ctx')`),
    check('du_an_nhom_ck', sql`${t.nhomDuAn} is null or ${t.nhomDuAn} in ('A', 'B', 'C')`),
    check(
      'du_an_hinh_thuc_ck',
      sql`${t.hinhThuc} in ('dau-tu', 'thue', 'mua-sam', 'chi-thuong-xuyen', 'khac')`,
    ),
  ],
)

/** Một bước trong checklist của dự án. Nhóm bước (la_nhom) không có hạn riêng, không tính tiến độ. */
export const duAnBuoc = pgTable(
  'du_an_buoc',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    /** Luôn bằng đơn vị của dự án — trigger tự đặt, để RLS lọc không cần join. */
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    thuTu: integer('thu_tu').notNull(),
    chaId: uuid('cha_id').references((): AnyPgColumn => duAnBuoc.id),
    giaiDoan: text('giai_doan').notNull(),
    stt: text('stt').notNull(),
    laNhom: boolean('la_nhom').notNull().default(false),
    batBuoc: boolean('bat_buoc').notNull().default(true),
    ten: text('ten').notNull(),
    soNgay: integer('so_ngay').notNull().default(0),
    hanGhiDe: date('han_ghi_de', { mode: 'string' }),
    /** Hạn tính theo chuỗi (tinhHan trong @gdos/shared) — lưu để truy vấn quá hạn. */
    han: date('han', { mode: 'string' }),
    ngayHoanThanh: date('ngay_hoan_thanh', { mode: 'string' }),
    soVanBan: text('so_van_ban'),
    donViThucHien: text('don_vi_thuc_hien'),
    benThucHien: text('ben_thuc_hien').notNull().default('chu-dau-tu'),
    ghiChu: text('ghi_chu'),
    boQua: boolean('bo_qua').notNull().default(false),
    lyDoBoQua: text('ly_do_bo_qua'),
    /** Cập nhật do nhà thầu / tư vấn gửi, chờ chủ đầu tư xác nhận. */
    choXacNhan: jsonb('cho_xac_nhan'),
    sanPham: text('san_pham'),
    anTongQuan: boolean('an_tong_quan').notNull().default(false),
    /** Bước nháp: chưa vào kế hoạch chính thức, không tính hạn, không cảnh báo. */
    laNhap: boolean('la_nhap').notNull().default(false),
    ...thoiDiem,
  },
  (t) => [
    index('du_an_buoc_du_an_idx').on(t.duAnId, t.thuTu),
    index('du_an_buoc_han_idx').on(t.donViId, t.han),
    check('du_an_buoc_giai_doan_ck', sql`${t.giaiDoan} in ('I', 'II', 'III')`),
    check('du_an_buoc_ben_ck', sql`${t.benThucHien} in ('chu-dau-tu', 'tu-van', 'nha-thau')`),
  ],
)

/**
 * Thành viên dự án — người NGOÀI đơn vị chủ đầu tư được vào dự án (nhà thầu, tư
 * vấn, giám sát), hoặc cán bộ phụ trách được chỉ định. Thay cho "chỉ định từng dự
 * án" của PMS.
 */
export const duAnThanhVien = pgTable(
  'du_an_thanh_vien',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    taiKhoanId: uuid('tai_khoan_id')
      .notNull()
      .references(() => taiKhoan.id),
    vaiTro: text('vai_tro').notNull(),
    ...thoiDiem,
  },
  (t) => [
    index('du_an_thanh_vien_tai_khoan_idx').on(t.taiKhoanId),
    index('du_an_thanh_vien_du_an_idx').on(t.duAnId),
    check('du_an_thanh_vien_vai_ck', sql`${t.vaiTro} in ('phu-trach', 'nha-thau', 'tu-van', 'giam-sat')`),
  ],
)
