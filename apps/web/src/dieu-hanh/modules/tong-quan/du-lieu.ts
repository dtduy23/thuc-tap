/**
 * Số liệu bản gốc viết thẳng trong hàm `V.tongquan` (không nằm trong object `D`).
 * Gom về đây để JSX không còn số rời, và khi nối API thật chỉ phải sửa một chỗ.
 */

/** Nhãn trục ngày của biểu đồ TTHC. */
export const NGAY = ['01/09', '02/09', '03/09', '04/09', '05/09', '06/09', '07/09', '08/09'] as const

/** Nhãn trục tháng của biểu đồ thu - chi ngân sách. */
export const THANG = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4'] as const

export const TTHC_TIEP_NHAN = [38, 49, 35, 56, 45, 66, 52, 73] as const
export const TTHC_DA_GIAI_QUYET = [31, 42, 28, 49, 38, 56, 45, 66] as const

export const THU_NGAN_SACH = [5.6, 7.3, 5.2, 6.6, 8.4, 10.4] as const
export const CHI_NGAN_SACH = [3.8, 4.5, 3.8, 4.2, 4.9, 5.2] as const

export const TY_LE_TTHC = [
  ['Đúng hạn', 1392, '#12A150'],
  ['Đang xử lý', 38, '#D97E06'],
  ['Quá hạn', 11, '#D93843'],
] as const

export const DAN_CU = [
  ['Trong độ tuổi LĐ', 34700, '#1B66E0'],
  ['Trẻ em (0-14)', 12800, '#E255A1'],
  ['Người cao tuổi (≥60)', 7510, '#D97E06'],
] as const

export const HOAT_DONG = [
  ['09:41', 'Phê duyệt hồ sơ TTHC-2026-1402 (chứng thực)'],
  ['09:12', 'AI phân loại 6 văn bản đến, 1 mức Khẩn'],
  ['08:30', 'Đồng bộ 38 hồ sơ mới từ DVC Quốc gia'],
  ['07:30', 'AI gửi bản tin sáng cho 4 lãnh đạo'],
] as const

/** Bốn dòng chỉ số của card "Phản ánh hiện trường". */
export const PHAN_ANH_HIEN_TRUONG = [
  {
    icon: 'doc',
    nen: 'var(--tint-brand)',
    mau: 'var(--brand)',
    nhan: 'Tổng phản ánh',
    giaTri: '30',
    d: 4,
    inv: true,
  },
  { icon: 'check', nen: 'var(--tint-ok)', mau: 'var(--ok)', nhan: 'Đã xử lý', giaTri: '17', d: 11 },
  { icon: 'clock', nen: 'var(--tint-warn)', mau: 'var(--warn)', nhan: 'Đang xử lý', giaTri: '9', d: -14 },
  { icon: 'warn', nen: 'var(--tint-danger)', mau: 'var(--danger)', nhan: 'Quá hạn', giaTri: '4', d: -50 },
] as const

export const AN_NINH_TRAT_TU = [
  {
    icon: 'shield',
    nen: 'var(--tint-danger)',
    mau: 'var(--danger)',
    nhan: 'Số vụ việc',
    giaTri: '9',
    d: -25,
    inv: true,
  },
  {
    icon: 'people',
    nen: 'var(--tint-brand)',
    mau: 'var(--brand)',
    nhan: 'Tuần tra, kiểm soát',
    giaTri: '52 lượt',
    d: 12,
  },
  {
    icon: 'cam',
    nen: 'var(--tint-accent)',
    mau: 'var(--accent)',
    nhan: 'Camera giám sát',
    giaTri: '86',
    d: 0,
  },
  {
    icon: 'warn',
    nen: 'var(--tint-warn)',
    mau: 'var(--warn)',
    nhan: 'Vi phạm đã xử lý',
    giaTri: '7',
    d: -33,
    inv: true,
  },
] as const

export const HA_TANG_DO_THI = [
  {
    icon: 'road',
    nen: 'var(--tint-brand)',
    mau: 'var(--brand)',
    nhan: 'Đường trục phường/khu phố',
    giaTri: '54 tuyến',
    d: 0,
  },
  {
    icon: 'tree',
    nen: 'var(--tint-ok)',
    mau: 'var(--ok)',
    nhan: 'Đường khu phố cứng hóa',
    giaTri: '96%',
    d: 2,
  },
  { icon: 'bulb', nen: 'var(--tint-warn)', mau: 'var(--warn)', nhan: 'Chiếu sáng hẻm', giaTri: '92%', d: 3 },
  {
    icon: 'drop',
    nen: 'var(--tint-teal)',
    mau: 'var(--teal)',
    nhan: 'Nước sạch hợp VS',
    giaTri: '99,2%',
    d: 0,
  },
] as const

export const Y_TE_GIAO_DUC = [
  {
    icon: 'med',
    nen: 'var(--tint-danger)',
    mau: 'var(--danger)',
    nhan: 'Trạm y tế đạt chuẩn',
    giaTri: '02',
    d: 0,
  },
  { icon: 'grad', nen: 'var(--tint-brand)', mau: 'var(--brand)', nhan: 'Trường học', giaTri: '07', d: 0 },
  {
    icon: 'check',
    nen: 'var(--tint-ok)',
    mau: 'var(--ok)',
    nhan: 'Lượt khám / tháng',
    giaTri: '2.240',
    d: 9,
  },
  {
    icon: 'people',
    nen: 'var(--tint-accent)',
    mau: 'var(--accent)',
    nhan: 'Học sinh',
    giaTri: '6.360',
    d: 3,
  },
] as const

/** Bốn dòng của card "Liên thông hệ thống" — giữ nguyên dấu gạch dài của bản gốc. */
export const LIEN_THONG = [
  ['IOC Tỉnh/TP — ', 'realtime ✓'],
  ['LGSP / NDXP — ', 'kết nối ✓'],
  ['CSDL Dân cư — ', 'đồng bộ 05:58 ✓'],
  ['DVC Quốc gia — ', 'hoạt động ✓'],
] as const

/** Ba gạch đầu dòng của bản tin AI 07:30. */
export const BAN_TIN_AI = [
  ['3 việc khẩn:', '2 hồ sơ TTHC quá hạn, 1 phản ánh môi trường vùng mãng cầu.'],
  ['5 chỉ tiêu cần lưu ý:', 'DVC trực tuyến 67% (MT 80%)…'],
  ['Cảnh báo:', 'Kênh N4 vượt báo động 1 · SXH khu phố 5 vượt ngưỡng.'],
] as const
