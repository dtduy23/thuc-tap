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
  doublePrecision,
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
    /** Địa điểm đầu tư — lên cột của Biểu 01. */
    diaDiem: text('dia_diem'),
    /** Ngày đơn vị cập nhật gần nhất — cảnh báo "lâu không cập nhật". */
    capNhatNgay: date('cap_nhat_ngay', { mode: 'string' }),
    canBoId: uuid('can_bo_id').references(() => taiKhoan.id),
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
    /** Số thực: chèn bước vào giữa lấy trung bình hai bên — không phải đánh số lại cả dự án. */
    thuTu: doublePrecision('thu_tu').notNull(),
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

/**
 * Phiên bản kế hoạch — mỗi lần CHỐT kế hoạch là một dòng, kèm ảnh chụp hạn các bước.
 * Phiên bản 1 là kế hoạch gốc lúc tạo dự án. So hạn hiện tại với ảnh chụp mới nhất
 * là biết kế hoạch đang lệch bao nhiêu so với lần chốt; số phiên bản vào KPI (điều chỉnh kế hoạch).
 */
export const duAnPhienBan = pgTable(
  'du_an_phien_ban',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    so: integer('so').notNull(),
    ngay: date('ngay', { mode: 'string' }).notNull(),
    lyDo: text('ly_do').notNull(),
    /** Cấp có thẩm quyền cho phép điều chỉnh (quyết định số …). */
    canCu: text('can_cu'),
    /** Ngày kết thúc dự kiến lùi bao nhiêu so với phiên bản trước. */
    soNgayLui: integer('so_ngay_lui').notNull().default(0),
    ngayKetThuc: date('ngay_ket_thuc', { mode: 'string' }),
    /** [{ id, stt, ten, han }] các bước chính thức lúc chốt. */
    anhChup: jsonb('anh_chup').notNull(),
    nguoiChot: uuid('nguoi_chot'),
    ...thoiDiem,
  },
  (t) => [uniqueIndex('du_an_phien_ban_so_uq').on(t.duAnId, t.so)],
)

// ── Hồ sơ dự án: văn bản, vốn, giải ngân, vướng mắc (ADR-0008) ─────────────
// Cùng luật như bước: don_vi_id do trigger lấy theo dự án; thấy khi trong phạm vi
// hoặc là thành viên; chỉ đơn vị chủ đầu tư ghi (migration 0014).

/** Văn bản / tài liệu đính kèm. Tệp nằm ở kho tệp; bảng chỉ giữ khóa và thông tin văn bản. */
export const duAnVanBan = pgTable(
  'du_an_van_ban',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    buocId: uuid('buoc_id').references(() => duAnBuoc.id),
    giaiNganId: uuid('giai_ngan_id'),
    tenTep: text('ten_tep').notNull(),
    khoaTep: text('khoa_tep').notNull(),
    loaiTep: text('loai_tep').notNull(),
    kichThuoc: integer('kich_thuoc').notNull(),
    tieuDe: text('tieu_de'),
    soKyHieu: text('so_ky_hieu'),
    ngayKy: date('ngay_ky', { mode: 'string' }),
    nguoiKy: text('nguoi_ky'),
    toSo: text('to_so'),
    ghiChu: text('ghi_chu'),
    nguoiTai: uuid('nguoi_tai'),
    ...thoiDiem,
  },
  (t) => [index('du_an_van_ban_du_an_idx').on(t.duAnId)],
)

/** Kế hoạch vốn theo năm × nguồn vốn (triệu đồng). Giải ngân KHÔNG nhập ở đây — cộng từ các đợt. */
export const duAnVon = pgTable(
  'du_an_von',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    nam: integer('nam').notNull(),
    nguonVonId: uuid('nguon_von_id')
      .notNull()
      .references(() => danhMucGiaTri.id),
    keHoach: numeric('ke_hoach', { precision: 15, scale: 0, mode: 'number' }).notNull().default(0),
    ghiChu: text('ghi_chu'),
    ...thoiDiem,
  },
  (t) => [index('du_an_von_du_an_idx').on(t.duAnId, t.nam)],
)

/** Một đợt giải ngân: ngày + số tiền (triệu đồng) + chứng từ (văn bản gắn qua giai_ngan_id). */
export const duAnGiaiNgan = pgTable(
  'du_an_giai_ngan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    nam: integer('nam').notNull(),
    nguonVonId: uuid('nguon_von_id')
      .notNull()
      .references(() => danhMucGiaTri.id),
    ngay: date('ngay', { mode: 'string' }).notNull(),
    soTien: numeric('so_tien', { precision: 15, scale: 0, mode: 'number' }).notNull(),
    dot: text('dot'),
    soKyHieu: text('so_ky_hieu'),
    ghiChu: text('ghi_chu'),
    nguoiTao: uuid('nguoi_tao'),
    ...thoiDiem,
  },
  (t) => [index('du_an_giai_ngan_du_an_idx').on(t.duAnId, t.ngay)],
)

/** Vướng mắc — khó khăn của dự án, có thể gắn một bước. Giải quyết xong thì hết cảnh báo. */
export const duAnVuongMac = pgTable(
  'du_an_vuong_mac',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    buocId: uuid('buoc_id').references(() => duAnBuoc.id),
    noiDung: text('noi_dung').notNull(),
    ngayNeu: date('ngay_neu', { mode: 'string' }).notNull(),
    ngayGiaiQuyet: date('ngay_giai_quyet', { mode: 'string' }),
    ketQua: text('ket_qua'),
    nguoiNeu: uuid('nguoi_neu'),
    ...thoiDiem,
  },
  (t) => [index('du_an_vuong_mac_du_an_idx').on(t.duAnId)],
)

/** Một lần đôn đốc (Điều 36 NĐ 45) gửi tới một dự án. Vết — không sửa; hiện ở "Việc của tôi" của cán bộ phụ trách. */
export const duAnDonDoc = pgTable(
  'du_an_don_doc',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    duAnId: uuid('du_an_id')
      .notNull()
      .references(() => duAn.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    ngay: date('ngay', { mode: 'string' }).notNull(),
    noiDung: text('noi_dung').notNull(),
    /** Mã đợt — cùng một lần bấm gửi cho nhiều dự án. */
    dot: uuid('dot').notNull(),
    nguoiGui: uuid('nguoi_gui'),
    ...thoiDiem,
  },
  (t) => [index('du_an_don_doc_du_an_idx').on(t.duAnId, t.ngay)],
)

/**
 * Giám sát theo lĩnh vực: tài khoản được XEM mọi dự án của một lĩnh vực, ở mọi đơn
 * vị (vd Sở chuyên ngành theo dõi dự án CNTT của các xã). Chỉ xem — sửa vẫn theo
 * đơn vị chủ đầu tư. `don_vi_id` = đơn vị của tài khoản, trigger tự đặt.
 */
export const giamSatLinhVuc = pgTable(
  'giam_sat_linh_vuc',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taiKhoanId: uuid('tai_khoan_id')
      .notNull()
      .references(() => taiKhoan.id),
    linhVucId: uuid('linh_vuc_id')
      .notNull()
      .references(() => danhMucGiaTri.id),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    nguoiTao: uuid('nguoi_tao'),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('giam_sat_linh_vuc_uq')
      .on(t.taiKhoanId, t.linhVucId)
      .where(sql`${t.deletedAt} is null`),
  ],
)

// ════════════════════════════════════════════════════════════════════════════
// VĂN BẢN — Tác nghiệp › Xử lý văn bản (ADR-0009). Hồ sơ nằm ở GDOS (RLS theo đơn
// vị); FOXAI Native chỉ XỬ LÝ (tóm tắt…). Native tạm ngừng thì văn bản cũ vẫn xem được.
// ════════════════════════════════════════════════════════════════════════════

export const vanBan = pgTable(
  'van_ban',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    ten: text('ten').notNull(),
    /** Loại văn bản theo Document Service: Công văn, Báo cáo, Quyết định… */
    loai: text('loai').notNull(),
    /** tai-len (người dùng tải) · qlvb · cong-dvc · email · khac (tích hợp). */
    nguon: text('nguon').notNull().default('tai-len'),
    tenTep: text('ten_tep').notNull(),
    /** Khóa trong kho tệp GDOS — rỗng: văn bản kéo về từ Native, tệp gốc nằm ở Native. */
    khoaTep: text('khoa_tep'),
    loaiTep: text('loai_tep'),
    kichThuoc: integer('kich_thuoc'),
    /** Mã bản ghi phía Native — rỗng khi chưa gửi được. */
    nativeId: text('native_id'),
    /** chua-gui · cho · dang-xu-ly · xong · loi */
    trangThai: text('trang_thai').notNull().default('chua-gui'),
    noiDungGoc: text('noi_dung_goc'),
    tomTat: text('tom_tat'),
    soKyTuGoc: integer('so_ky_tu_goc'),
    soKyTuTomTat: integer('so_ky_tu_tom_tat'),
    moHinh: text('mo_hinh'),
    loi: text('loi'),
    /** Người dùng đã sửa lại bản tóm tắt của AI. */
    daHieuChinh: boolean('da_hieu_chinh').notNull().default(false),
    nguoiTao: uuid('nguoi_tao'),
    /** Người tạo ghi bên Native (văn bản kéo về từ Native). */
    nguoiTaoNative: text('nguoi_tao_native'),
    dongBoLuc: timestamp('dong_bo_luc', { withTimezone: true }),
    ...thoiDiem,
  },
  (t) => [
    index('van_ban_don_vi_idx').on(t.donViId, t.createdAt),
    check('van_ban_trang_thai_ck', sql`${t.trangThai} in ('chua-gui', 'cho', 'dang-xu-ly', 'xong', 'loi')`),
    check('van_ban_nguon_ck', sql`${t.nguon} in ('tai-len', 'qlvb', 'cong-dvc', 'email', 'khac')`),
  ],
)

/**
 * Liên kết tài khoản FOXAI Native của TỪNG người (ADR-0009): người dùng đăng nhập
 * Native một lần; GDOS KHÔNG lưu mật khẩu, chỉ giữ refresh token ĐÃ MÃ HÓA để gọi
 * Native bằng chính danh tính người đó. Kho bí mật — chỉ chủ tài khoản thấy dòng của
 * mình; không gắn trigger nhật ký (token xoay vòng mỗi lần làm mới). Việc liên kết /
 * hủy vẫn có vết qua cột tai_khoan.native_user_id (có nhật ký).
 */
export const lienKetNative = pgTable('lien_ket_native', {
  taiKhoanId: uuid('tai_khoan_id')
    .primaryKey()
    .references(() => taiKhoan.id),
  nativeUserId: text('native_user_id').notNull(),
  /** Tên / email phía Native — để người dùng biết mình đang liên kết tài khoản nào. */
  nativeTen: text('native_ten').notNull(),
  refreshMaHoa: text('refresh_ma_hoa').notNull(),
  lienKetLuc: timestamp('lien_ket_luc', { withTimezone: true }).notNull().defaultNow(),
  lamMoiLuc: timestamp('lam_moi_luc', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * LOẠI CHỨNG TỪ của OCR Service (FOXAI Native) — bản chụp ĐỊNH NGHĨA trường và bảng của
 * từng loại. GDOS không khai cứng trường nào: màn hình và nghiệp vụ dựng theo `dinh_nghia`.
 * `bat` = loại này được lấy kết quả về GDOS (Native dùng chung nhiều khách — không lấy hết).
 */
export const ocrLoai = pgTable(
  'ocr_loai',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    /** Mã loại phía Native (schema code), vd CHUNGTU. */
    ma: text('ma').notNull(),
    ten: text('ten').notNull(),
    moTa: text('mo_ta'),
    nativeId: text('native_id').notNull(),
    /** Native còn bật loại này không. */
    hoatDong: boolean('hoat_dong').notNull().default(true),
    /** { truong: [{khoa, nhan, kieu, batBuoc}], bang: [{khoa, ten, cot: [{khoa, nhan, kieu}]}] } */
    dinhNghia: jsonb('dinh_nghia').notNull(),
    bat: boolean('bat').notNull().default(false),
    dongBoLuc: timestamp('dong_bo_luc', { withTimezone: true }).notNull().defaultNow(),
    ...thoiDiem,
  },
  (t) => [uniqueIndex('ocr_loai_ma_uq').on(t.donViId, t.ma)],
)

/**
 * KẾT QUẢ NHẬN DẠNG lấy về từ OCR Service của FOXAI Native — một dòng một chứng từ.
 * `du_lieu` (trường → giá trị) và `bang` (bảng → các dòng) giữ NGUYÊN như Native trả;
 * dùng thế nào là việc của phân hệ tác nghiệp.
 */
export const ocrChungTu = pgTable(
  'ocr_chung_tu',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donViId: uuid('don_vi_id')
      .notNull()
      .references(() => donVi.id),
    nativeId: text('native_id').notNull(),
    maLoai: text('ma_loai').notNull(),
    tenLoai: text('ten_loai').notNull(),
    tenTep: text('ten_tep').notNull(),
    loaiTep: text('loai_tep'),
    /** da-xu-ly (Native nhận dạng xong) · da-xac-nhan (người dùng Native đã soát). */
    trangThai: text('trang_thai').notNull(),
    /** Độ tin cậy 0–1 do Native chấm. */
    doTinCay: doublePrecision('do_tin_cay'),
    duLieu: jsonb('du_lieu').notNull(),
    bang: jsonb('bang').notNull(),
    nativeTaoLuc: timestamp('native_tao_luc', { withTimezone: true }),
    nativeCapNhatLuc: timestamp('native_cap_nhat_luc', { withTimezone: true }),
    layVeLuc: timestamp('lay_ve_luc', { withTimezone: true }).notNull().defaultNow(),
    layBoi: uuid('lay_boi'),
    ...thoiDiem,
  },
  (t) => [
    uniqueIndex('ocr_chung_tu_native_uq').on(t.donViId, t.nativeId),
    index('ocr_chung_tu_loai_idx').on(t.donViId, t.maLoai, t.nativeCapNhatLuc),
    check('ocr_chung_tu_trang_thai_ck', sql`${t.trangThai} in ('da-xu-ly', 'da-xac-nhan')`),
  ],
)
