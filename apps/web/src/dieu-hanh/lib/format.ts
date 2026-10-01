/** Định dạng số kiểu Việt Nam: 55010 → "55.010", 96.6 → "96,6". */
export const soVN = (v: number, soLeToiDa = 1): string =>
  v.toLocaleString('vi-VN', { maximumFractionDigits: soLeToiDa })

/** Bản gốc dùng NICE(): làm tròn 1 số lẻ rồi format theo locale vi. */
export const nice = (v: number): string => soVN(Number(Number(v).toFixed(1)))

/** Ngày giờ trên thanh trên cùng — bản gốc: toLocaleDateString('vi-VN') + ' · ' + giờ. */
export const ngayGioVN = (d: Date): string =>
  `${d.toLocaleDateString('vi-VN')} · ${d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`

export const ngayVN = (d: Date): string => d.toLocaleDateString('vi-VN')

/** Phần trăm làm tròn — dùng cho legend donut, giống Math.round của bản gốc. */
export const phanTram = (phan: number, tong: number): number =>
  tong === 0 ? 0 : Math.round((phan / tong) * 100)

/**
 * Số lẻ cố định — tương đương fmt(n, d) của Dashboard Xã/Phường:
 * min = max = d, nên 100 với d=2 ra "100,00".
 */
export const soCoDinh = (v: number, d = 0): string =>
  Number(v).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
