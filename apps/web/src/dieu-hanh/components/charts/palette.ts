/** CH_COLORS của bản gốc — thứ tự quyết định màu mặc định của từng chuỗi. */
export const CH_COLORS = [
  '#1B66E0',
  '#12A150',
  '#D97E06',
  '#7C3AED',
  '#0E9488',
  '#D93843',
  '#5A6B7F',
  '#B7791F',
] as const

/**
 * Chuỗi dữ liệu [nhãn, giá trị, màu?, nhãnGiaTri?] giống mảng bản gốc truyền vào chart.
 * Phần tử thứ 4 chỉ barSVG() dùng: ghi đè chữ trên đầu cột (bản gốc hiện giá trị thực
 * trong khi chiều cao cột là % đạt kế hoạch).
 */
export type MucChart = readonly [string, number, string?, string?]

export const mauMuc = (m: MucChart, i: number): string => m[2] ?? CH_COLORS[i % CH_COLORS.length]!
