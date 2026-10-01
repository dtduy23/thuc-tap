/** Số liệu bản gốc viết thẳng trong hàm `V.phananh`. */

export const TRANG_THAI_XU_LY = [
  ['Đã giải quyết', 17, '#12A150'],
  ['Đang xử lý', 9, '#1B66E0'],
  ['Mới tiếp nhận', 4, '#D97E06'],
] as const

export const THEO_LINH_VUC = [
  ['Hạ tầng', 11, '#1B66E0'],
  ['Môi trường', 8, '#12A150'],
  ['ANTT', 6, '#D93843'],
  ['Giao th', 5, '#D97E06'],
] as const

export const XU_HUONG = [12, 15, 11, 18, 14, 17] as const
export const THANG = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4'] as const

/** Bản gốc suy hạt ảnh từ 3 ký tự cuối mã phản ánh. */
export const hatAnh = (id: string, k: number) => Number.parseInt(id.slice(-3), 10) * 7 + k

/** Gợi ý phân công theo lĩnh vực — port nguyên điều kiện của bản gốc. */
export const goiYPhanCong = (linhVuc: string): string =>
  linhVuc === 'ANTT'
    ? 'Công an phường (chủ trì), Tổ dân phố phối hợp'
    : linhVuc === 'Hạ tầng đô thị'
      ? 'Bộ phận Đô thị (chủ trì), phối hợp Điện lực'
      : 'Bộ phận Đô thị - Môi trường'

export const DON_VI_XU_LY = [
  'Bộ phận Đô thị - Môi trường',
  'Công an phường',
  'Địa chính - Xây dựng',
  'Tổ dân phố sở tại',
] as const
