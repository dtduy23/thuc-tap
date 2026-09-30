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
  index,
  integer,
  jsonb,
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
  (t) => [uniqueIndex('don_vi_ma_uq').on(t.ma), check('don_vi_cap_ck', sql`${t.cap} in ('tinh', 'xa')`)],
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
