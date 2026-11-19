/**
 * BỘ CHỈ TIÊU ĐIỀU HÀNH cấp xã/phường — danh mục đã được thông qua (theo "Dashboard GDOS
 * Xã/Phường" của GDOS cũ): mã, tên, đơn vị, lĩnh vực, mục tiêu. Danh mục ở ĐÂY là một chỗ
 * duy nhất; API trả GIÁ TRỊ, web vẽ.
 *
 * Giá trị mỗi chỉ tiêu có NGUỒN rõ ràng:
 *   - that     : tính từ phân hệ GDOS đã xây (Nhiệm vụ, Dự án…) — số thật của người đang xem;
 *   - minh-hoa : chưa có phân hệ nguồn → số MINH HỌA để xem trước bố cục, không dùng để báo cáo;
 *   - nap      : nạp từ NGOÀI qua Tầng 2 › Nguồn dữ liệu vào (API của khách hoặc tệp Excel) — số thật
 *                của đơn vị, kèm kênh, tên nguồn, kỳ và thời điểm nạp;
 *   - chua-co  : đáng lẽ có số thật nhưng chưa lấy được (chưa liên kết Native, chưa có dữ liệu).
 */

export const LINH_VUC_CHI_TIEU = {
  kpi: 'KPI điều hành',
  tthc: 'TTHC – Một cửa',
  pakn: 'Phản ánh – Kiến nghị',
  'dan-cu': 'Dân cư – Xã hội',
  'kinh-te': 'Kinh tế – Ngân sách',
  antt: 'An ninh – Trật tự',
  'ha-tang': 'Hạ tầng – Đô thị',
  'yt-gd': 'Y tế – Giáo dục',
  'benh-vien': 'Bệnh viện',
} as const
export type LinhVucChiTieu = keyof typeof LINH_VUC_CHI_TIEU

export interface ChiTieuDef {
  ma: string
  ten: string
  /** Tên ngắn cho thẻ số. */
  ngan?: string
  donVi: string
  linhVuc: LinhVucChiTieu
  /** Mục tiêu (cùng đơn vị). Có mục tiêu thì chỉ tiêu được chấm đạt / chưa đạt. */
  mucTieu?: number
  /** Càng THẤP càng tốt (quá hạn, thời gian xử lý…). Mặc định càng cao càng tốt. */
  thapTot?: boolean
  /** Số chữ số thập phân khi hiển thị. */
  soLe?: number
  /** KPI: tính từ chỉ tiêu nào. */
  cachTinh?: string
  /** Đơn vị đầu mối cung cấp số liệu. */
  dauMoi?: string
}

const ct = (
  linhVuc: LinhVucChiTieu,
  ma: string,
  ten: string,
  donVi: string,
  them: Partial<ChiTieuDef> = {},
): ChiTieuDef => ({ ma, ten, donVi, linhVuc, ...them })

export const BO_CHI_TIEU: readonly ChiTieuDef[] = [
  // ── KPI điều hành cấp trên giao — tự tổng hợp từ chỉ tiêu lĩnh vực ──
  ct('kpi', 'KPI-01', 'TTHC giải quyết đúng hạn', '%', {
    ngan: 'TTHC đúng hạn',
    mucTieu: 90,
    soLe: 2,
    cachTinh: 'TTHC-03 ÷ TTHC-02',
    dauMoi: 'Văn phòng – Một cửa',
  }),
  ct('kpi', 'KPI-02', 'Dịch vụ công trực tuyến toàn trình', '%', {
    ngan: 'DVC toàn trình',
    mucTieu: 80,
    soLe: 2,
    cachTinh: 'Lấy trực tiếp TTHC-07',
    dauMoi: 'Văn phòng – Một cửa',
  }),
  ct('kpi', 'KPI-03', 'Phản hồi phản ánh – kiến nghị trong 3 ngày', '%', {
    ngan: 'PAKN ≤ 3 ngày',
    mucTieu: 90,
    soLe: 1,
    cachTinh: 'Lấy trực tiếp PAKN-05',
    dauMoi: 'Văn phòng HĐND-UBND',
  }),
  ct('kpi', 'KPI-04', 'Nhiệm vụ cấp trên giao thực hiện đúng hạn', '%', {
    ngan: 'Nhiệm vụ đúng hạn',
    mucTieu: 90,
    soLe: 1,
    cachTinh: '(Tổng nhiệm vụ − nhiệm vụ quá hạn) ÷ tổng nhiệm vụ — phân hệ Nhiệm vụ',
    dauMoi: 'Văn phòng HĐND-UBND',
  }),
  ct('kpi', 'KPI-05', 'Số hóa hồ sơ, kết quả giải quyết TTHC', '%', {
    ngan: 'Số hóa hồ sơ',
    mucTieu: 95,
    soLe: 1,
    cachTinh: 'Lấy trực tiếp TTHC-08',
    dauMoi: 'Một cửa – CNTT',
  }),
  ct('kpi', 'KPI-06', 'Mức độ hài lòng của người dân', '%', {
    ngan: 'Hài lòng',
    mucTieu: 90,
    soLe: 1,
    cachTinh: 'Lấy trực tiếp TTHC-17',
    dauMoi: 'Khảo sát / Một cửa',
  }),

  // ── TTHC – Một cửa ──
  ct('tthc', 'TTHC-01', 'Hồ sơ tiếp nhận', 'hồ sơ', { ngan: 'Tiếp nhận' }),
  ct('tthc', 'TTHC-02', 'Hồ sơ đã giải quyết', 'hồ sơ', { ngan: 'Đã giải quyết' }),
  ct('tthc', 'TTHC-03', 'Hồ sơ giải quyết đúng hạn', 'hồ sơ', { ngan: 'Đúng hạn' }),
  ct('tthc', 'TTHC-04', 'Hồ sơ đang xử lý (trong hạn)', 'hồ sơ', { ngan: 'Đang xử lý' }),
  ct('tthc', 'TTHC-05', 'Hồ sơ quá hạn chưa trả', 'hồ sơ', {
    ngan: 'Quá hạn chưa trả',
    thapTot: true,
    mucTieu: 0,
  }),
  ct('tthc', 'TTHC-06', 'Tỷ lệ giải quyết đúng hạn', '%', { mucTieu: 90, soLe: 2 }),
  ct('tthc', 'TTHC-07', 'Tỷ lệ DVC trực tuyến toàn trình', '%', { mucTieu: 80, soLe: 2 }),
  ct('tthc', 'TTHC-08', 'Tỷ lệ số hóa hồ sơ, kết quả', '%', { mucTieu: 95, soLe: 1 }),
  ct('tthc', 'TTHC-09', 'Hồ sơ Tư pháp – Hộ tịch', 'hồ sơ'),
  ct('tthc', 'TTHC-10', 'Hồ sơ Lao động – TB – XH', 'hồ sơ'),
  ct('tthc', 'TTHC-11', 'Hồ sơ Đăng ký kinh doanh / HKD', 'hồ sơ'),
  ct('tthc', 'TTHC-12', 'Hồ sơ Xây dựng', 'hồ sơ'),
  ct('tthc', 'TTHC-13', 'Hồ sơ Đất đai', 'hồ sơ'),
  ct('tthc', 'TTHC-14', 'Hồ sơ lĩnh vực khác', 'hồ sơ'),
  ct('tthc', 'TTHC-17', 'Mức độ hài lòng với TTHC', '%', { mucTieu: 90, soLe: 1 }),

  // ── Phản ánh – Kiến nghị ──
  ct('pakn', 'PAKN-01', 'Phản ánh, kiến nghị tiếp nhận', 'lượt', { ngan: 'Tiếp nhận' }),
  ct('pakn', 'PAKN-02', 'Đã xử lý xong', 'lượt'),
  ct('pakn', 'PAKN-03', 'Đang xử lý (trong hạn)', 'lượt'),
  ct('pakn', 'PAKN-04', 'Quá hạn chưa xử lý', 'lượt', { thapTot: true, mucTieu: 0 }),
  ct('pakn', 'PAKN-05', 'Tỷ lệ phản hồi / xử lý trong 3 ngày', '%', { mucTieu: 90, soLe: 1 }),
  ct('pakn', 'PAKN-06', 'Thời gian xử lý trung bình', 'ngày', { thapTot: true, mucTieu: 3, soLe: 1 }),

  // ── Dân cư – Xã hội ──
  ct('dan-cu', 'DC-01', 'Tổng dân số', 'người'),
  ct('dan-cu', 'DC-02', 'Dân số nam', 'người'),
  ct('dan-cu', 'DC-03', 'Người trong độ tuổi lao động', 'người'),
  ct('dan-cu', 'DC-04', 'Trẻ em 0–14 tuổi', 'người'),
  ct('dan-cu', 'DC-05', 'Người cao tuổi 60+', 'người'),
  ct('dan-cu', 'DC-06', 'Tổng số hộ dân', 'hộ'),
  ct('dan-cu', 'DC-07', 'Hộ nghèo', 'hộ', { thapTot: true }),
  ct('dan-cu', 'DC-08', 'Hộ cận nghèo', 'hộ', { thapTot: true }),
  ct('dan-cu', 'DC-09', 'Tỷ lệ bao phủ BHYT', '%', { mucTieu: 95, soLe: 2 }),
  ct('dan-cu', 'DC-10', 'Lao động có việc làm ổn định', 'người'),
  ct('dan-cu', 'DC-11', 'Hộ mới phát sinh trong kỳ', 'hộ'),
  ct('dan-cu', 'DC-12', 'Đồng bộ CSDL quốc gia về dân cư', '%', { soLe: 1 }),

  // ── Kinh tế – Ngân sách ──
  ct('kinh-te', 'KT-01', 'Tổng thu ngân sách', 'tỷ đồng', { soLe: 1 }),
  ct('kinh-te', 'KT-02', 'Tổng chi ngân sách', 'tỷ đồng', { soLe: 1 }),
  ct('kinh-te', 'KT-03', 'Đạt kế hoạch thu ngân sách năm', '%', { soLe: 1 }),
  ct('kinh-te', 'KT-04', 'Giải ngân đầu tư công', '%', {
    soLe: 1,
    cachTinh: 'Đã giải ngân ÷ tổng mức đầu tư các dự án — phân hệ Dự án',
  }),
  ct('kinh-te', 'KT-05', 'Hộ kinh doanh cá thể', 'hộ'),
  ct('kinh-te', 'KT-06', 'Hộ kinh doanh đăng ký mới', 'hộ'),
  ct('kinh-te', 'KT-07', 'Doanh nghiệp đang hoạt động', 'DN'),
  ct('kinh-te', 'KT-08', 'Hợp tác xã', 'HTX'),
  ct('kinh-te', 'KT-09', 'Diện tích đất nông nghiệp', 'ha', { soLe: 0 }),
  ct('kinh-te', 'KT-10', 'Mã số vùng trồng', 'mã'),
  ct('kinh-te', 'KT-11', 'Sản phẩm chủ lực / OCOP', 'sản phẩm'),
  ct('kinh-te', 'KT-12', 'Thanh toán không dùng tiền mặt', '%', { soLe: 1 }),

  // ── An ninh – Trật tự ──
  ct('antt', 'ANTT-01', 'Vụ việc an ninh trật tự', 'vụ', { thapTot: true }),
  ct('antt', 'ANTT-02', 'Vụ việc đã xử lý / điều tra', 'vụ'),
  ct('antt', 'ANTT-03', 'Lượt tuần tra', 'lượt'),
  ct('antt', 'ANTT-04', 'Camera giám sát', 'camera'),
  ct('antt', 'ANTT-05', 'Vi phạm TTĐT / ATGT đã xử lý', 'vụ'),

  // ── Hạ tầng – Đô thị ──
  ct('ha-tang', 'HT-01', 'Tuyến đường trục', 'tuyến'),
  ct('ha-tang', 'HT-02', 'Đường được cứng hóa', '%', { mucTieu: 100, soLe: 1 }),
  ct('ha-tang', 'HT-03', 'Hẻm / ngõ có chiếu sáng', '%', { mucTieu: 100, soLe: 1 }),
  ct('ha-tang', 'HT-04', 'Hộ dùng nước sạch hợp vệ sinh', '%', { mucTieu: 100, soLe: 1 }),
  ct('ha-tang', 'HT-05', 'Rác thải được thu gom, xử lý', '%', { mucTieu: 100, soLe: 1 }),
  ct('ha-tang', 'HT-06', 'Công trình, dự án đang thi công', 'công trình', {
    cachTinh: 'Số dự án đang thực hiện — phân hệ Dự án',
  }),

  // ── Y tế – Giáo dục ──
  ct('yt-gd', 'YTGD-01', 'Trạm y tế', 'trạm'),
  ct('yt-gd', 'YTGD-02', 'Lượt khám chữa bệnh trong tháng', 'lượt'),
  ct('yt-gd', 'YTGD-03', 'Trẻ được tiêm chủng đầy đủ', '%', { mucTieu: 95, soLe: 1 }),
  ct('yt-gd', 'YTGD-04', 'Trường học', 'trường'),
  ct('yt-gd', 'YTGD-05', 'Tổng số học sinh', 'học sinh'),
  ct('yt-gd', 'YTGD-06', 'Trường đạt chuẩn quốc gia', '%', { mucTieu: 100, soLe: 0 }),

  ct('benh-vien', 'BV-01', 'Lượt khám ngoại trú', 'lượt'),
  ct('benh-vien', 'BV-02', 'Ca nhập viện', 'ca'),
  ct('benh-vien', 'BV-03', 'Ca ra viện', 'ca'),
  ct('benh-vien', 'BV-04', 'Ngày giường sử dụng', 'ngày giường'),
  ct('benh-vien', 'BV-05', 'Ngày giường khả dụng', 'ngày giường'),
  ct('benh-vien', 'BV-06', 'Lượt xét nghiệm', 'lượt'),
  ct('benh-vien', 'BV-07', 'Lượt chụp X-quang', 'lượt'),
  ct('benh-vien', 'BV-08', 'Hồ sơ BHYT gửi', 'hồ sơ'),
  ct('benh-vien', 'BV-09', 'Hồ sơ BHYT bị trả', 'hồ sơ'),
  ct('benh-vien', 'BV-10', 'Ca lao ghi nhận', 'ca'),
  ct('benh-vien', 'BV-11', 'Ca lao đang điều trị cuối kỳ', 'ca'),
]

export type NguonGiaTri = 'that' | 'nap' | 'minh-hoa' | 'chua-co'

export interface GiaTriChiTieu {
  giaTri: number | null
  nguon: NguonGiaTri
  /** 10 kỳ gần nhất (kỳ cuối = giá trị hiện tại). Rỗng khi chưa có chuỗi (số thật mới nối). */
  chuoi: number[]
  /** Số thật: lấy từ phân hệ nào + mở chức năng nào để xem chi tiết. */
  phanHe?: string
  lienKet?: string
  /** Vì sao chưa có (nguon = chua-co). */
  lyDo?: string
  /** Số nạp (nguon = nap): kênh, tên nguồn API / tên tệp, kỳ của số ('T9/2026'), lúc nạp. */
  kenh?: 'api' | 'excel'
  tenNguon?: string
  ky?: string
  capNhatLuc?: string
}

/** Số liệu THẬT từ các phân hệ đã xây — hiện thành khối riêng ở trang Tổng quan. */
export interface SoLieuPhanHe {
  phanHe: string
  lienKet: string
  /** null: người xem không có quyền hoặc chưa lấy được — kèm lý do. */
  so: { nhan: string; giaTri: number; mau?: 'danger' | 'warn' | 'ok' }[] | null
  lyDo?: string
}

export interface BangChiTieu {
  /** Kỳ số liệu, vd "T9/2026". */
  ky: string
  giaTri: Record<string, GiaTriChiTieu>
  phanHe: SoLieuPhanHe[]
}

export type TrangThaiChiTieu = 'dat' | 'chua-dat' | 'khong-cham'

/** Chấm đạt / chưa đạt theo mục tiêu. Không có mục tiêu hoặc chưa có số → không chấm. */
export function chamChiTieu(d: ChiTieuDef, giaTri: number | null): TrangThaiChiTieu {
  if (d.mucTieu === undefined || giaTri === null) return 'khong-cham'
  return (d.thapTot ? giaTri <= d.mucTieu : giaTri >= d.mucTieu) ? 'dat' : 'chua-dat'
}

export const timChiTieu = (ma: string): ChiTieuDef | undefined => BO_CHI_TIEU.find((c) => c.ma === ma)
